// src/pages/Operacional/RatingServiceOrders/index.tsx
// -----------------------------------------------------------------------------
// Tela de LISTAGEM (grid) de Avaliações de Ordem de Serviço
// (RatingServiceOrder) — TASK-FE-041-AVL-02 (esteira 041, SCREEN-01 do
// plano). Domínio PRÓPRIO (`Operacional`, URL `/operacional/avaliacoes`,
// mirror `Operacional/ServiceOrders` — não `BaseRegistrations`). Item de
// menu (`ope-os-ava`) e permissão de navegação (`rating-service-orders_view`)
// JÁ EXISTIAM (`navigationTree.ts`/`navigationPermissions.ts`) — nenhuma
// edição neles.
//
// Ação da linha (execução 086, FE-03): "Avaliar" quando status===3 (gated por
// `rating-service-orders_edit`); "Visualizar" nos demais (gated por
// `rating-service-orders_view`) — ambas abrem `/operacional/avaliacoes/{uuid}`,
// que decide modo ação/leitura pelo `can_rate` do GET.
//
// Sem seletor de tamanho de página ad hoc (FLT-004, decisão do dono — plano
// §2/§3) — paginação padrão do fork (`userPaginatedQuery({pageSize:10})`).
// -----------------------------------------------------------------------------

import { useMemo } from 'react';
import type { ElementType } from 'react';

import { Box, Flex, Icon, Text, useDisclosure } from '@chakra-ui/react';
import { createColumnHelper } from '@tanstack/react-table';
import { FiClipboard, FiEye, FiStar } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

import { formatServiceOrderDate } from '@/pages/Operacional/ServiceOrders/ServiceOrderDetailBody';
import { getServiceOrderStatusBadgeColor } from '@/pages/Operacional/ServiceOrders/serviceOrderStatus';

import { Actions } from '@/components/Action';
import { ContainerGrid } from '@/components/ContainerGrid';
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

import type {
  RatingServiceOrderFilterForm,
  RatingServiceOrderListItem,
} from '@/@types/v2/RatingServiceOrders';

import { FilterSideRatingServiceOrders } from './FilterSideRatingServiceOrders';
import { HeaderTable } from './HeaderTable';
import { useRatingServiceOrdersList } from './useRatingServiceOrders';

import { PageHeader } from '@/components/ui/PageHeader';
import { StatusTag } from '@/components/ui/StatusTag';

const RATING_SERVICE_ORDERS_STORAGE_KEY =
  'OperacionalRatingServiceOrders' + queryKey.ratingServiceOrders.ratingServiceOrders;
const RATING_SERVICE_ORDERS_ROUTE = '/operacional/avaliacoes';

