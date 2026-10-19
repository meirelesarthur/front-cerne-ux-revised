// src/pages/Operacional/Vendas/index.tsx
// -----------------------------------------------------------------------------
// Tela de LISTAGEM (grid) de Vendas COMERCIAL (Sale — venda de PRODUTOS,
// Operacional / Vendas, 97-Esteiras/043, SALE-FE-COM-02). Rota
// `/operacional/vendas` — guardada por `<RequirePermission
// permission="sales_view">`. Mirror ESTRUTURAL DIRETO de
// `Operacional/Pedidos/index.tsx` (irmão comercial migrado).
//
// Colunas (LM001, contrato-tela §7.2): dot de status (`Status` +
// `row.original.status.color`, direto do `SaleListResource` — mapper
// `saleStatusColor` é SÓ da legenda) · Nº (`code`) · Dt. Remessa
// (`dt_shipping`) · Dt. Venda (`dt_sale`) · Cliente (`client.info`) ·
// Responsável (`user.name` | "—") · Vl. Total · NFe (`nfe.numero_nfe` |
// "—") · Ações. Legenda estática dos 3 status via
// `saleStatusOptions.options(languageGB)` + `saleStatusColor`.
//
// Ações (A004/A007/A008, §7.2): Visualizar sempre · Editar/Excluir
// governadas pelos flags `can_edit`/`can_delete` do Resource + RBAC
// (`sales_edit`/`sales_delete`) — ZERO regra de negócio reimplementada no
// cliente (proibido `!nfe_id`/`incomes.isEmpty()`). "Gerar Adiantamento"
// (A005) e "Emitir NFe" (A006) nascem em `07`/`06` (`SaleActionsMenu.tsx`,
// aditivo). Exclusão pode falhar com `422` de negócio mesmo com o botão
// habilitado — `useRequest` já exibe a `message` real do servidor.
//
// FL001.pagination_quantity (10/30/50/80/100/200) NÃO é querystring própria
// — sincroniza `paginatedQuery.pageSize` via `handleFilterChangeWithPageSize`
// (mirror `Pedidos/index.tsx`).
// -----------------------------------------------------------------------------

import { useMemo, useState } from 'react';

import type { ElementType } from 'react';

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

import { TableProvider } from '@/contexts/TableContext';

import { useLanguage } from '@/hooks/useLanguage';
import { userPaginatedQuery } from '@/hooks/usePaginatedQueryStorage';
import { usePermissions } from '@/hooks/usePermissions';
import { useRequest } from '@/hooks/useRequest';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import formatCurrencyBRL from '@/utils/formatCurrencyBRL';
import formatDate from '@/utils/formatDate';
import { styleColumTable } from '@/utils/style-colum-table';

import { queryKey } from '@/constants/query-key';
import { defaultPaginationQuantity, saleStatusOptions } from '@/constants/Sales/options';
import { saleStatusColor } from '@/constants/Sales/sale-status';

import { deleteSale } from '@/services/v2/Sales/sale-service';
import type { ListSalesParams } from '@/services/v2/Sales/sale-service';

import type { SaleFilterForm, SaleListItem } from '@/@types/v2/Sales';

import { FilterSideSale } from './FilterSideSale';
import { HeaderTable } from './HeaderTable';
import { SaleActionsMenu } from './SaleActionsMenu';
import { SaleEmitNfeDialog } from './SaleEmitNfeDialog';
import { useSalesList } from './useSales';

const SALE_STORAGE_KEY = 'OperacionalVendas' + queryKey.sales.sales;

const DATE_FORMAT = 'yyyy-MM-dd';

const PAGE_SIZE_OPTIONS = [10, 30, 50, 80, 100, 200];

// Achatamento `SaleFilterForm` (Option/Date-based) → `ListSalesParams`
// (querystring real de `GET /sales`) — mirror `Pedidos/index.tsx::
// toRequestFilter`. `pagination_quantity` NÃO entra aqui — vira
// `paginatedQuery.pageSize` (per_page), nunca um param de filtro próprio.
function toRequestFilter(filter?: SaleFilterForm | null): ListSalesParams {
  return {
    search: filter?.search || undefined,
    product_uuid: filter?.product?.value || undefined,
    client_uuid: filter?.client?.value || undefined,
    start_date: filter?.start_date ? format(filter.start_date, DATE_FORMAT) : undefined,
    end_date: filter?.end_date ? format(filter.end_date, DATE_FORMAT) : undefined,
  };
}

