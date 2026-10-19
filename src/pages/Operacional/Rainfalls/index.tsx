// src/pages/Operacional/Rainfalls/index.tsx
// -----------------------------------------------------------------------------
// Tela de LISTAGEM (grid) de PLUVIOMETRIA (Rainfall) — Operacional, execução
// 041. Rota: `/operacional/pluviometria` (guardada por `rainfall_view`,
// registrada em `src/router/index.tsx`).
//
// Estrutura mirror `DeathAnimals/index.tsx` (sibling estrutural PRIMÁRIO —
// grid paginada + form + detalhe + exclusão + rota/menu, greenfield).
//
// Colunas (ordem exata do contrato, `LIST-001..005`): Data (`d/M/Y`) /
// Responsável (`user.name`, texto) / Áreas (contador + tooltip com as
// descrições, `LIST-003`) / mm de Chuva (`amount`, 1 casa) / Ação (menu
// Ver/Editar/Excluir, cada item condicionado por `usePermissions().can(...)`).
// Ordenação SEMPRE `date desc` (server-side, `LST-04`) — NÃO adicionar
// ordenação client-side, mudaria comportamento não pedido.
//
// Exclusão: `useRequest` genérico + `DeleteConfirmDialog` — hard delete
// transacional (D1 do plano API, mirror SweetAlert legado `INT-009`).
// -----------------------------------------------------------------------------

import { useMemo, useState } from 'react';
import type { ElementType } from 'react';

import { Badge, Box, Flex, Icon, Text, useDisclosure, VStack } from '@chakra-ui/react';
import { createColumnHelper } from '@tanstack/react-table';
import { FiCloudRain, FiEdit, FiEye, FiTrash2 } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

import { Actions } from '@/components/Action';
import { ContainerGrid } from '@/components/ContainerGrid';
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';
import { HeaderGrid } from '@/components/HeaderGrid';
import { Table } from '@/components/Table';
import { Tooltip } from '@/components/ui/tooltip';

import { TableProvider } from '@/contexts/TableContext';

import { useGridSettings } from '@/hooks/useGridSettings';
import { useGridStorageScope } from '@/hooks/useGridStorageScope';
import { useLanguage } from '@/hooks/useLanguage';
import { userPaginatedQuery } from '@/hooks/usePaginatedQueryStorage';
import { usePermissions } from '@/hooks/usePermissions';
import { useRequest } from '@/hooks/useRequest';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import formatDate from '@/utils/formatDate';
import { styleColumTable } from '@/utils/style-colum-table';

import { queryKey } from '@/constants/query-key';

import { deleteRainfall } from '@/services/v2/Rainfalls/rainfall-service';

import type { RainfallFilterForm, RainfallListItem } from '@/@types/v2/Rainfalls';

import { FilterSideRainfall } from './FilterSideRainfall';
import { HeaderTable } from './HeaderTable';
import { useRainfallsList } from './useRainfalls';

// Chave de storage desta tela — paginação (`userPaginatedQuery`) e
// personalização de grid (`useGridSettings`) derivam da MESMA expressão
// (mirror `DEATH_ANIMALS_STORAGE_KEY`), nunca literal cru repetido.
const RAINFALLS_STORAGE_KEY = 'OperacionalRainfalls' + queryKey.rainfalls.rainfalls;

const amountFormatter = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

