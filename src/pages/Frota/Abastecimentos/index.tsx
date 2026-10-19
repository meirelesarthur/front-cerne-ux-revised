// src/pages/Frota/Abastecimentos/index.tsx
// -----------------------------------------------------------------------------
// Tela de LISTAGEM (grid) de Abastecimentos (Supply) — Tarefa 40. PRIMEIRA
// tela real do módulo `/frota/*` (hoje 100% `<RoutePlaceholder />`). Mirror
// estrutural de `src/pages/Operacional/Appropriations/index.tsx`, MENOS o
// workflow de status (`supplies` não tem coluna/badge de status, AD-02/
// FID-G3F §7 — Abastecimentos é CRUD flat).
//
// Coluna "Dt. Criação" (rótulo previsto no roteiro) OMITIDA — `SupplyListItem`
// (contrato §6, leitura direta do Resource) NÃO expõe `created_at` — SEM
// MOCK, não inventar a coluna sem o dado real (mirror EXATO da mesma decisão
// já tomada em `AppropriationsList`). Reportado como observação ao Tester.
//
// LM-06 — sub-linhas por equipamento: cada `Supply` já traz `items[]`
// completo no MESMO payload da listagem (contrato §6) — a expansão usa
// `TableProvider`/`getRowCanExpand` + `rowSubComponent`, SEM request extra
// por linha. O mecanismo de expansão do `Table` (`row.getIsSelected() &&
// row.getCanExpand()`) reage ao clique na própria linha (mesmo handler de
// seleção já cabeado em `Table.tsx`), com `enableMultiRowSelection={false}`.
//
// Exclusão — V3 não tem `useDeleted`; `useDeleteSupplyMutation` usa
// `useRequest` com `typesRequest:'apply'` (mirror `get_pwa_mutation_query_
// pattern` §"Substituição V3").
// -----------------------------------------------------------------------------

import { useMemo, useState } from 'react';

import { Box, Flex, Icon, Text, useDisclosure } from '@chakra-ui/react';
import { createColumnHelper } from '@tanstack/react-table';
import { FiEdit, FiEye, FiTrash2 } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

import { Actions } from '@/components/Action';
import { ContainerGrid } from '@/components/ContainerGrid';
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';
import { EmptyState } from '@/components/EmptyState';
import { HeaderGrid } from '@/components/HeaderGrid';
import { Table } from '@/components/Table';

import { TableProvider } from '@/contexts/TableContext';

import { useGridSettings } from '@/hooks/useGridSettings';
import { useGridStorageScope } from '@/hooks/useGridStorageScope';
import { useLanguage } from '@/hooks/useLanguage';
import { userPaginatedQuery } from '@/hooks/usePaginatedQueryStorage';
import { usePermissions } from '@/hooks/usePermissions';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import { styleColumTable } from '@/utils/style-colum-table';

import { queryKey } from '@/constants/query-key';

import type { SupplyFilterForm, SupplyListItem } from '@/@types/v2/Supplies';

import { FilterSideAbastecimentos } from './FilterSideAbastecimentos';
import { HeaderTable } from './HeaderTable';
import { SupplyItemsSubRow } from './SupplyItemsSubRow';
import { useDeleteSupplyMutation, useSuppliesGridQuery } from './useAbastecimentos';

const ABASTECIMENTOS_STORAGE_KEY = 'FrotaAbastecimentos' + queryKey.supplies.supplies;

