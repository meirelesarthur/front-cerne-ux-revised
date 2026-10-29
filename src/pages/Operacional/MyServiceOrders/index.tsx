// src/pages/Operacional/MyServiceOrders/index.tsx
// -----------------------------------------------------------------------------
// Tela de LISTAGEM (grid) de Minhas OS (MyServiceOrder) — esteira 063
// (TASK-MOS-FE-04). Domínio PRÓPRIO (`Operacional/MyServiceOrders`, URL
// `/operacional/minhas-os`), listagem restrita ao executor logado (RN-01 já
// escopa 100% no backend, sem ID de contexto pai no front). Mirror estrutural
// de `Operacional/Monitoring/index.tsx` (legenda de status + 2 estados de
// empty) combinado com o bloco de erro de `RatingServiceOrders/index.tsx`
// (`Monitoring` OMITE o bloco de erro — decisão do contrato §2: incluir aqui
// por fidelidade ao padrão mais completo).
//
// Ação da linha (execução 086, FE-03): "Executar" quando `status.value < 3`
// (gated por `my-service-orders_edit`); "Visualizar" nos demais (gated por
// `my-service-orders_view`) — ambas abrem `/operacional/minhas-os/{uuid}`, que
// decide modo execução/leitura pelo `can_execute` do GET.
//
// Legenda de status renderiza os 5 status possíveis do domínio
// (`getServiceOrderStatusOptions`), mesmo RN-01 não filtrar por status
// (contrato de tela §2 — transparência visual do domínio completo do Enum,
// não filtro).
// -----------------------------------------------------------------------------

import { useMemo, type ElementType } from 'react';

import { Box, Flex, Icon, Text, useDisclosure } from '@chakra-ui/react';
import { createColumnHelper } from '@tanstack/react-table';
import { FiClipboard, FiEye, FiPlay } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

import { formatServiceOrderDate } from '@/pages/Operacional/ServiceOrders/ServiceOrderDetailBody';
import { getServiceOrderStatusBadgeColor } from '@/pages/Operacional/ServiceOrders/serviceOrderStatus';

import { Actions } from '@/components/Action';
import { ContainerGrid } from '@/components/ContainerGrid';
import { HeaderGrid } from '@/components/HeaderGrid';
import { Table } from '@/components/Table';

import { TableProvider } from '@/contexts/TableContext';

import { useLanguage } from '@/hooks/useLanguage';
import { userPaginatedQuery } from '@/hooks/usePaginatedQueryStorage';
import { usePermissions } from '@/hooks/usePermissions';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import { styleColumTable } from '@/utils/style-colum-table';

import { queryKey } from '@/constants/query-key';

import type { MyServiceOrderFilterForm, MyServiceOrderListItem } from '@/@types/v2/MyServiceOrders';

import { FilterSideMyServiceOrders } from './FilterSideMyServiceOrders';
import { HeaderTable } from './HeaderTable';
import { useMyServiceOrdersList } from './useMyServiceOrders';

import { PageHeader } from '@/components/ui/PageHeader';
import { StatusTag } from '@/components/ui/StatusTag';

const MY_SERVICE_ORDERS_STORAGE_KEY =
  'OperacionalMyServiceOrders' + queryKey.myServiceOrders.myServiceOrders;
const MY_SERVICE_ORDERS_EXECUTE_ROUTE = '/operacional/minhas-os';

export default function MyServiceOrdersList() {
  const { languageGB } = useLanguage();
  const navigate = useNavigate();
  const { can } = usePermissions();
  const text = languageGB.myServiceOrders.myServiceOrder;

  // `my-service-orders_view` já é garantida pela rota (TASK-MOS-FE-08) —
  // checagem redundante preservada por paridade com `RatingServiceOrders`
  // (DIV-002, a rota de DESTINO exige `service-orders_view` via
  // `RequirePermission` própria).
  const canView = can('my-service-orders_view');
  const canExecute = can('my-service-orders_edit');

  const defaultQueryOptions = useMemo(
    () => ({ pageSize: 10, storageKey: MY_SERVICE_ORDERS_STORAGE_KEY }),
    []
  );

  const { paginatedQuery, handlePaginatedQuery, handleFilterChange, handleResetFilter } =
    userPaginatedQuery<MyServiceOrderFilterForm>(defaultQueryOptions);

  const { open: isFilterOpen, onOpen: onOpenFilter, onClose: onCloseFilter } = useDisclosure();

  const filtersApplied = useMemo(
    () =>
      Object.values(paginatedQuery.filter ?? {}).filter(
        (v) => v !== undefined && v !== null && v !== ''
      ).length,
    [paginatedQuery.filter]
  );

  const myServiceOrdersList = useMyServiceOrdersList({
    paginatedQuery,
    setPaginatedQuery: handlePaginatedQuery,
    filter: paginatedQuery.filter ?? undefined,
  });

  const columnHelper = createColumnHelper<MyServiceOrderListItem>();
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
      columnHelper.display({
        id: 'acoes',
        header: '',
        enableHiding: false,
        cell: ({ row }) => (
          <Flex justify="flex-end">
            <Actions size="sm">
              {canExecute && row.original.status.value < 3 ? (
                <Actions.Item
                  icon={<Icon as={FiPlay} />}
                  onClick={() =>
                    navigate(`${MY_SERVICE_ORDERS_EXECUTE_ROUTE}/${row.original.uuid}`)
                  }
                >
                  {text.list.actions.execute}
                </Actions.Item>
              ) : (
                canView && (
                  <Actions.Item
                    icon={<Icon as={FiEye} />}
                    onClick={() =>
                      navigate(`${MY_SERVICE_ORDERS_EXECUTE_ROUTE}/${row.original.uuid}`)
                    }
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
    [navigate, canView, canExecute, text, languageGB]
  );

  const isLoading = checkLoadingStatus([myServiceOrdersList]);
  const items = myServiceOrdersList.data?.data?.items;
  const isEmpty = !isLoading && (items?.length ?? 0) === 0;

  return (
    <ContainerGrid>
      <TableProvider
        data={items}
        columns={defaultColumns}
        pagination={paginatedQuery}
        setPagination={handlePaginatedQuery}
        enableMultiRowSelection={false}
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
          <PageHeader title={text.list.pageTitle} description={text.list.pageSubtitle} />
        </HeaderGrid>

        <Box mt={6}>
          <Table
            isLoading={isLoading}
            isError={myServiceOrdersList.isError}
            error={myServiceOrdersList.error}
            isEmpty={isEmpty}
            onRetry={() => myServiceOrdersList.refetch()}
            isRetrying={myServiceOrdersList.isFetching}
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
            canCreate={false}
          />
        </Box>
      </TableProvider>

      <FilterSideMyServiceOrders
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
