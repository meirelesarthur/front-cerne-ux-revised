// src/pages/BaseRegistrations/LowReasons/index.tsx
// -----------------------------------------------------------------------------
// Tela de LISTAGEM (grid FLAT — sem hierarquia) de MOTIVOS DE BAIXA
// (LowReason) — Cadastros Base / Financeiros.
// Rota: /cadastros-base/motivos-de-baixa (guardada por `lowreasons_view`,
// registrada em src/router/index.tsx — este arquivo não mexe em rota/menu).
//
// Estrutura (padrão modular BaseRegistrations, espelho de DiagnosisPregnancy):
//   - grid via useCustomGridQuery inline (paginação REAL server-side);
//   - HeaderTable → botões de ação (Add respeita lowreasons_create);
//   - FilterSideLowReasons → drawer (search/is_enabled/do_movement), COM
//     re-hidratação ao reabrir (ver o próprio arquivo do filtro);
//   - delete via useRequest + DeleteConfirmDialog (respeita
//     lowreasons_delete; onError GENÉRICO do useRequest já exibe a `message`
//     real do 422 "em uso" — DA-LR-04).
// -----------------------------------------------------------------------------

import { ElementType, useMemo, useState } from 'react';

import { Badge, Box, Flex, Icon, Text, useDisclosure } from '@chakra-ui/react';
import { createColumnHelper } from '@tanstack/react-table';
import { FiEdit, FiEye, FiMinusCircle, FiTrash2 } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

import { Actions } from '@/components/Action';
import { ContainerGrid } from '@/components/ContainerGrid';
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';
import { HeaderGrid } from '@/components/HeaderGrid';
import { Table } from '@/components/Table';

import { TableProvider } from '@/contexts/TableContext';

import { useCustomGridQuery } from '@/hooks/useCustomGridQuery';
import { useGridSettings } from '@/hooks/useGridSettings';
import { useGridStorageScope } from '@/hooks/useGridStorageScope';
import { useLanguage } from '@/hooks/useLanguage';
import { userPaginatedQuery } from '@/hooks/usePaginatedQueryStorage';
import { usePermissions } from '@/hooks/usePermissions';
import { useRequest } from '@/hooks/useRequest';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import { styleColumTable } from '@/utils/style-colum-table';

import { queryKey } from '@/constants/query-key';

import {
  deleteLowReason,
  listLowReasons,
} from '@/services/v2/BaseRegistrations/lowReasons-service';

import type {
  LowReasonFilterForm,
  LowReasonListItem,
} from '@/@types/v2/BaseRegistrations/lowReasons';

import { FilterSideLowReasons } from './FilterSideLowReasons';
import { HeaderTable } from './HeaderTable';

import { PageHeader } from '@/components/ui/PageHeader';

// Chave de storage desta tela. Paginação (`userPaginatedQuery`) e
// personalização de grid (`useGridSettings`) derivam da MESMA expressão para
// nunca divergirem — mesmo padrão de CadastrosBase/CentroCusto (DEC-007 §12).
const LOW_REASONS_STORAGE_KEY =
  'BaseRegistrationsLowReasons' + queryKey.baseRegistrations.lowReasons;

