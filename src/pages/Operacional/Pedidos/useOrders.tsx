// src/pages/Operacional/Pedidos/useOrders.tsx
// -----------------------------------------------------------------------------
// Hooks de query do módulo de PEDIDOS (Order — Operacional / Vendas, F-051,
// 97-Esteiras/043, PED-FE-02) — mesmo padrão de
// `Operacional/Romaneios/useRomaneios.tsx`:
//   - useOrdersList → useCustomGridQuery (listagem paginada REAL de servidor
//     + 6 filtros do drawer, contrato-tela §7.1/§7.4). Ordenação FIXA
//     `code`/`created_at` desc (imposta pelo servidor — nenhum `orderBy` é
//     enviado por esta tela).
//
// O satélite do filtro `client_id` (`listOrderClientOptions`,
// `clients/options` FLAT adaptado em `order-service.ts`) é consumido
// DIRETO por `FilterSideOrder.tsx` via `SelectAsyncPaginate` — mesmo
// racional de `listProductOptions`/`listClients` em `FilterSideBudget.tsx`,
// sem hook satélite dedicado (a própria função já casa com o contrato
// `service` do componente).
// -----------------------------------------------------------------------------

import type { Dispatch, SetStateAction } from 'react';

import { useCustomGridQuery } from '@/hooks/useCustomGridQuery';

import { queryKey } from '@/constants/query-key';

import { listOrders } from '@/services/v2/Orders/order-service';
import type { ListOrdersParams } from '@/services/v2/Orders/order-service';

import type { PaginatedQueryProps } from '@/@types/pagination';
import type { OrderListItem } from '@/@types/v2/Orders';

interface UseOrdersListProps {
  paginatedQuery: PaginatedQueryProps;
  setPaginatedQuery: Dispatch<SetStateAction<PaginatedQueryProps<any>>>;
  filter: ListOrdersParams;
}

export function useOrdersList({ paginatedQuery, setPaginatedQuery, filter }: UseOrdersListProps) {
  return useCustomGridQuery<OrderListItem, ListOrdersParams>({
    asyncFunction: listOrders,
    queryKey: queryKey.orders.orders,
    paginatedQuery,
    setPaginatedQuery,
    filterQuery: [],
    filter,
  });
}

export default useOrdersList;