export default function RatingServiceOrdersList() {
  const { languageGB } = useLanguage();
  const navigate = useNavigate();
  const { can } = usePermissions();
  const text = languageGB.ratingServiceOrders.ratingServiceOrder;

  // DIV-002 — visibilidade do "Visualizar" segue `rating-service-orders_view`.
  const canView = can('rating-service-orders_view');
  const canRate = can('rating-service-orders_edit');

  const defaultQueryOptions = useMemo(
    () => ({ pageSize: 10, storageKey: RATING_SERVICE_ORDERS_STORAGE_KEY }),
    []
  );

  const { paginatedQuery, handlePaginatedQuery, handleFilterChange, handleResetFilter } =
    userPaginatedQuery<RatingServiceOrderFilterForm>(defaultQueryOptions);

  const { open: isFilterOpen, onOpen: onOpenFilter, onClose: onCloseFilter } = useDisclosure();

  const filtersApplied = useMemo(
    () =>
      Object.values(paginatedQuery.filter ?? {}).filter(
        (v) => v !== undefined && v !== null && v !== ''
      ).length,
    [paginatedQuery.filter]
  );

  const ratingServiceOrdersList = useRatingServiceOrdersList({
    paginatedQuery,
    setPaginatedQuery: handlePaginatedQuery,
    filter: paginatedQuery.filter ?? undefined,
  });

  const columnHelper = createColumnHelper<RatingServiceOrderListItem>();
  const defaultColumns = useMemo(
    () => [
      columnHelper.accessor((row) => row.status.label, {
        id: 'status',
        header: languageGB.defaltStrings.statusColumn,
        enableHiding: false,
        cell: ({ row }) => (
          <StatusTag
            label={row.original.status.label}
            color={getServiceOrderStatusBadgeColor(row.original.status.value)}
          />
        ),
        meta: { ...styleColumTable.md, gridLabel: languageGB.defaltStrings.statusColumn },
      }),
      columnHelper.accessor('code', {
        header: text.list.table.code,
        cell: ({ row }) => (
          <Text fontFamily="mono" fontSize="sm" fontWeight="medium">
            {row.original.code}
          </Text>
        ),
        meta: { ...styleColumTable.sm, gridLabel: text.list.table.code },
      }),
      columnHelper.accessor((row) => row.user?.name ?? '', {
        id: 'user',
        header: text.list.table.user,
        cell: ({ row }) => <Text fontSize="sm">{row.original.user?.name ?? '—'}</Text>,
        meta: { gridLabel: text.list.table.user },
      }),
      columnHelper.accessor((row) => row.executor?.name ?? '', {
        id: 'executor',
        header: text.list.table.executor,
        cell: ({ row }) => <Text fontSize="sm">{row.original.executor?.name ?? '—'}</Text>,
        meta: { gridLabel: text.list.table.executor },
      }),
      columnHelper.accessor('dt_emission', {
        header: text.list.table.dtEmission,
        cell: ({ row }) => (
          <Text fontSize="sm">{formatServiceOrderDate(row.original.dt_emission)}</Text>
        ),
        meta: { ...styleColumTable.date, gridLabel: text.list.table.dtEmission },
      }),
      columnHelper.accessor('deadline', {
        header: text.list.table.deadline,
        cell: ({ row }) => (
          <Text fontSize="sm">{formatServiceOrderDate(row.original.deadline)}</Text>
        ),
        meta: { ...styleColumTable.date, gridLabel: text.list.table.deadline },
      }),
      columnHelper.display({
        id: 'acoes',
        header: '',
        enableHiding: false,
        cell: ({ row }) => (
          <Flex justify="flex-end">
            <Actions size="sm">
              {canRate && row.original.status.value === 3 ? (
                <Actions.Item
                  icon={<Icon as={FiStar} />}
                  onClick={() => navigate(`${RATING_SERVICE_ORDERS_ROUTE}/${row.original.uuid}`)}
                >
                  {text.list.actions.rate}
                </Actions.Item>
              ) : (
                canView && (
                  <Actions.Item
                    icon={<Icon as={FiEye} />}
                    onClick={() => navigate(`${RATING_SERVICE_ORDERS_ROUTE}/${row.original.uuid}`)}
                  >
                    {text.list.actions.view}
                  </Actions.Item>
                )
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
    [navigate, canView, canRate, text, languageGB]
  );

  const gridSettings = useGridSettings<RatingServiceOrderListItem>({
    storageKey: RATING_SERVICE_ORDERS_STORAGE_KEY,
    storageScope: useGridStorageScope(),
    columns: defaultColumns,
  });
  const { columnOrder, setColumnOrder, columnVisibility, setColumnVisibility } = gridSettings;

  const isLoading = checkLoadingStatus([ratingServiceOrdersList]);
  const isError = !isLoading && (ratingServiceOrdersList as any).isError;
  const items = ratingServiceOrdersList.data?.data?.items;
  const isEmpty = !isLoading && !isError && (items?.length ?? 0) === 0;

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
            isError={isError}
            error={(ratingServiceOrdersList as any).error}
            isEmpty={isEmpty}
            onRetry={() => (ratingServiceOrdersList as any).refetch?.()}
            isRetrying={(ratingServiceOrdersList as any).isFetching}
            retryLabel={text.list.error.retry}
            emptyIcon={FiClipboard as ElementType}
            emptyTitle={
              filtersApplied > 0 ? text.list.emptyState.titleFiltered : text.list.emptyState.title
            }
            emptyDescription={
              filtersApplied > 0
                ? text.list.emptyState.descriptionFiltered
                : text.list.emptyState.description
            }
          />
        </Box>
      </TableProvider>

      <FilterSideRatingServiceOrders
        isOpen={isFilterOpen}
        onClose={onCloseFilter}
        handleFilterChange={handleFilterChange}
        handleReset={handleResetFilter}
        filter={paginatedQuery.filter}
        languageGB={languageGB}
        filtersApplied={filtersApplied}
      />
    </ContainerGrid>
  );
}
