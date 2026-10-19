// src/pages/Operacional/Pedidos/index.tsx
// -----------------------------------------------------------------------------
// Tela de LISTAGEM (grid) de Pedidos (Order — Operacional / Vendas, F-051,
// 97-Esteiras/043, PED-FE-02). Rota `/operacional/pedidos` — guardada por
// `<RequirePermission permission="orders_view">` (menu `ope-ven-ped`/
// `navigationPermissions.ts:752` JÁ EXISTIAM — só a rota real, `router/
// index.tsx`, é nova nesta Tarefa).
//
// Mirror ESTRUTURAL DIRETO de `Operacional/Budget/index.tsx` (módulo análogo
// direto, contrato-tela §2/§10), com a composição extraída em arquivos
// dedicados (`HeaderTable.tsx`/`FilterSideOrder.tsx`/`useOrders.tsx`/
// `OrderActionsMenu.tsx` — mirror `Operacional/Romaneios`).
//
// Colunas (LM-001..010, contrato-tela §7.4): Status (dot+label+color DIRETO
// do `OrderStatusRef` do Resource — "sem mapper de cor no componente", leitura
// do dev da Tarefa) · Nº (`code`) · Data · Cliente (`client.info`, já
// composto pelo backend) · Responsável (`user.name` | "-") · Vl. Total ·
// Ações. Legenda estática de status (todas as 4 cores, mesmo quando a página
// atual não contém as 4) usa `orderStatusOptions`/`orderStatusColor`
// (PED-FE-01) — SÓ para a legenda; a célula da linha nunca usa esse mapper
// (mirror `Planejamentos`/`Budget` quanto à separação das duas fontes).
//
// Ações (AM-001..011, §7.4): Visualizar/Imprimir sempre · Editar/Excluir
// `status < 2` · "Gerar Venda" (SALE-FE-COM-10, 97-Esteiras/063) habilitada
// `status < 3 && sales_create`, navega para `/operacional/pedidos/{uuid}/
// gerar-venda` — ver `OrderActionsMenu.tsx`. Imprimir usa `getOrderReportBlob`
// (`responseType: 'blob'`) + `URL.createObjectURL` + nova aba — NUNCA
// `window.open` cru (perderia o header `X-Farm-Id`, contrato-tela §3).
// Excluir pode falhar por FK de `sales` (status >= 2) mesmo com o botão
// habilitado — `useRequest` já exibe a `message` real do servidor (nenhum
// tratamento especial necessário, mirror `deleteBudget`/`deleteRequisition`).
//
// FLT-006 (`pagination_quantity`, 10/30/50/80/100/200) não é querystring
// própria — sincroniza `paginatedQuery.pageSize` (o `per_page` real da
// grid) via `handleFilterChangeWithPageSize`; o próprio `<Table>` recebe
// `pageSizeOptions` iguais para o seletor nativo de linhas/página ficar
// consistente com o drawer (mesmo estado, duas portas de entrada).
// -----------------------------------------------------------------------------

import { useMemo, useState, type ElementType } from 'react';

import { Box, Flex, Text, useDisclosure, VStack } from '@chakra-ui/react';
import { createColumnHelper } from '@tanstack/react-table';
import { format } from 'date-fns';
import { FiFileText } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

import { ContainerGrid } from '@/components/ContainerGrid';
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';
import { HeaderGrid } from '@/components/HeaderGrid';
import { Status } from '@/components/Status';
import { Table } from '@/components/Table';
import { toaster } from '@/components/ui/toaster';

import { TableProvider } from '@/contexts/TableContext';

import { useLanguage } from '@/hooks/useLanguage';
import { userPaginatedQuery } from '@/hooks/usePaginatedQueryStorage';
import { usePermissions } from '@/hooks/usePermissions';
import { useRequest } from '@/hooks/useRequest';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import formatCurrencyBRL from '@/utils/formatCurrencyBRL';
import formatDate from '@/utils/formatDate';
import { styleColumTable } from '@/utils/style-colum-table';

