// src/pages/Operacional/ServiceOrders/index.tsx
// -----------------------------------------------------------------------------
// Tela de LISTAGEM (grid) de Ordens de Serviço (ServiceOrder) — TASK-FE-2002
// (esteira 038, fatia READ). Domínio PRÓPRIO (`Operacional`, URL
// `/operacional/lista-os`, mirror `Operacional/Appropriations`/
// `Operacional/Romaneios` — não `BaseRegistrations`).
//
// Ação "Editar" navega para `/operacional/lista-os/{uuid}` — rota registrada
// nesta execução, apontando para o form real `CreateOrUpdateServiceOrder`
// (TASK-FE-2004/2005, D-FRONT-01/03/04 RESOLVIDAS).
// -----------------------------------------------------------------------------

import { useMemo, useState } from 'react';
import type { ElementType } from 'react';

import { Box, Flex, Icon, Text, useDisclosure } from '@chakra-ui/react';
import { createColumnHelper } from '@tanstack/react-table';
import { FiClipboard, FiEdit, FiEye, FiTrash2, FiXCircle } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

import { formatServiceOrderDate } from '@/pages/Operacional/ServiceOrders/ServiceOrderDetailBody';

import { Actions } from '@/components/Action';
import { ContainerGrid } from '@/components/ContainerGrid';
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';
import { HeaderGrid } from '@/components/HeaderGrid';
import { Status } from '@/components/Status';
import { Table } from '@/components/Table';

import { TableProvider } from '@/contexts/TableContext';

import { useGridSettings } from '@/hooks/useGridSettings';
import { useGridStorageScope } from '@/hooks/useGridStorageScope';
import { useLanguage } from '@/hooks/useLanguage';
import { userPaginatedQuery } from '@/hooks/usePaginatedQueryStorage';
import { usePermissions } from '@/hooks/usePermissions';
import { useRequest } from '@/hooks/useRequest';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import { styleColumTable } from '@/utils/style-colum-table';

import { queryKey } from '@/constants/query-key';
import { getServiceOrderStatusOptions } from '@/constants/serviceOrders/options/service-order-status-options';
import { SERVICE_ORDER_CANCEL_PERMISSION } from '@/constants/serviceOrders/service-order-cancel-rules';

import { deleteServiceOrder } from '@/services/v2/ServiceOrders/service-order-service';

import type { ServiceOrderFilterForm, ServiceOrderListItem } from '@/@types/v2/ServiceOrders';

import { CancelServiceOrderDialog } from './CancelServiceOrderDialog';
import { FilterSideServiceOrders } from './FilterSideServiceOrders';
import { HeaderTable } from './HeaderTable';
import { canCancelServiceOrder, getServiceOrderStatusBadgeColor } from './serviceOrderStatus';
import { useServiceOrdersList } from './useServiceOrders';

import { PageHeader } from '@/components/ui/PageHeader';

const SERVICE_ORDERS_STORAGE_KEY =
  'OperacionalServiceOrders' + queryKey.serviceOrders.serviceOrders;
const SERVICE_ORDERS_LIST_ROUTE = '/operacional/lista-os';