export default function SalesList() {
  const { languageGB } = useLanguage();
  const navigate = useNavigate();
  const { can } = usePermissions();
  const text = languageGB.sales.sale;

  const canCreate = can('sales_create');
  const canEdit = can('sales_edit');
  const canDelete = can('sales_delete');
  // SALE-FE-COM-06 — gate duplo do handoff fiscal (`sales_view` já concedido
  // pela própria tela + `nfe_create`), responsabilidade do CALLER (nunca do
  // diálogo, mirror `MovementSaleEmitNfeDialog`).
  const canGenerateNfe = can('nfe_create');
  // SALE-FE-COM-07 — gate do adiantamento (contrato-api §8 DEC-02).
  const canAdvanceIncome = can('incomes_create');

  const defaultQueryOptions = useMemo(
    () => ({
      pageSize: defaultPaginationQuantity,
      storageKey: SALE_STORAGE_KEY,
    }),
    []
  );

  const { paginatedQuery, handlePaginatedQuery, handleFilterChange, handleResetFilter } =
    userPaginatedQuery<SaleFilterForm>(defaultQueryOptions);

  // ---- Estado de filtro (drawer) ------------------------------------------
  const { open: isFilterOpen, onOpen: onOpenFilter, onClose: onCloseFilter } = useDisclosure();

  // `pagination_quantity` fica de fora da contagem — é o espelho do
  // seletor nativo do `<Table>`, não um filtro de negócio (mirror `Pedidos`).
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

  const salesList = useSalesList({
    paginatedQuery,
    setPaginatedQuery: handlePaginatedQuery,
    filter: requestFilter,
  });

  // FL001 — sincroniza `paginatedQuery.pageSize` (per_page real) quando o
  // drawer aplica um `pagination_quantity` novo. Contrato B preservado (a
  // prop repassada ao drawer continua sendo só `handleFilterChange`).
  function handleFilterChangeWithPageSize(newFilter: SaleFilterForm) {
    handleFilterChange(newFilter);
    const pageSize = newFilter.pagination_quantity?.value ?? defaultPaginationQuantity;
    handlePaginatedQuery((prev) => ({ ...prev, pageSize, pageIndex: 1 }));
  }

  // ---- Estado de exclusão ---------------------------------------------------
  const [toDelete, setToDelete] = useState<SaleListItem | null>(null);
  const {
    open: isOpenDeleteDialog,
    onOpen: onOpenDeleteDialog,
    onClose: onCloseDeleteDialog,
  } = useDisclosure();

  const deleteMutation = useRequest({
    asyncFunction: async (saleUuid: string) => {
      // `deleteSale` retorna o corpo do soft delete — pode falhar com `422`
      // de negócio (NFe vinculada / adiantamento existente, contrato-api §8
      // DEC-03) mesmo com o botão habilitado — `useRequest` já exibe a
      // `message` real do servidor no toast de erro (mirror `deleteOrder`).
      await deleteSale(saleUuid);
      return undefined;
    },
    queryKey: queryKey.sales.sales,
    typesRequest: 'apply',
    entityName: text.singularLabel,
    personalizedMessage: text.list.deletedToast,
    actionSuccess: () => {
      onCloseDeleteDialog();
      setToDelete(null);
    },
  });

  function handleDeleteClick(sale: SaleListItem) {
    setToDelete(sale);
    onOpenDeleteDialog();
  }

  function handleConfirmDelete() {
    if (toDelete) {
      deleteMutation.mutate(toDelete.uuid);
    }
  }

  const isDeleting = deleteMutation.isPending;

  // ---- SALE-FE-COM-06 — diálogo de handoff "Emitir NFe" (A006) --------------
  const [saleForNfe, setSaleForNfe] = useState<SaleListItem | null>(null);
  const {
    open: isOpenNfeDialog,
    onOpen: onOpenNfeDialog,
    onClose: onCloseNfeDialog,
  } = useDisclosure();

  function handleGenerateNfeClick(sale: SaleListItem) {
    setSaleForNfe(sale);
    onOpenNfeDialog();
  }

  const columnHelper = createColumnHelper<SaleListItem>();
  const defaultColumns = useMemo(
    () => [
      // LM001 col. 1 — dot DIRETO do `SaleListResource` (`status.color`) —
      // mapper `saleStatusColor` é SÓ da legenda (contrato-tela §7.2).
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
      columnHelper.accessor('dt_shipping', {
        header: text.list.table.columns.dtShipping,
        cell: ({ row }) => (
          <Text fontSize="sm" color="fg.muted">
            {row.original.dt_shipping ? formatDate(row.original.dt_shipping, 'dd/MM/yyyy') : '—'}
          </Text>
        ),
        meta: { ...styleColumTable.date, gridLabel: text.list.table.columns.dtShipping },
      }),
      columnHelper.accessor('dt_sale', {
        header: text.list.table.columns.dtSale,
        cell: ({ row }) => (
          <Text fontSize="sm" color="fg.muted">
            {row.original.dt_sale ? formatDate(row.original.dt_sale, 'dd/MM/yyyy') : '—'}
          </Text>
        ),
        meta: { ...styleColumTable.date, gridLabel: text.list.table.columns.dtSale },
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
        cell: ({ row }) => <Text fontSize="sm">{row.original.user.name ?? '—'}</Text>,
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
      columnHelper.accessor((row) => row.nfe?.numero_nfe ?? '', {
        id: 'nfe',
        header: text.list.table.columns.nfe,
        cell: ({ row }) => (
          <Text fontSize="sm" color="fg.muted">
            {row.original.nfe?.numero_nfe ?? '—'}
          </Text>
        ),
        meta: { gridLabel: text.list.table.columns.nfe },
      }),
      columnHelper.display({
        id: 'acoes',
        header: '',
        enableHiding: false,
        cell: ({ row }) => (
          <Flex justify="flex-end">
            <SaleActionsMenu
              canEdit={canEdit}
              canDelete={canDelete}
              canGenerateNfe={canGenerateNfe}
              canAdvanceIncome={canAdvanceIncome}
              rowCanEdit={row.original.can_edit}
              rowCanDelete={row.original.can_delete}
              rowCanGenerateNfe={row.original.nfe == null}
              rowCanAdvanceIncome={row.original.can_advance_income}
              isDeleting={isDeleting}
              onView={() => navigate(`/operacional/vendas/${row.original.uuid}/detalhe`)}
              onEdit={() => navigate(`/operacional/vendas/${row.original.uuid}/editar`)}
              onDelete={() => handleDeleteClick(row.original)}
              onGenerateNfe={() => handleGenerateNfeClick(row.original)}
              onAdvanceIncome={() =>
                navigate(`/operacional/vendas/${row.original.uuid}/adiantamento`)
              }
              labels={{
                view: text.list.table.actions.view,
                edit: text.list.table.actions.edit,
                delete: text.list.table.actions.delete,
                generateNfe: text.list.table.actions.generateNfe,
                advanceIncome: text.list.table.actions.advanceIncome,
                editDisabledTooltip: text.list.table.actions.editDisabledTooltip,
                deleteDisabledTooltip: text.list.table.actions.deleteDisabledTooltip,
                generateNfePermissionTooltip: text.list.table.actions.generateNfePermissionTooltip,
                advanceIncomeDisabledTooltip: text.list.table.actions.advanceIncomeDisabledTooltip,
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
      text,
      canEdit,
      canDelete,
      canGenerateNfe,
      canAdvanceIncome,
      languageGB.defaltStrings.actions,
    ]
  );

  const isLoading = checkLoadingStatus([salesList]);
  const items = salesList.data?.data?.items;
  const isEmpty = !isLoading && (items?.length ?? 0) === 0;

  // Legenda estática de cores de status — SEMPRE visível (mirror `Pedidos`),
  // fonte SÓ da legenda (a célula da linha usa o Resource direto).
  const statusLegend = useMemo(() => saleStatusOptions.options(languageGB), [languageGB]);

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
              backgroundColor={`${saleStatusColor[option.value]}.500`}
              fontSize="sm"
              color="fg.muted"
            />
          ))}
        </Flex>

        <Box mt={6}>
          <Table
            isLoading={isLoading}
            pageSizeOptions={PAGE_SIZE_OPTIONS}
            isError={salesList.isError}
            error={salesList.error}
            isEmpty={isEmpty}
            onRetry={() => salesList.refetch()}
            isRetrying={salesList.isFetching}
            retryLabel={text.list.error.retry}
            emptyIcon={FiFileText as ElementType}
            emptyTitle={
              filtersApplied > 0 ? text.list.emptyState.titleFiltered : text.list.emptyState.titleEmpty
            }
            emptyDescription={
              filtersApplied > 0
                ? text.list.emptyState.descriptionFiltered
                : text.list.emptyState.descriptionEmpty
            }
            canCreate={filtersApplied === 0 && canCreate}
            onCreate={() => navigate('/operacional/vendas/novo')}
            createLabel={text.list.emptyState.cta}
          />
        </Box>
      </TableProvider>

      <FilterSideSale
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

      <SaleEmitNfeDialog
        isOpen={isOpenNfeDialog}
        onClose={() => {
          onCloseNfeDialog();
          setSaleForNfe(null);
        }}
        sale={saleForNfe}
      />
    </ContainerGrid>
  );
}
