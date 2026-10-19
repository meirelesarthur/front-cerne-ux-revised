// src/pages/Operacional/ServiceOrders/invalidateServiceOrderQueries.ts
// -----------------------------------------------------------------------------
// Invalidação de cache após uma mutação que muda o status da OS (cancelar —
// execução 086, FE-01). Uma OS cancelada aparece em 5 telas (Lista de OS,
// detalhe, Minhas OS, Monitoramento e Avaliações) — todas as chaves são
// derivadas da tradução (`constants/query-key.ts`), nunca literais. O
// `useRequest` só invalida 4 chaves; este helper cobre o conjunto completo.
// -----------------------------------------------------------------------------

import { queryKey } from '@/constants/query-key';

import type { QueryClient } from '@tanstack/react-query';

/** Chaves (1º elemento da query key) afetadas por mudança de status da OS. */
export const SERVICE_ORDER_STATUS_CHANGE_QUERY_KEYS: readonly string[] = [
  queryKey.serviceOrders.serviceOrders,
  queryKey.serviceOrders.serviceOrder,
  queryKey.myServiceOrders.myServiceOrders,
  queryKey.myServiceOrders.myServiceOrder,
  queryKey.monitoring.monitorings,
  queryKey.ratingServiceOrders.ratingServiceOrders,
  queryKey.ratingServiceOrders.ratingServiceOrder,
];

/**
 * @param {QueryClient} client - Client do TanStack Query.
 * @return {void}
 */
export function invalidateServiceOrderStatusQueries(client: QueryClient): void {
  SERVICE_ORDER_STATUS_CHANGE_QUERY_KEYS.forEach((key) => {
    client.invalidateQueries({ queryKey: [key] });
  });
}
