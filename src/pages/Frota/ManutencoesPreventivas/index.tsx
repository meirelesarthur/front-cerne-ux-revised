// src/pages/Frota/ManutencoesPreventivas/index.tsx
// -----------------------------------------------------------------------------
// Tela de LISTAGEM (grid) de Manutenções Preventivas (MaintenancePreventive)
// — Tarefa 43. Mirror ESTRUTURAL 1:1 de `Frota/Abastecimentos/index.tsx`,
// MENOS `useGridSettings`/`GridSettingsFloatingPanel` (4 colunas fixas,
// dispensável, ver `HeaderTable.tsx`).
//
// Coluna "Dt. Criação" OMITIDA — `MaintenancePreventiveListItem` (contrato
// Tarefa 40) NÃO expõe `created_at` — SEM MOCK (mirror EXATO da mesma
// decisão já tomada em `AbastecimentosList`, D2 da FID-G3F).
//
// D3 — sub-linhas por equipamento: cada `MaintenancePreventive` já traz
// `items[]` completo no MESMO payload da listagem — a expansão usa
// `TableProvider`/`getRowCanExpand` + `rowSubComponent`, SEM request extra
// por linha.
//
// Exclusão — V3 não tem `useDeleted`; `useDeleteMaintenancePreventiveMutation`
// usa `useRequest` com `typesRequest:'apply'` (mirror `get_pwa_mutation_
// query_pattern` §"Substituição V3").
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

import { useLanguage } from '@/hooks/useLanguage';
import { userPaginatedQuery } from '@/hooks/usePaginatedQueryStorage';
import { usePermissions } from '@/hooks/usePermissions';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import { styleColumTable } from '@/utils/style-colum-table';

import { queryKey } from '@/constants/query-key';

import type {
  MaintenancePreventiveFilterForm,
  MaintenancePreventiveListItem,
} from '@/@types/v2/MaintenancePreventives';

import { FilterSideManutencoesPreventivas } from './FilterSideManutencoesPreventivas';
import { HeaderTable } from './HeaderTable';
import { MaintenancePreventiveItemsSubRow } from './MaintenancePreventiveItemsSubRow';
import {
  useDeleteMaintenancePreventiveMutation,
  useMaintenancePreventivesGridQuery,
} from './useManutencoesPreventivas';

const MANUTENCOES_PREVENTIVAS_STORAGE_KEY =
  'FrotaManutencoesPreventivas' + queryKey.maintenancePreventives.maintenancePreventives;

export default function ManutencoesPreventivasList() {
  const { languageGB } = useLanguage();
  const navigate = useNavigate();
  const { can } = usePermissions();
  const text = languageGB.maintenancePreventives.maintenancePreventive;

  const canCreate = can('maintenance-preventives_create');
  const canView = can('maintenance-preventives_view');
  const canEdit = can('maintenance-preventives_edit');
  const canDelete = can('maintenance-preventives_delete');

  const defaultQueryOptions = useMemo(
    () => ({ pageSize: 10, storageKey: MANUTENCOES_PREVENTIVAS_STORAGE_KEY }),
    []
  );

  const { paginatedQuery, handlePaginatedQuery, handleFilterChange, handleResetFilter } =
    userPaginatedQuery<MaintenancePreventiveFilterForm>(defaultQueryOptions);

  const { open: isFilterOpen, onOpen: onOpenFilter, onClose: onCloseFilter } = useDisclosure();

  const filtersApplied = useMemo(
    () =>
      Object.values(paginatedQuery.filter ?? {}).filter(
        (v) => v !== undefined && v !== null && v !== ''
      ).length,
    [paginatedQuery.filter]
  );

  const [toDelete, setToDelete] = useState<MaintenancePreventiveListItem | null>(null);
  const {
    open: isOpenDeleteDialog,
    onOpen: onOpenDeleteDialog,
    onClose: onCloseDeleteDialog,
  } = useDisclosure();

  const maintenancePreventivesList = useMaintenancePreventivesGridQuery({
    paginatedQuery,
    setPaginatedQuery: handlePaginatedQuery,
    filter: paginatedQuery.filter ?? undefined,
  });

  const deleteMutation = useDeleteMaintenancePreventiveMutation({
    actionSuccess: () => {
      onCloseDeleteDialog();
      setToDelete(null);
    },
  });

  const isDeleting = deleteMutation.isPending;

  function handleDeleteClick(maintenancePreventive: MaintenancePreventiveListItem) {
    setToDelete(maintenancePreventive);
    onOpenDeleteDialog();
  }

  function handleConfirmDelete() {
    if (toDelete) {
      deleteMutation.mutate({ maintenancePreventiveUuid: toDelete.uuid });
    }
  }

  const columnHelper = createColumnHelper<MaintenancePreventiveListItem>();
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
      // Sem campo `requester` no Resource — derivado direto no `cell`
      // (mirror D2/FID-G3F, sem tipo inventado).
      columnHelper.accessor((row) => row.employee?.name ?? row.user?.name ?? '', {
        id: 'requester',
        header: text.list.table.requester,
        cell: ({ row }) => (
          <Text fontSize="sm">{row.original.employee?.name ?? row.original.user?.name ?? '—'}</Text>
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
                  onClick={() => navigate(`/frota/preventivas/${row.original.uuid}/detalhe`)}
                >
                  {text.list.actions.view}
                </Actions.Item>
              )}
              {canEdit && (
                <Actions.Item
                  icon={<Icon as={FiEdit} />}
                  onClick={() => navigate(`/frota/preventivas/${row.original.uuid}`)}
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

  const isLoading = checkLoadingStatus([maintenancePreventivesList]);
  const items = maintenancePreventivesList.data?.data?.items;
  const isEmpty = !isLoading && !maintenancePreventivesList.isError && (items?.length ?? 0) === 0;
  const isErrorState = !isLoading && maintenancePreventivesList.isError;

  return (
    <ContainerGrid>
      <TableProvider
        data={items}
        columns={defaultColumns}
        pagination={paginatedQuery}
        setPagination={handlePaginatedQuery}
        enableMultiRowSelection={false}
        getRowCanExpand={(row) => (row.original.items?.length ?? 0) > 0}
      >
        <HeaderGrid
          header={
            <HeaderTable
              onOpenFilter={onOpenFilter}
              filtersApplied={filtersApplied}
              languageGB={languageGB}
              canCreate={canCreate}
              onCreate={() => navigate('/frota/preventivas/novo')}
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
              onRetry={() => maintenancePreventivesList.refetch()}
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
                      onClick: () => navigate('/frota/preventivas/novo'),
                    }
                  : undefined
              }
            />
          ) : (
            <Table
              isLoading={isLoading}
              rowSubComponent={({ row }) => (
                <MaintenancePreventiveItemsSubRow items={row.original.items} />
              )}
            />
          )}
        </Box>
      </TableProvider>

      <FilterSideManutencoesPreventivas
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