export default function RainfallList() {
  const { languageGB } = useLanguage();
  const navigate = useNavigate();
  const { can } = usePermissions();
  const text = languageGB.rainfalls.rainfall;

  const canCreate = can('rainfall_create');

  const defaultQueryOptions = useMemo(
    () => ({
      pageSize: 10,
      storageKey: RAINFALLS_STORAGE_KEY,
    }),
    []
  );

  const { paginatedQuery, handlePaginatedQuery, handleFilterChange, handleResetFilter } =
    userPaginatedQuery<RainfallFilterForm>(defaultQueryOptions);

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
  const [toDelete, setToDelete] = useState<RainfallListItem | null>(null);
  const {
    open: isOpenDeleteDialog,
    onOpen: onOpenDeleteDialog,
    onClose: onCloseDeleteDialog,
  } = useDisclosure();

  const rainfallsList = useRainfallsList({
    paginatedQuery,
    setPaginatedQuery: handlePaginatedQuery,
    filter: {
      start_date: paginatedQuery.filter?.start_date,
      end_date: paginatedQuery.filter?.end_date,
    },
  });

  const deleteMutation = useRequest({
    asyncFunction: async ({ rainfallUuid }: { rainfallUuid: string }) =>
      deleteRainfall(rainfallUuid),
    queryKey: queryKey.rainfalls.rainfalls,
    queryKey2: queryKey.rainfalls.rainfall,
    // `useRequest`'s TypesRequest não tem variante "delete" (só update/create/
    // apply/export/revoke/restore) — "update" é a mesma convenção já usada por
    // `DeathAnimals/index.tsx` para exclusão. O texto do toast vem de
    // `personalizedMessage`, então o rótulo genérico de "update" nunca aparece
    // ao usuário.
    typesRequest: 'update',
    entityName: text.singularLabel,
    personalizedMessage: text.list.deletedToast,
    actionSuccess: () => {
      onCloseDeleteDialog();
      setToDelete(null);
    },
  });

  const isDeleting = deleteMutation.isPending;

  function handleDeleteClick(rainfall: RainfallListItem) {
    setToDelete(rainfall);
    onOpenDeleteDialog();
  }

  function handleConfirmDelete() {
    if (toDelete) {
      deleteMutation.mutate({ rainfallUuid: toDelete.uuid });
    }
  }

  const columnHelper = createColumnHelper<RainfallListItem>();
  const defaultColumns = useMemo(
    () => [
      // Ordem exata do contrato (LIST-001..005): Data / Responsável / Áreas / mm de Chuva / Ação.
      columnHelper.accessor('date', {
        header: text.list.table.date,
        cell: ({ row }) => <Text fontSize="sm">{formatDate(row.original.date)}</Text>,
        // Ordenação SEMPRE `date desc`, fixa server-side — sem `OrdeByColumn`.
        meta: { ...styleColumTable.date, gridLabel: text.list.table.date },
      }),
      columnHelper.accessor('user', {
        header: text.list.table.user,
        enableHiding: false,
        cell: ({ row }) => (
          <Text fontWeight="medium" lineClamp="1">
            {row.original.user?.name ?? '—'}
          </Text>
        ),
        meta: { gridLabel: text.list.table.user },
      }),
      columnHelper.accessor('areas', {
        header: text.list.table.areas,
        // Contador + tooltip com as descrições, LIST-003 (mirror `boxesCount`
        // de `HarvestProduct/index.tsx`).
        cell: ({ row }) => {
          const areas = row.original.areas ?? [];
          const badge = <Badge colorPalette="green">{areas.length}</Badge>;

          if (areas.length === 0) return badge;

          return (
            <Tooltip
              content={
                <VStack align="flex-start" gap={0.5}>
                  {areas.map((area) => (
                    <Text key={area.uuid} fontSize="xs">
                      {area.description}
                    </Text>
                  ))}
                </VStack>
              }
            >
              <Box display="inline-block" cursor="default">
                {badge}
              </Box>
            </Tooltip>
          );
        },
        meta: { ...styleColumTable.sm, gridLabel: text.list.table.areas },
      }),
      columnHelper.accessor('amount', {
        header: text.list.table.amount,
        cell: ({ row }) => <Text fontSize="sm">{amountFormatter.format(row.original.amount)}</Text>,
        meta: { ...styleColumTable.sm, gridLabel: text.list.table.amount },
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
                onClick={() => navigate(`/operacional/pluviometria/${row.original.uuid}/detalhe`)}
              >
                {text.list.actions.view}
              </Actions.Item>
              {can('rainfall_edit') && (
                <Actions.Item
                  icon={<Icon as={FiEdit} />}
                  onClick={() => navigate(`/operacional/pluviometria/${row.original.uuid}`)}
                >
                  {text.list.actions.edit}
                </Actions.Item>
              )}
              {can('rainfall_delete') && (
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
    [navigate, isDeleting, can, languageGB.defaltStrings.actions, text]
  );

  const gridSettings = useGridSettings<RainfallListItem>({
    storageKey: RAINFALLS_STORAGE_KEY,
    storageScope: useGridStorageScope(),
    columns: defaultColumns,
  });
  const { columnOrder, setColumnOrder, columnVisibility, setColumnVisibility } = gridSettings;

  const isLoading = checkLoadingStatus([rainfallsList]);
  const items = rainfallsList.data?.data?.items;
  const isEmpty = !isLoading && !rainfallsList.isError && (items?.length ?? 0) === 0;

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
            isError={rainfallsList.isError}
            error={rainfallsList.error}
            isEmpty={isEmpty}
            onRetry={() => rainfallsList.refetch()}
            isRetrying={rainfallsList.isFetching}
            emptyIcon={FiCloudRain as ElementType}
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
            onCreate={() => navigate('/operacional/pluviometria/novo')}
          />
        </Box>
      </TableProvider>

      <FilterSideRainfall
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
        itemName={formatDate(toDelete?.date ?? '')}
        tone="danger"
      />
    </ContainerGrid>
  );
}