export default function LowReasonsList() {
  const { languageGB } = useLanguage();
  const navigate = useNavigate();
  const { can } = usePermissions();
  const text = languageGB.baseRegistrations.lowReason;

  const canCreate = can('lowreasons_create');
  const canEdit = can('lowreasons_edit');
  const canDelete = can('lowreasons_delete');

  const defaultQueryOptions = useMemo(
    () => ({
      pageSize: 10,
      storageKey: LOW_REASONS_STORAGE_KEY,
    }),
    []
  );

  const { paginatedQuery, handlePaginatedQuery, handleFilterChange, handleResetFilter } =
    userPaginatedQuery<LowReasonFilterForm>(defaultQueryOptions);

  // ---- Estado de filtro (drawer) ------------------------------------------
  const { open: isFilterOpen, onOpen: onOpenFilter, onClose: onCloseFilter } = useDisclosure();

  const filtersApplied = useMemo(
    () =>
      Object.values(paginatedQuery.filter ?? {}).filter(
        (v) => v !== undefined && v !== null && v !== ''
      ).length,
    [paginatedQuery.filter]
  );

  // ---- Estado de exclusão --------------------------------------------------
  const [toDelete, setToDelete] = useState<LowReasonListItem | null>(null);
  const {
    open: isOpenDeleteDialog,
    onOpen: onOpenDeleteDialog,
    onClose: onCloseDeleteDialog,
  } = useDisclosure();

  const lowReasonsList = useCustomGridQuery<LowReasonListItem, LowReasonFilterForm>({
    asyncFunction: listLowReasons,
    queryKey: queryKey.baseRegistrations.lowReasons,
    paginatedQuery,
    setPaginatedQuery: handlePaginatedQuery,
    filterQuery: [],
    filter: paginatedQuery.filter ?? ({} as LowReasonFilterForm),
  });

  const deleteMutation = useRequest({
    asyncFunction: async ({ lowReasonUuid }: { lowReasonUuid: string }) => {
      return await deleteLowReason(lowReasonUuid);
    },
    queryKey: queryKey.baseRegistrations.lowReasons,
    queryKey2: queryKey.baseRegistrations.lowReason,
    // `useRequest`'s TypesRequest não tem variante "delete" (só update/create/
    // apply/export/revoke/restore) — "update" é a mesma convenção usada por
    // CostCenters/Species/Perfil para a mesma operação. O texto exibido no
    // toast vem de `personalizedMessage`, então o rótulo genérico associado a
    // "update" nunca aparece ao usuário.
    //
    // onError: NÃO customizado — usa o tratamento genérico interno do
    // useRequest (lê `message`/`error` do envelope). O backend real emite 422
    // estruturado "Motivo de baixa está em uso (baixas vinculadas) e não pode
    // ser excluído." (DA-LR-04, guarda dupla hasDependents()+catch 23503) —
    // o toast genérico já mostra a mensagem certa.
    typesRequest: 'update',
    entityName: text.singularLabel,
    personalizedMessage: text.list.deletedToast,
    actionSuccess: () => {
      onCloseDeleteDialog();
      setToDelete(null);
    },
  });

  const handleDeleteClick = (lowReason: LowReasonListItem) => {
    setToDelete(lowReason);
    onOpenDeleteDialog();
  };

  const handleConfirmDelete = () => {
    if (toDelete) {
      deleteMutation.mutate({ lowReasonUuid: toDelete.uuid });
    }
  };

  const isDeleting = deleteMutation.isPending;

  const columnHelper = createColumnHelper<LowReasonListItem>();
  const defaultColumns = useMemo(
    () => [
      columnHelper.accessor('code', {
        header: text.list.table.code,
        cell: ({ row }) => (
          <Text fontFamily="mono" fontSize="sm" fontWeight="medium">
            {row.original.code}
          </Text>
        ),
        meta: { ...styleColumTable.sm, gridLabel: text.list.table.code },
      }),
      columnHelper.accessor('description', {
        header: text.list.table.description,
        meta: { gridLabel: text.list.table.description },
        cell: ({ row }) => (
          <Text fontWeight="medium" lineClamp="1">
            {row.original.description}
          </Text>
        ),
      }),
      columnHelper.accessor('do_movement', {
        header: text.list.table.doMovement,
        cell: ({ row }) => (
          <Badge
            colorPalette={row.original.do_movement ? 'info' : 'gray'}
            variant="subtle"
            py={1}
            px={3}
          >
            {row.original.do_movement
              ? text.list.table.doMovementYes
              : text.list.table.doMovementNo}
          </Badge>
        ),
        meta: { ...styleColumTable.sm, gridLabel: text.list.table.doMovement },
      }),
      columnHelper.accessor('is_enabled', {
        header: text.list.table.isEnabled,
        cell: ({ row }) => (
          <Badge
            colorPalette={row.original.is_enabled ? 'green' : 'gray'}
            variant="subtle"
            py={1}
            px={3}
          >
            {row.original.is_enabled ? text.list.table.active : text.list.table.inactive}
          </Badge>
        ),
        meta: { ...styleColumTable.sm, gridLabel: text.list.table.isEnabled },
      }),
      columnHelper.display({
        id: 'acoes',
        header: '',
        enableHiding: false,
        cell: ({ row }) => (
          <Flex justify="flex-end">
            <Actions size="sm">
              <Actions.Item
                icon={<Icon as={FiEye} />}
                onClick={() =>
                  navigate(`/cadastros-base/motivos-de-baixa/${row.original.uuid}/detalhe`)
                }
              >
                {text.list.actions.view}
              </Actions.Item>
              {canEdit && (
                <Actions.Item
                  icon={<Icon as={FiEdit} />}
                  onClick={() => navigate(`/cadastros-base/motivos-de-baixa/${row.original.uuid}`)}
                >
                  {text.list.actions.edit}
                </Actions.Item>
              )}
              {canDelete && (
                <Actions.Item
                  icon={<Icon as={FiTrash2} />}
                  onClick={() => handleDeleteClick(row.original)}
                  color="red.400"
                  disabled={isDeleting}
                >
                  {text.list.actions.delete}
                </Actions.Item>
              )}
            </Actions>
          </Flex>
        ),
        meta: {
          ...styleColumTable.sm,
          gridLabel: languageGB.defaltStrings.actions,
          gridOrder: 'fixed-end',
          gridDataColumn: false,
        },
      }),
    ],
    [navigate, isDeleting, languageGB.defaltStrings.actions, text, canEdit, canDelete]
  );

  const gridSettings = useGridSettings<LowReasonListItem>({
    storageKey: LOW_REASONS_STORAGE_KEY,
    storageScope: useGridStorageScope(),
    columns: defaultColumns,
  });
  const { columnOrder, setColumnOrder, columnVisibility, setColumnVisibility } = gridSettings;

  const isLoading = checkLoadingStatus([lowReasonsList]);
  const items = lowReasonsList.data?.data?.items;
  const isEmpty = !isLoading && (items?.length ?? 0) === 0;

  return (
    <ContainerGrid>
      <TableProvider
        data={items}
        columns={defaultColumns}
        pagination={paginatedQuery}
        setPagination={handlePaginatedQuery}
        enableMultiRowSelection={false}
        columnOrder={columnOrder}
        onColumnOrderChange={setColumnOrder}
        columnVisibility={columnVisibility}
        setColumnVisibility={setColumnVisibility}
      >
        <HeaderGrid
          header={
            <HeaderTable
              onOpenFilter={onOpenFilter}
              filtersApplied={filtersApplied}
              languageGB={languageGB}
              gridSettings={gridSettings}
            />
          }
        >
          <PageHeader title={text.list.pageTitle} description={text.list.pageSubtitle} />
        </HeaderGrid>

        <Box mt={6}>
          <Table
            isLoading={isLoading}
            isError={lowReasonsList.isError}
            error={lowReasonsList.error}
            isEmpty={isEmpty}
            onRetry={() => lowReasonsList.refetch()}
            isRetrying={lowReasonsList.isFetching}
            emptyIcon={FiMinusCircle as ElementType}
            emptyTitle={
              filtersApplied > 0
                ? text.list.emptyState.titleFiltered
                : canCreate
                  ? text.list.emptyState.titleEmpty
                  : text.list.emptyState.titleEmptyNoCreate
            }
            emptyDescription={
              filtersApplied > 0
                ? text.list.emptyState.descriptionFiltered
                : canCreate
                  ? text.list.emptyState.descriptionEmpty
                  : text.list.emptyState.descriptionEmptyNoCreate
            }
            canCreate={filtersApplied === 0 && canCreate}
            createLabel={text.list.emptyState.cta}
            onCreate={() => navigate('/cadastros-base/motivos-de-baixa/novo')}
          />
        </Box>
      </TableProvider>

      <FilterSideLowReasons
        isOpen={isFilterOpen}
        onClose={onCloseFilter}
        handleFilterChange={handleFilterChange}
        handleReset={handleResetFilter}
        filter={paginatedQuery.filter}
        languageGB={languageGB}
      />

      <DeleteConfirmDialog
        isOpen={isOpenDeleteDialog}
        onClose={() => {
          onCloseDeleteDialog();
          setToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        isLoading={isDeleting}
        itemName={toDelete?.description}
      />
    </ContainerGrid>
  );
}
