// src/pages/Frota/Manutencoes/index.tsx
// -----------------------------------------------------------------------------
// Tela de LISTAGEM (grid) de Manutenções (Maintenance, F-103) — Tarefa 43.
// Mirror ESTRUTURAL de `src/pages/Frota/Abastecimentos/index.tsx` (mesmo
// módulo "Gestão de Frota", UX-GAP-MNT-01 resolvido por precedente direto,
// FID-G3F §0).
//
// Coluna "Dt. Criação" OMITIDA — `MaintenanceListItem` (contrato Tarefa 43
// backend) NÃO expõe `created_at` — SEM MOCK (mirror EXATO da mesma decisão
// já tomada em `AbastecimentosList`/`ManutencoesPreventivasList`).
//
// Sub-linhas por item: cada `Maintenance` já traz `items[]` completo no
// MESMO payload da listagem (mirror contrato Supplies §6/FID-G3F §4) — a
// expansão usa `TableProvider`/`getRowCanExpand` + `rowSubComponent`, SEM
// request extra por linha.
//
// Exclusão — V3 não tem `useDeleted`; `useDeleteMaintenanceMutation` usa
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

import type { MaintenanceFilterForm, MaintenanceListItem } from '@/@types/v2/Maintenances';

import { FilterSideManutencoes } from './FilterSideManutencoes';
import { HeaderTable } from './HeaderTable';
import { MaintenanceItemsSubRow } from './MaintenanceItemsSubRow';
import { useDeleteMaintenanceMutation, useMaintenancesGridQuery } from './useManutencoes';

const MANUTENCOES_STORAGE_KEY = 'FrotaManutencoes' + queryKey.maintenances.maintenances;

export default function ManutencoesList() {
  const { languageGB } = useLanguage();
  const navigate = useNavigate();
  const { can } = usePermissions();
  const text = languageGB.maintenances.maintenance;

  const canCreate = can('maintenances_create');
  const canView = can('maintenances_view');
  const canEdit = can('maintenances_edit');
  const canDelete = can('maintenances_delete');

  const defaultQueryOptions = useMemo(
    () => ({ pageSize: 10, storageKey: MANUTENCOES_STORAGE_KEY }),
    []
  );

  const { paginatedQuery, handlePaginatedQuery, handleFilterChange, handleResetFilter } =
    userPaginatedQuery<MaintenanceFilterForm>(defaultQueryOptions);

  const { open: isFilterOpen, onOpen: onOpenFilter, onClose: onCloseFilter } = useDisclosure();

  const filtersApplied = useMemo(
    () =>
      Object.values(paginatedQuery.filter ?? {}).filter(
        (v) => v !== undefined && v !== null && v !== ''
      ).length,
    [paginatedQuery.filter]
  );

  const [toDelete, setToDelete] = useState<MaintenanceListItem | null>(null);
  const {
    open: isOpenDeleteDialog,
    onOpen: onOpenDeleteDialog,
    onClose: onCloseDeleteDialog,
  } = useDisclosure();

  const maintenancesList = useMaintenancesGridQuery({
    paginatedQuery,
    setPaginatedQuery: handlePaginatedQuery,
    filter: paginatedQuery.filter ?? undefined,
  });

  const deleteMutation = useDeleteMaintenanceMutation({
    actionSuccess: () => {
      onCloseDeleteDialog();
      setToDelete(null);
    },
  });

  const isDeleting = deleteMutation.isPending;

  function handleDeleteClick(maintenance: MaintenanceListItem) {
    setToDelete(maintenance);
    onOpenDeleteDialog();
  }

  function handleConfirmDelete() {
    if (toDelete) {
      deleteMutation.mutate({ maintenanceUuid: toDelete.uuid });
    }
  }

  const columnHelper = createColumnHelper<MaintenanceListItem>();
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
      // `requester` é a chave real do `MaintenanceResource`
      // (`whenLoaded('user')`) — carrega o `requester_user_uuid` resolvido
      // no create/update (ver nota de tipos).
      columnHelper.accessor((row) => row.requester?.name ?? '', {
        id: 'requester',
        header: text.list.table.requester,
        cell: ({ row }) => <Text fontSize="sm">{row.original.requester?.name ?? '—'}</Text>,
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
                  onClick={() => navigate(`/frota/manutencoes/${row.original.uuid}/detalhe`)}
                >
                  {text.list.actions.view}
                </Actions.Item>
              )}
              {canEdit && (
                <Actions.Item
                  icon={<Icon as={FiEdit} />}
                  onClick={() => navigate(`/frota/manutencoes/${row.original.uuid}`)}
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

  const gridSettings = useGridSettings<MaintenanceListItem>({
    storageKey: MANUTENCOES_STORAGE_KEY,
    storageScope: useGridStorageScope(),
    columns: defaultColumns,
  });
  const { columnOrder, setColumnOrder, columnVisibility, setColumnVisibility } = gridSettings;

  const isLoading = checkLoadingStatus([maintenancesList]);
  const items = maintenancesList.data?.data?.items;
  const isEmpty = !isLoading && !maintenancesList.isError && (items?.length ?? 0) === 0;
  const isErrorState = !isLoading && maintenancesList.isError;

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
              onCreate={() => navigate('/frota/manutencoes/novo')}
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
              onRetry={() => maintenancesList.refetch()}
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
                      onClick: () => navigate('/frota/manutencoes/novo'),
                    }
                  : undefined
              }
            />
          ) : (
            <Table
              isLoading={isLoading}
              rowSubComponent={({ row }) => <MaintenanceItemsSubRow items={row.original.items} />}
            />
          )}
        </Box>
      </TableProvider>

      <FilterSideManutencoes
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
