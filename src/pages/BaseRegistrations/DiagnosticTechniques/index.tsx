// src/pages/BaseRegistrations/DiagnosticTechniques/index.tsx
// -----------------------------------------------------------------------------
// Tela de LISTAGEM (grid FLAT — sem hierarquia, SEM paginação real) de
// TÉCNICAS DIAGNÓSTICO (DiagnosticTechnique) — Cadastros Base.
// Rota: /cadastros-base/tecnicas-diagnostico (guardada por
// `diagnostic_techniques_view`, registrada em src/router/index.tsx —
// este arquivo não mexe em rota/menu).
//
// Fidelidade ao legado: grade legada com EXATAMENTE 3 colunas
// (Descrição | Ativo | Ação). Filtro aditivo com SÓ `search` (a API só aceita
// `search`; NENHUM Select de is_enabled). Delete via useRequest +
// DeleteConfirmDialog. Grid via `useCustomGridQuery` inline (padrão modular,
// mesmo shape de BaseRegistrations/DiagnosisPregnancy).
// -----------------------------------------------------------------------------

import { useMemo, useState } from 'react';
import type { ElementType } from 'react';

import { Badge, Box, Flex, Icon, Text, useDisclosure, VStack } from '@chakra-ui/react';
import { createColumnHelper } from '@tanstack/react-table';
import { FiActivity, FiEdit, FiTrash2 } from 'react-icons/fi';
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
  deleteDiagnosticTechnique,
  listDiagnosticTechniques,
} from '@/services/v2/BaseRegistrations/diagnosticTechnique-service';

import type {
  DiagnosticTechniqueFilterForm,
  DiagnosticTechniqueListItem,
} from '@/@types/v2/BaseRegistrations/diagnosticTechnique';

import { FilterSideDiagnosticTechniques } from './FilterSideDiagnosticTechniques';
import { HeaderTable } from './HeaderTable';

// Chave de storage desta tela para a personalização de grid (`useGridSettings`).
// String estável e independente de i18n para não invalidar a preferência do
// usuário quando o idioma muda.
const DIAGNOSTIC_TECHNIQUES_STORAGE_KEY = 'GBCerneBaseRegistrationsDiagnosticTechniques';

