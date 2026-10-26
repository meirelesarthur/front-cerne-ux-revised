// src/pages/BaseRegistrations/Troughs/index.tsx
// -----------------------------------------------------------------------------
// Tela de LISTAGEM (grid paginada, COM filtro textual) de Cochos (Trough) —
// Cadastros Base / Pecuários. Rota: /cadastros-base/cochos (guardada por
// `troughs_view`, já registrada em `router/index.tsx`, TASK-FE-2204).
//
// Diferente de Lote/Módulo/Lote/Área (sem filtro, sem edição), Cochos TEM
// busca textual (mirror `index()` legado — código/descrição/área/módulo) E
// edição real (a API tem PUT) — molde estrutural mais próximo de
// `CadastrosBase/CentroCusto/index.tsx` (grid + filtro lateral + 3 ações de
// linha + `useGridSettings`) do que de `Grazings/index.tsx` (sem filtro).
//
// Colunas: Código, Descrição, Tipo (badge Coberto/Descoberto), Localização
// (1 coluna composta — Área/Módulo Pastejo/Curral, o que estiver preenchido,
// "—" se nenhum — decisão D-FE-3 do contrato de tela), Ativo (badge
// Ativo/Inativo, regra global 4). Ações de linha: Visualizar (→
// `/:uuid/detalhe`, tela NOVA) + Editar (→ `/:uuid`) + Excluir (física,
// `DeleteConfirmDialog` com o texto PADRÃO — diferente de Lote/Módulo/Área,
// que usam texto não-destrutivo).
// -----------------------------------------------------------------------------

import { useMemo, useState, type ElementType } from 'react';

import { Badge, Box, Flex, Icon, Text, useDisclosure } from '@chakra-ui/react';
import { createColumnHelper } from '@tanstack/react-table';
import { Package } from 'lucide-react';
import { FiEdit, FiEye, FiTrash2 } from 'react-icons/fi';
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
import { troughTypeOptions } from '@/constants/Trough/options/trough-type-options';

import { deleteTrough, listTroughs } from '@/services/v2/BaseRegistrations/troughs-service';

import type { TroughListItem, TroughsFilterForm } from '@/@types/v2/BaseRegistrations/troughs';

import { FilterSideTroughs } from './FilterSideTroughs';
import { HeaderTable } from './HeaderTable';

import { PageHeader } from '@/components/ui/PageHeader';

// Chave de storage desta tela. Paginação (`userPaginatedQuery`) e
// personalização de grid (`useGridSettings`) derivam da MESMA expressão
// estável para nunca divergirem — mirror `CentroCusto/index.tsx`.
const TROUGHS_STORAGE_KEY = 'BaseRegistrationsTroughs' + queryKey.troughs.troughsList;

// Coluna "Localização" composta (D-FE-3 do contrato de tela) — Área/Módulo
// Pastejo/Curral, o que estiver preenchido; "—" se nenhum. Área e Módulo
// Pastejo são mutuamente exclusivos (regra XOR do formulário), mas o Curral
// é independente dos 2 — por isso a junção suporta mais de 1 parte presente.
function getLocationLabel(row: TroughListItem): string {
  const parts: string[] = [];
  if (row.area) parts.push(row.area.description);
  if (row.grazing) parts.push(row.grazing.description);
  if (row.feedlot_corral) parts.push(row.feedlot_corral.identification);
  return parts.length > 0 ? parts.join(' · ') : '—';
}