export default function ServiceOrdersList() {
  const { languageGB } = useLanguage();
  const navigate = useNavigate();
  const { can } = usePermissions();
  const text = languageGB.serviceOrders.serviceOrder;

  const canCreate = can('service-orders_create');
  const canView = can('service-orders_view');
  const canEdit = can('service-orders_edit');
  const canDelete = can('service-orders_delete');
  const canCancelPermission = can(SERVICE_ORDER_CANCEL_PERMISSION);

  const defaultQueryOptions = useMemo(
    () => ({ pageSize: 10, storageKey: SERVICE_ORDERS_STORAGE_KEY }),
    []
  );

  const { paginatedQuery, handlePaginatedQuery, handleFilterChange, handleResetFilter } =
    userPaginatedQuery<ServiceOrderFilterForm>(defaultQueryOptions);

  const { open: isFilterOpen, onOpen: onOpenFilter, onClose: onCloseFilter } = useDisclosure();

  const filtersApplied = useMemo(
    () =>
      Object.values(paginatedQuery.filter ?? {}).filter(
        (v) => v !== undefined && v !== null && v !== ''
      ).length,
    [paginatedQuery.filter]
  );

  const [toDelete, setToDelete] = useState<ServiceOrderListItem | null>(null);
  const {
    open: isOpenDeleteDialog,
    onOpen: onOpenDeleteDialog,
    onClose: onCloseDeleteDialog,
  } = useDisclosure();

  // Cancelar OS (execução 086) — o diálogo cuida do motivo, da mutation e da
  // invalidação (lista, detalhe, Minhas OS, Monitoramento, Avaliações).
  const [toCancel, setToCancel] = useState<ServiceOrderListItem | null>(null);
  const {
    open: isOpenCancelDialog,
    onOpen: onOpenCancelDialog,
    onClose: onCloseCancelDialog,
  } = useDisclosure();

  function handleCancelClick(serviceOrder: ServiceOrderListItem) {
    setToCancel(serviceOrder);
    onOpenCancelDialog();
  }

  function handleCloseCancel() {
    onCloseCancelDialog();
    setToCancel(null);
  }

  const serviceOrdersList = useServiceOrdersList({
    paginatedQuery,
    setPaginatedQuery: handlePaginatedQuery,
    filter: paginatedQuery.filter ?? undefined,
  });

  const deleteMutation = useRequest({
    asyncFunction: async ({ serviceOrderUuid }: { serviceOrderUuid: string }) => {
      return await deleteServiceOrder(serviceOrderUuid);
    },
    queryKey: queryKey.serviceOrders.serviceOrders,
    queryKey2: queryKey.serviceOrders.serviceOrder,
    typesRequest: 'update',
    entityName: text.singularLabel,
    personalizedMessage: text.list.deletedToast,
    actionSuccess: () => {
      onCloseDeleteDialog();
      setToDelete(null);
    },
  });

  const isDeleting = deleteMutation.isPending;

  function handleDeleteClick(serviceOrder: ServiceOrderListItem) {
    setToDelete(serviceOrder);
    onOpenDeleteDialog();
  }

  function handleConfirmDelete() {
    if (toDelete) {
      deleteMutation.mutate({ serviceOrderUuid: toDelete.uuid });
    }
  }

  const columnHelper = createColumnHelper<ServiceOrderListItem>();
  const defaultColumns = useMemo(
    () => [
      columnHelper.accessor((row) => row.status.label, {
        id: 'status',
        header: text.list.table.status,
        enableHiding: false,
        cell: ({ row }) => (
          <Status
            text={row.original.status.label}
            backgroundColor={getServiceOrderStatusBadgeColor(row.original.status.value)}
          />
        ),
        meta: { ...styleColumTable.sm, gridLabel: text.list.table.status },
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
      columnHelper.accessor((row) => row.area?.name ?? '', {
        id: 'area',
        header: text.list.table.area,
        cell: ({ row }) => <Text fontSize="sm">{row.original.area?.name ?? '—'}</Text>,
        meta: { gridLabel: text.list.table.area },
      }),
      columnHelper.accessor((row) => row.operation?.name ?? '', {
        id: 'operation',
        header: text.list.table.operation,
        cell: ({ row }) => <Text fontSize="sm">{row.original.operation?.name ?? '—'}</Text>,
        meta: { gridLabel: text.list.table.operation },
      }),
      columnHelper.accessor((row) => row.activity?.name ?? '', {
        id: 'activity',
        header: text.list.table.activity,
        cell: ({ row }) => <Text fontSize="sm">{row.original.activity?.name ?? '—'}</Text>,
        meta: { gridLabel: text.list.table.activity },
      }),
      columnHelper.accessor('dt_emission', {
        header: text.list.table.dtEmission,
        cell: ({ row }) => (
          <Text fontSize="sm">{formatServiceOrderDate(row.original.dt_emission)}</Text>
        ),
        meta: { ...styleColumTable.date, gridLabel: text.list.table.dtEmission },
      }),
      columnHelper.accessor('execution_date', {
        header: text.list.table.executionDate,
        cell: ({ row }) => (
          <Text fontSize="sm">{formatServiceOrderDate(row.original.execution_date)}</Text>
        ),
        meta: { ...styleColumTable.date, gridLabel: text.list.table.executionDate },
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
              {canView && (
                <Actions.Item
                  icon={<Icon as={FiEye} />}
                  onClick={() =>
                    navigate(`${SERVICE_ORDERS_LIST_ROUTE}/${row.original.uuid}/detalhe`)
                  }
                >
                  {text.list.actions.view}
                </Actions.Item>
              )}
              {canEdit && (
                <Actions.Item
                  icon={<Icon as={FiEdit} />}
                  onClick={() => navigate(`${SERVICE_ORDERS_LIST_ROUTE}/${row.original.uuid}`)}
                >
                  {text.list.actions.edit}
                </Actions.Item>
              )}
              {canCancelServiceOrder(canCancelPermission, row.original.status.value) && (
                <Actions.Item
                  icon={<Icon as={FiXCircle} />}
                  onClick={() => handleCancelClick(row.original)}
                >
                  {text.list.actions.cancel}
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
    [navigate, isDeleting, canView, canEdit, canDelete, canCancelPermission, text, languageGB]
  );

  const gridSettings = useGridSettings<ServiceOrderListItem>({
    storageKey: SERVICE_ORDERS_STORAGE_KEY,
    storageScope: useGridStorageScope(),
    columns: defaultColumns,
  });
  const { columnOrder, setColumnOrder, columnVisibility, setColumnVisibility } = gridSettings;

  const isLoading = checkLoadingStatus([serviceOrdersList]);
  const items = serviceOrdersList.data?.data?.items;
  const isEmpty = !isLoading && (items?.length ?? 0) === 0;

  const statusLegend = getServiceOrderStatusOptions(languageGB);

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
              canCreate={canCreate}
              onCreate={() => navigate(`${SERVICE_ORDERS_LIST_ROUTE}/novo`)}
              gridSettings={gridSettings}
            />
          }
        >
          <PageHeader title={text.list.pageTitle} description={text.list.pageSubtitle} />
        </HeaderGrid>

        {/* Legenda de status — SEMPRE visível, mirror `Appropriations`. */}
        <Flex gap={5} mt={4} wrap="wrap">
          {statusLegend.map((item) => (
            <Status
              key={item.status}
              text={item.label}
              backgroundColor={item.badgeColor}
              fontSize="sm"
              color="fg.muted"
            />
          ))}
        </Flex>

        <Box mt={6}>
          <Table
            isLoading={isLoading}
            isError={serviceOrdersList.isError}
            error={serviceOrdersList.error}
            isEmpty={isEmpty}
            onRetry={() => serviceOrdersList.refetch()}
            isRetrying={serviceOrdersList.isFetching}
            emptyIcon={FiClipboard as ElementType}
            emptyTitle={
              filtersApplied > 0 ? text.list.emptyState.titleFiltered : text.list.emptyState.title
            }
            emptyDescription={
              filtersApplied > 0
                ? text.list.emptyState.descriptionFiltered
                : text.list.emptyState.description
            }
            canCreate={filtersApplied === 0 && canCreate}
            onCreate={() => navigate(`${SERVICE_ORDERS_LIST_ROUTE}/novo`)}
            createLabel={text.list.emptyState.cta}
          />
        </Box>
      </TableProvider>

      <FilterSideServiceOrders
        isOpen={isFilterOpen}
        onClose={onCloseFilter}
        handleFilterChange={handleFilterChange}
        handleReset={handleResetFilter}
        filter={paginatedQuery.filter}
        languageGB={languageGB}
        filtersApplied={filtersApplied}
      />

      <CancelServiceOrderDialog
        isOpen={isOpenCancelDialog}
        onClose={handleCloseCancel}
        serviceOrder={toCancel ? { uuid: toCancel.uuid, code: toCancel.code } : null}
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