export default function DiagnosticTechniquesList() {
  const { languageGB } = useLanguage();
  const navigate = useNavigate();
  const { can } = usePermissions();
  const text = languageGB.baseRegistrations.diagnosticTechnique;

  const canCreate = can('diagnostic_techniques_create');
  const canEdit = can('diagnostic_techniques_edit');
  const canDelete = can('diagnostic_techniques_delete');

  const defaultQueryOptions = useMemo(
    () => ({
      pageSize: 10,
      storageKey:
        languageGB.baseRegistrations.titleModule + queryKey.baseRegistrations.diagnosticTechniques,
    }),
    []
  );

  const { paginatedQuery, handlePaginatedQuery, handleFilterChange, handleResetFilter } =
    userPaginatedQuery<DiagnosticTechniqueFilterForm>(defaultQueryOptions);

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
  const [toDelete, setToDelete] = useState<DiagnosticTechniqueListItem | null>(null);
  const {
    open: isOpenDeleteDialog,
    onOpen: onOpenDeleteDialog,
    onClose: onCloseDeleteDialog,
  } = useDisclosure();

  // Grid via `useCustomGridQuery` inline — o adaptador `listDiagnosticTechniques`
  // já converte o envelope `meta:null` (recurso não pagina) para o shape
  // `ResponsePagination` que este hook espera (1 única página, array inteiro),
  // mesmo racional de Species/DiagnosisPregnancy.
  const diagnosticTechniquesList = useCustomGridQuery<
    DiagnosticTechniqueListItem,
    DiagnosticTechniqueFilterForm
  >({
    asyncFunction: listDiagnosticTechniques,
    queryKey: queryKey.baseRegistrations.diagnosticTechniques,
    paginatedQuery,
    setPaginatedQuery: handlePaginatedQuery,
    filterQuery: [],
    filter: paginatedQuery.filter ?? ({} as DiagnosticTechniqueFilterForm),
  });

  const deleteMutation = useRequest({
    asyncFunction: async ({ diagnosticTechniqueUuid }: { diagnosticTechniqueUuid: string }) => {
      return await deleteDiagnosticTechnique(diagnosticTechniqueUuid);
    },
    queryKey: queryKey.baseRegistrations.diagnosticTechniques,
    queryKey2: queryKey.baseRegistrations.diagnosticTechnique,
    // `useRequest`'s TypesRequest não tem variante "delete" (só update/create/
    // apply/export/revoke/restore) — "update" é a mesma convenção usada por
    // Species/DiagnosisPregnancy para a mesma operação. O texto exibido no toast
    // vem de `personalizedMessage`, então o rótulo genérico associado a "update"
    // nunca aparece ao usuário.
    //
    // onError: NÃO customizado — usa o tratamento genérico interno do
    // useRequest (lê `message`/`error` do envelope).
    typesRequest: 'update',
    entityName: text.singularLabel,
    personalizedMessage: text.list.deletedToast,
    actionSuccess: () => {
      onCloseDeleteDialog();
      setToDelete(null);
    },
  });

  const handleDeleteClick = (diagnosticTechnique: DiagnosticTechniqueListItem) => {
    setToDelete(diagnosticTechnique);
    onOpenDeleteDialog();
  };

  const handleConfirmDelete = () => {
    if (toDelete) {
      deleteMutation.mutate({ diagnosticTechniqueUuid: toDelete.uuid });
    }
  };

  const isDeleting = deleteMutation.isPending;

  const columnHelper = createColumnHelper<DiagnosticTechniqueListItem>();
  const defaultColumns = useMemo(
    () => [
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
      columnHelper.accessor('is_enabled', {
        header: text.list.table.status,
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
        meta: { ...styleColumTable.sm, gridLabel: text.list.table.status },
      }),
      columnHelper.display({
        id: 'acoes',
        header: '',
        enableHiding: false,
        cell: ({ row }) => (
          <Flex justify="flex-end">
            <Actions size="sm">
              {canEdit && (
                <Actions.Item
                  icon={<Icon as={FiEdit} />}
                  onClick={() =>
                    navigate(`/cadastros-base/tecnicas-diagnostico/${row.original.uuid}`)
                  }
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
    [navigate, isDeleting, text, canEdit, canDelete, languageGB.defaltStrings.actions]
  );

  const gridSettings = useGridSettings<DiagnosticTechniqueListItem>({
    storageKey: DIAGNOSTIC_TECHNIQUES_STORAGE_KEY,
    storageScope: useGridStorageScope(),
    columns: defaultColumns,
  });
  const { columnOrder, setColumnOrder, columnVisibility, setColumnVisibility } = gridSettings;

  const isLoading = checkLoadingStatus([diagnosticTechniquesList]);
  const items = diagnosticTechniquesList.data?.data?.items;
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
          <VStack align="flex-start" gap={1}>
            <Text fontSize="2xl" fontWeight="bold" color="brandColorText">
              {text.list.pageTitle}
            </Text>
            <Text fontSize="sm" color="fg.muted">
              {text.list.pageSubtitle}
            </Text>
          </VStack>
        </HeaderGrid>

        <Box mt={6}>
          <Table
            isLoading={isLoading}
            isError={diagnosticTechniquesList.isError}
            error={diagnosticTechniquesList.error}
            isEmpty={isEmpty}
            onRetry={() => diagnosticTechniquesList.refetch()}
            isRetrying={diagnosticTechniquesList.isFetching}
            emptyIcon={FiActivity as ElementType}
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
            onCreate={() => navigate('/cadastros-base/tecnicas-diagnostico/novo')}
          />
        </Box>
      </TableProvider>

      <FilterSideDiagnosticTechniques
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