import { orderStatusOptions } from '@/constants/Orders/options';
import { defaultPaginationQuantity } from '@/constants/Orders/options/pagination-quantity-options';
import { orderStatusColor } from '@/constants/Orders/order-status';
import { queryKey } from '@/constants/query-key';

import { deleteOrder, getOrderReportBlob } from '@/services/v2/Orders/order-service';
import type { ListOrdersParams } from '@/services/v2/Orders/order-service';

import type { OrderFilterForm, OrderListItem } from '@/@types/v2/Orders';

import { FilterSideOrder } from './FilterSideOrder';
import { HeaderTable } from './HeaderTable';
import { OrderActionsMenu } from './OrderActionsMenu';
import { useOrdersList } from './useOrders';

const ORDER_STORAGE_KEY = 'OperacionalPedidos' + queryKey.orders.orders;

const DATE_FORMAT = 'yyyy-MM-dd';

const PAGE_SIZE_OPTIONS = [10, 30, 50, 80, 100, 200];

// Achatamento `OrderFilterForm` (Option/Date-based) → `ListOrdersParams`
// (querystring real de `GET /orders`) — mirror `Budget/index.tsx::
// toRequestFilter`. `pagination_quantity` NÃO entra aqui — vira
// `paginatedQuery.pageSize` (per_page), nunca um param de filtro próprio.
function toRequestFilter(filter?: OrderFilterForm | null): ListOrdersParams {
  return {
    search: filter?.search || undefined,
    product: filter?.product?.value || undefined,
    client_id: filter?.client?.value || undefined,
    start_date: filter?.start_date ? format(filter.start_date, DATE_FORMAT) : undefined,
    end_date: filter?.end_date ? format(filter.end_date, DATE_FORMAT) : undefined,
  };
}

