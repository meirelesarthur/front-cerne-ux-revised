// src/pages/Operacional/Vendas/useSales.tsx
// -----------------------------------------------------------------------------
// Hook de query da listagem de Vendas COMERCIAL (Sale — Operacional / Vendas,
// venda de PRODUTOS, 97-Esteiras/043, SALE-FE-COM-02) — mirror EXATO de
// `Operacional/Pedidos/useOrders.tsx`: useSalesList → useCustomGridQuery.
// Ordenação FIXA do servidor (`code`/`created_at` desc) — esta tela NÃO
// envia `orderBy`.
// -----------------------------------------------------------------------------

import type { Dispatch, SetStateAction } from 'react';

import { useMutation, useQuery } from '@tanstack/react-query';

import { useCustomGridQuery } from '@/hooks/useCustomGridQuery';

import { queryKey } from '@/constants/query-key';

import { getSaleNfeDraft, listSales } from '@/services/v2/Sales/sale-service';
import type { ListSalesParams } from '@/services/v2/Sales/sale-service';
import { listWarehouseOptions } from '@/services/v2/Warehouses/warehouse-service';

import type { PaginatedQueryProps } from '@/@types/pagination';
import type { Response } from '@/@types/response-api';
import type { SaleListItem, SaleNfeDraft } from '@/@types/v2/Sales';

interface UseSalesListProps {
  paginatedQuery: PaginatedQueryProps;
  setPaginatedQuery: Dispatch<SetStateAction<PaginatedQueryProps<any>>>;
  filter: ListSalesParams;
}

export function useSalesList({ paginatedQuery, setPaginatedQuery, filter }: UseSalesListProps) {
  return useCustomGridQuery<SaleListItem, ListSalesParams>({
    asyncFunction: listSales,
    queryKey: queryKey.sales.sales,
    paginatedQuery,
    setPaginatedQuery,
    filterQuery: [],
    filter,
  });
}

// -----------------------------------------------------------------------------
// SALE-FE-COM-04 — satélite PLANO do Armazém da linha de item (`SaleItemRow`,
// `/warehouses/options`, contrato-tela §6.1). Sem `type` (o contrato não
// restringe a um subtipo de armazém, ao contrário de `Carregamento`) — mirror
// `useChargeItemWarehouseOptions`, `queryKey` PRÓPRIA para o cache ser
// compartilhado entre TODAS as linhas do `useFieldArray('items')`.
// -----------------------------------------------------------------------------
export function useSaleWarehouseOptions() {
  return useQuery({
    queryKey: [queryKey.sales.sales, 'item-warehouse-options'],
    queryFn: () => listWarehouseOptions({}),
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
    retry: false,
  });
}

// -----------------------------------------------------------------------------
// SALE-FE-COM-06 — Handoff NFe (A6, SE007). `useMutation` DIRETO (não
// `useRequest`) — nada persiste no servidor (draft read-only, mirror
// `useIssueMovementSaleNfe`), nenhuma queryKey invalidada, erro tratado
// localmente pelo caller (`SaleEmitNfeDialog.tsx`, toast manual).
// -----------------------------------------------------------------------------
export function useSaleNfeDraft() {
  return useMutation<Response<SaleNfeDraft>, unknown, string>({
    mutationFn: async (saleUuid: string) => getSaleNfeDraft(saleUuid),
  });
}

export default useSalesList;