export default function TroughsList() {
  const { languageGB } = useLanguage();
  const navigate = useNavigate();
  const { can } = usePermissions();
  const text = languageGB.baseRegistrations.trough;

  const canCreate = can('troughs_create');
  const canEdit = can('troughs_edit');
  const canDelete = can('troughs_delete');

  const defaultQueryOptions = useMemo(
    () => ({
      pageSize: 10,
      storageKey: TROUGHS_STORAGE_KEY,
    }),
    []
  );

  const { paginatedQuery, handlePaginatedQuery, handleFilterChange, handleResetFilter } =
    userPaginatedQuery<TroughsFilterForm>(defaultQueryOptions);

  // ---- Estado de filtro (drawer) ------------------------------------------
  const { open: isFilterOpen, onOpen: onOpenFilter, onClose: onCloseFilter } = useDisclosure();

  const filtersApplied = useMemo(
    () =>
      Object.values(paginatedQuery.filter ?? {}).filter(
        (v) => v !== undefined && v !== null && v !== '' && v !== false
      ).length,
    [paginatedQuery.filter]
  );

  // ---- Estado de exclusão --------------------------------------------------
  const [toDelete, setToDelete] = useState<TroughListItem | null>(null);
  const {
    open: isOpenDeleteDialog,
    onOpen: onOpenDeleteDialog,
    onClose: onCloseDeleteDialog,
  } = useDisclosure();

  const troughsList = useCustomGridQuery<TroughListItem, TroughsFilterForm>({
    asyncFunction: listTroughs,
    queryKey: queryKey.troughs.troughsList,
    paginatedQuery,
    setPaginatedQuery: handlePaginatedQuery,
    filterQuery: [],
    filter: paginatedQuery.filter ?? ({} as TroughsFilterForm),
  });

  // Exclusão FÍSICA (contrato de API §1.2 item 5, sem soft delete) — texto
  // PADRÃO do `DeleteConfirmDialog` ("esta ação não pode ser desfeita"),
  // diferente de Lote/Módulo/Lote/Área. `useRequest` cobre bem este caso: o
  // 422 de Cochos não tem shape estruturado `errors.in_use` (diferente de
  // Grazing), então o `onError` genérico (leitura de `message`/`errors`) já
  // é suficiente.
  const deleteMutation = useRequest({
    asyncFunction: async ({ troughUuid }: { troughUuid: string }) => {
      return await deleteTrough(troughUuid);
    },
    queryKey: queryKey.troughs.troughsList,
    queryKey2: queryKey.troughs.trough,
    typesRequest: 'update',
    entityName: text.singularLabel,
    personalizedMessage: text.list.deletedToast,
    actionSuccess: () => {
      onCloseDeleteDialog();
      setToDelete(null);
    },
  });

  const handleDeleteClick = (trough: TroughListItem) => {
    setToDelete(trough);
    onOpenDeleteDialog();
  };

  const handleConfirmDelete = () => {
    if (toDelete) {
      deleteMutation.mutate({ troughUuid: toDelete.uuid });
    }
  };

  const isDeleting = deleteMutation.isPending;

  const columnHelper = createColumnHelper<TroughListItem>();
  const defaultColumns = useMemo(
    () => [
      columnHelper.accessor('code', {
        header: text.list.table.code,
        enableHiding: false,
        meta: { gridLabel: text.list.table.code },
        cell: ({ row }) => <Text fontWeight="medium">{row.original.code}</Text>,
      }),
      columnHelper.accessor('description', {
        header: text.list.table.description,
        enableHiding: false,
        meta: { gridLabel: text.list.table.description },
        cell: ({ row }) => (
          <Text fontWeight="medium" lineClamp="1">
            {row.original.description}
          </Text>
        ),
      }),
      columnHelper.accessor('type', {
        header: text.list.table.type,
        meta: { ...styleColumTable.sm, gridLabel: text.list.table.type },
        cell: ({ row }) => (
          <Badge colorPalette={row.original.type === 'A' ? 'blue' : 'gray'} variant="subtle">
            {troughTypeOptions.getLabel(row.original.type, languageGB)}
          </Badge>
        ),
      }),
      columnHelper.accessor((row) => getLocationLabel(row), {
        id: 'location',
        header: text.list.table.location,
        meta: { gridLabel: text.list.table.location },
        cell: ({ row }) => (
          <Text
            fontSize="sm"
            color={
              row.original.area || row.original.grazing || row.original.feedlot_corral
                ? undefined
                : 'fg.muted'
            }
          >
            {getLocationLabel(row.original)}
          </Text>
        ),
      }),
      columnHelper.accessor('is_enabled', {
        header: text.list.table.active,
        meta: { ...styleColumTable.sm, gridLabel: text.list.table.active },
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
                onClick={() => navigate(`/cadastros-base/cochos/${row.original.uuid}/detalhe`)}
              >
                {text.list.actions.view}
              </Actions.Item>
              {canEdit && (
                <Actions.Item
                  icon={<Icon as={FiEdit} />}
                  onClick={() => navigate(`/cadastros-base/cochos/${row.original.uuid}`)}
                >
                  {text.list.actions.edit}
                </Actions.Item>
              )}
              {canDelete && (
                <>
                  <Actions.Separator />
                  <Actions.Item
                    icon={<Icon as={FiTrash2} />}
                    onClick={() => handleDeleteClick(row.original)}
                    tone="danger"
                    disabled={isDeleting}
                  >
                    {text.list.actions.delete}
                  </Actions.Item>
                </>
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
    [navigate, isDeleting, languageGB, text, canEdit, canDelete]
  );

  const gridSettings = useGridSettings<TroughListItem>({
    storageKey: TROUGHS_STORAGE_KEY,
    storageScope: useGridStorageScope(),
    columns: defaultColumns,
  });
  const { columnOrder, setColumnOrder, columnVisibility, setColumnVisibility } = gridSettings;

  const isLoading = checkLoadingStatus([troughsList]);
  const items = troughsList.data?.data?.items;
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
            isError={troughsList.isError}
            error={troughsList.error}
            isEmpty={isEmpty}
            onRetry={() => troughsList.refetch()}
            isRetrying={troughsList.isFetching}
            emptyIcon={Package as ElementType}
            emptyTitle={
              filtersApplied > 0 ? text.list.emptyState.titleFiltered : text.list.emptyState.titleEmpty
            }
            emptyDescription={
              filtersApplied > 0
                ? text.list.emptyState.descriptionFiltered
                : text.list.emptyState.descriptionEmpty
            }
            canCreate={filtersApplied === 0 && canCreate}
            createLabel={text.list.emptyState.cta}
            onCreate={() => navigate('/cadastros-base/cochos/novo')}
          />
        </Box>
      </TableProvider>

      <FilterSideTroughs
        isOpen={isFilterOpen}
        onClose={onCloseFilter}
        handleFilterChange={handleFilterChange}
        handleReset={handleResetFilter}
        filter={paginatedQuery.filter}
        languageGB={languageGB}
        filtersApplied={filtersApplied}
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
        tone="danger"
      />
    </ContainerGrid>
  );
}