export default function AbastecimentosList() {
  const { languageGB } = useLanguage();
  const navigate = useNavigate();
  const { can } = usePermissions();
  const text = languageGB.supplies.supply;

  const canCreate = can('appropriation-supplies_create');
  const canView = can('appropriation-supplies_view');
  const canEdit = can('appropriation-supplies_edit');
  const canDelete = can('appropriation-supplies_delete');

  const defaultQueryOptions = useMemo(
    () => ({ pageSize: 10, storageKey: ABASTECIMENTOS_STORAGE_KEY }),
    []
  );

  const { paginatedQuery, handlePaginatedQuery, handleFilterChange, handleResetFilter } =
    userPaginatedQuery<SupplyFilterForm>(defaultQueryOptions);

  const { open: isFilterOpen, onOpen: onOpenFilter, onClose: onCloseFilter } = useDisclosure();

  const filtersApplied = useMemo(
    () =>
      Object.values(paginatedQuery.filter ?? {}).filter(
        (v) => v !== undefined && v !== null && v !== ''
      ).length,
    [paginatedQuery.filter]
  );

  const [toDelete, setToDelete] = useState<SupplyListItem | null>(null);
  const {
    open: isOpenDeleteDialog,
    onOpen: onOpenDeleteDialog,
    onClose: onCloseDeleteDialog,
  } = useDisclosure();

  const suppliesList = useSuppliesGridQuery({
    paginatedQuery,
    setPaginatedQuery: handlePaginatedQuery,
    filter: paginatedQuery.filter ?? undefined,
  });

  const deleteMutation = useDeleteSupplyMutation({
    actionSuccess: () => {
      onCloseDeleteDialog();
      setToDelete(null);
    },
  });

  const isDeleting = deleteMutation.isPending;

  function handleDeleteClick(supply: SupplyListItem) {
    setToDelete(supply);
    onOpenDeleteDialog();
  }

  function handleConfirmDelete() {
    if (toDelete) {
      deleteMutation.mutate({ supplyUuid: toDelete.uuid });
    }
  }

  const columnHelper = createColumnHelper<SupplyListItem>();
  const defaultColumns = useMemo(
    () => [
      columnHelper.accessor('code', {
        header: text.list.table.code,
        enableHiding: false,
        cell: ({ row }) => (
          <Text fontFamily="mono" fontSize="sm" fontWeight="medium">
            {row.original.code}
          </Text>
        ),
        meta: { ...styleColumTable.sm, gridLabel: text.list.table.code },
      }),
      columnHelper.accessor('date', {
        header: text.list.table.date,
        cell: ({ row }) => <Text fontSize="sm">{row.original.date}</Text>,
        meta: { ...styleColumTable.date, gridLabel: text.list.table.date },
      }),
      columnHelper.accessor((row) => row.requester ?? row.employee?.name ?? row.user?.name ?? '', {
        id: 'requester',
        header: text.list.table.requester,
        cell: ({ row }) => (
          <Text fontSize="sm">
            {row.original.requester ??
              row.original.employee?.name ??
              row.original.user?.name ??
              '—'}
          </Text>
        ),
        meta: { gridLabel: text.list.table.requester },
      }),
      columnHelper.display({
        id: 'acoes',
        header: '',
        enableHiding: false,
        cell: ({ row }) => (
          <Flex justify="flex-end">
            <Actions size="sm">
              {canView && (
                <Actions.Item
                  icon={<Icon as={FiEye} />}
                  onClick={() => navigate(`/frota/abastecimentos/${row.original.uuid}/detalhe`)}
                >
                  {text.list.actions.view}
                </Actions.Item>
              )}
              {canEdit && (
                <Actions.Item
                  icon={<Icon as={FiEdit} />}
                  onClick={() => navigate(`/frota/abastecimentos/${row.original.uuid}`)}
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
    [navigate, isDeleting, canView, canEdit, canDelete, text, languageGB]
  );

  const gridSettings = useGridSettings<SupplyListItem>({
    storageKey: ABASTECIMENTOS_STORAGE_KEY,
    storageScope: useGridStorageScope(),
    columns: defaultColumns,
  });
  const { columnOrder, setColumnOrder, columnVisibility, setColumnVisibility } = gridSettings;

  const isLoading = checkLoadingStatus([suppliesList]);
  const items = suppliesList.data?.data?.items;
  const isEmpty = !isLoading && !suppliesList.isError && (items?.length ?? 0) === 0;
  const isErrorState = !isLoading && suppliesList.isError;

  return (
    <ContainerGrid>
      <TableProvider
        data={items}
        columns={defaultColumns}
        pagination={paginatedQuery}
        setPagination={handlePaginatedQuery}
        enableMultiRowSelection={false}
        getRowCanExpand={(row) => (row.original.items?.length ?? 0) > 0}
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
              canCreate={canCreate}
              onCreate={() => navigate('/frota/abastecimentos/novo')}
              gridSettings={gridSettings}
            />
          }
        >
          <Text fontSize="2xl" fontWeight="bold" color="brandColorText">
            {text.list.pageTitle}
          </Text>
          <Text fontSize="sm" color="fg.muted">
            {text.list.pageSubtitle}
          </Text>
        </HeaderGrid>

        <Box mt={6}>
          {isErrorState ? (
            <EmptyState
              variant="error"
              message={text.list.errorState.title}
              description={text.list.errorState.description}
              onRetry={() => suppliesList.refetch()}
              retryLabel={text.list.errorState.retry}
            />
          ) : isEmpty ? (
            <EmptyState
              variant="empty"
              message={
                filtersApplied > 0 ? text.list.emptyState.titleFiltered : text.list.emptyState.title
              }
              description={
                filtersApplied > 0
                  ? text.list.emptyState.descriptionFiltered
                  : text.list.emptyState.description
              }
              action={
                filtersApplied === 0 && canCreate
                  ? {
                      label: text.list.emptyState.cta,
                      onClick: () => navigate('/frota/abastecimentos/novo'),
                    }
                  : undefined
              }
            />
          ) : (
            <Table
              isLoading={isLoading}
              rowSubComponent={({ row }) => <SupplyItemsSubRow items={row.original.items} />}
            />
          )}
        </Box>
      </TableProvider>

      <FilterSideAbastecimentos
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
        itemName={toDelete?.code}
        tone="danger"
      />
    </ContainerGrid>
  );
}