export default function OrdersList() {
  const { languageGB } = useLanguage();
  const navigate = useNavigate();
  const { can } = usePermissions();
  const text = languageGB.orders.order;

  const canCreate = can('orders_create');
  const canView = can('orders_view');
  const canEdit = can('orders_edit');
  const canDelete = can('orders_delete');
  const canGenerateSale = can('sales_create');

  const defaultQueryOptions = useMemo(
    () => ({
      pageSize: defaultPaginationQuantity,
      storageKey: ORDER_STORAGE_KEY,
    }),
    []
  );

  const { paginatedQuery, handlePaginatedQuery, handleFilterChange, handleResetFilter } =
    userPaginatedQuery<OrderFilterForm>(defaultQueryOptions);

  // ---- Estado de filtro (drawer) ------------------------------------------
  const { open: isFilterOpen, onOpen: onOpenFilter, onClose: onCloseFilter } = useDisclosure();

  // `pagination_quantity` fica de fora da contagem — é o espelho do
  // seletor nativo do `<Table>`, não um filtro de negócio (mirror da
  // exclusão de `search`/`*_label` em `Romaneios/index.tsx`).
  const filtersApplied = useMemo(
    () =>
      Object.entries(paginatedQuery.filter ?? {})
        .filter(([key]) => key !== 'pagination_quantity')
        .filter(([, v]) => v !== undefined && v !== null && v !== '').length,
    [paginatedQuery.filter]
  );

  const requestFilter = useMemo(
    () => toRequestFilter(paginatedQuery.filter),
    [paginatedQuery.filter]
  );

  const ordersList = useOrdersList({
    paginatedQuery,
    setPaginatedQuery: handlePaginatedQuery,
    filter: requestFilter,
  });

  // FLT-006 — sincroniza `paginatedQuery.pageSize` (per_page real) quando o
  // drawer aplica um `pagination_quantity` novo. Contrato B preservado (a
  // prop repassada ao drawer continua sendo só `handleFilterChange`).
  function handleFilterChangeWithPageSize(newFilter: OrderFilterForm) {
    handleFilterChange(newFilter);
    const pageSize = newFilter.pagination_quantity?.value ?? defaultPaginationQuantity;
    handlePaginatedQuery((prev) => ({ ...prev, pageSize, pageIndex: 1 }));
  }

  // ---- Estado de exclusão ---------------------------------------------------
  const [toDelete, setToDelete] = useState<OrderListItem | null>(null);
  const {
    open: isOpenDeleteDialog,
    onOpen: onOpenDeleteDialog,
    onClose: onCloseDeleteDialog,
  } = useDisclosure();

  const deleteMutation = useRequest({
    asyncFunction: async ({ orderUuid }: { orderUuid: string }) => {
      // `deleteOrder` retorna 204 sem body — `undefined` explícito satisfaz
      // o contrato `Promise<Response<any> | undefined>` de `useRequest`
      // (mirror `deleteBudget`). Pode falhar com erro de negócio (FK de
      // `sales`, status >= 2) mesmo com o botão habilitado — `useRequest`
      // já exibe a `message` real do servidor no toast de erro.
      await deleteOrder(orderUuid);
      return undefined;
    },
    queryKey: queryKey.orders.orders,
    typesRequest: 'apply',
    entityName: text.singularLabel,
    personalizedMessage: text.list.deletedToast,
    actionSuccess: () => {
      onCloseDeleteDialog();
      setToDelete(null);
    },
  });

  function handleDeleteClick(order: OrderListItem) {
    setToDelete(order);
    onOpenDeleteDialog();
  }

  function handleConfirmDelete() {
    if (toDelete) {
      deleteMutation.mutate({ orderUuid: toDelete.uuid });
    }
  }

  const isDeleting = deleteMutation.isPending;

  // ---- Imprimir (PDF blob, contrato-tela §3) --------------------------------
  const [printingUuid, setPrintingUuid] = useState<string | null>(null);

  async function handlePrint(orderUuid: string) {
    setPrintingUuid(orderUuid);
    try {
      const blob = await getOrderReportBlob(orderUuid);
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
      setTimeout(() => URL.revokeObjectURL(url), 10_000);
    } catch {
      toaster.error({ title: text.singularLabel, description: text.list.printErrorToast });
    } finally {
      setPrintingUuid(null);
    }
  }

  const columnHelper = createColumnHelper<OrderListItem>();
  const defaultColumns = useMemo(
    () => [
      // LM-001 — dot+label DIRETO do `OrderStatusRef` do Resource (leitura
      // do dev da Tarefa: "sem mapper de cor no componente").
      columnHelper.accessor((row) => row.status.label, {
        id: 'status',
        header: text.list.table.columns.status,
        enableHiding: false,
        cell: ({ row }) => (
          <Box
            boxSize="2.5"
            borderRadius="full"
            bg={`${row.original.status.color}.500`}
            title={row.original.status.label}
          />
        ),
        meta: { ...styleColumTable.sm, gridLabel: text.list.table.columns.status },
      }),
      columnHelper.accessor('code', {
        header: text.list.table.columns.code,
        cell: ({ row }) => (
          <Text fontFamily="mono" fontSize="sm" fontWeight="medium">
            {row.original.code}
          </Text>
        ),
        meta: { ...styleColumTable.sm, gridLabel: text.list.table.columns.code },
      }),
      columnHelper.accessor('date', {
        header: text.list.table.columns.date,
        cell: ({ row }) => (
          <Text fontSize="sm" color="fg.muted">
            {row.original.date ? formatDate(row.original.date, 'dd/MM/yyyy') : '—'}
          </Text>
        ),
        meta: { ...styleColumTable.date, gridLabel: text.list.table.columns.date },
      }),
      columnHelper.accessor((row) => row.client.info, {
        id: 'client',
        header: text.list.table.columns.client,
        enableHiding: false, // coluna-âncora — nunca ocultável
        cell: ({ row }) => (
          <Text fontWeight="medium" lineClamp="1">
            {row.original.client.info}
          </Text>
        ),
        meta: { gridLabel: text.list.table.columns.client },
      }),
      columnHelper.accessor((row) => row.user.name ?? '', {
        id: 'user',
        header: text.list.table.columns.user,
        cell: ({ row }) => <Text fontSize="sm">{row.original.user.name ?? '-'}</Text>,
        meta: { gridLabel: text.list.table.columns.user },
      }),
      columnHelper.accessor('total', {
        header: text.list.table.columns.total,
        cell: ({ row }) => (
          <Text fontSize="sm" textAlign="right" fontVariantNumeric="tabular-nums">
            {formatCurrencyBRL(row.original.total)}
          </Text>
        ),
        meta: { ...styleColumTable.md, gridLabel: text.list.table.columns.total },
      }),
      columnHelper.display({
        id: 'acoes',
        header: '',
        enableHiding: false,
        cell: ({ row }) => (
          <Flex justify="flex-end">
            <OrderActionsMenu
              status={row.original.status.value}
              canView={canView}
              canEdit={canEdit}
              canDelete={canDelete}
              canGenerateSale={canGenerateSale}
              isDeleting={isDeleting}
              isPrinting={printingUuid === row.original.uuid}
              onView={() => navigate(`/operacional/pedidos/${row.original.uuid}/detalhe`)}
              onEdit={() => navigate(`/operacional/pedidos/${row.original.uuid}`)}
              onDelete={() => handleDeleteClick(row.original)}
              onPrint={() => handlePrint(row.original.uuid)}
              onGenerateSale={() =>
                navigate(`/operacional/pedidos/${row.original.uuid}/gerar-venda`)
              }
              labels={{
                view: text.list.table.actions.view,
                edit: text.list.table.actions.edit,
                delete: text.list.table.actions.delete,
                print: text.list.table.actions.print,
                generateSale: text.list.table.actions.generateSale,
                generateSaleTooltip: text.list.table.actions.generateSaleTooltip,
                editDisabledTooltip: text.list.table.actions.editDisabledTooltip,
                deleteDisabledTooltip: text.list.table.actions.deleteDisabledTooltip,
              }}
            />
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
    [
      navigate,
      isDeleting,
      printingUuid,
      text,
      canView,
      canEdit,
      canDelete,
      canGenerateSale,
      languageGB.defaltStrings.actions,
    ]
  );

  const isLoading = checkLoadingStatus([ordersList]);
  const items = ordersList.data?.data?.items;
  const isEmpty = !isLoading && (items?.length ?? 0) === 0;

  // Legenda estática de cores de status — SEMPRE visível (mirror
  // `Budget`/`Planejamentos`), fonte SÓ da legenda (a célula da linha usa o
  // Resource direto, nunca este mapper).
  const statusLegend = useMemo(() => orderStatusOptions.options(languageGB), [languageGB]);

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
          <VStack align="flex-start" gap={1}>
            <Text fontSize="2xl" fontWeight="bold" color="brandColorText">
              {text.singularLabel}
            </Text>
          </VStack>
        </HeaderGrid>

        <Flex gap={5} mt={4} wrap="wrap">
          {statusLegend.map((option) => (
            <Status
              key={option.value}
              text={option.label}
              backgroundColor={`${orderStatusColor[option.value]}.500`}
              fontSize="sm"
              color="fg.muted"
            />
          ))}
        </Flex>

        <Box mt={6}>
          <Table
            isLoading={isLoading}
            isError={ordersList.isError}
            error={ordersList.error}
            isEmpty={isEmpty}
            onRetry={() => ordersList.refetch()}
            isRetrying={ordersList.isFetching}
            retryLabel={text.list.error.retry}
            emptyIcon={FiFileText as ElementType}
            emptyTitle={
              filtersApplied > 0
                ? text.list.emptyState.titleFiltered
                : text.list.emptyState.titleEmpty
            }
            emptyDescription={
              filtersApplied > 0
                ? text.list.emptyState.descriptionFiltered
                : text.list.emptyState.descriptionEmpty
            }
            canCreate={filtersApplied === 0 && canCreate}
            createLabel={text.list.emptyState.cta}
            onCreate={() => navigate('/operacional/pedidos/novo')}
            pageSizeOptions={PAGE_SIZE_OPTIONS}
          />
        </Box>
      </TableProvider>

      <FilterSideOrder
        isOpen={isFilterOpen}
        onClose={onCloseFilter}
        handleFilterChange={handleFilterChangeWithPageSize}
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
        title={text.list.deleteConfirm.title}
        description={text.list.deleteConfirm.description}
        itemName={toDelete?.code}
        hideQuestionMark
        tone="danger"
      />
    </ContainerGrid>
  );
}
