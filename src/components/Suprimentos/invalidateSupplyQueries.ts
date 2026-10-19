// src/components/Suprimentos/invalidateSupplyQueries.ts
// -----------------------------------------------------------------------------
// Invalida TODAS as listas de Suprimentos afetadas por uma ação de trâmite
// (transferir, voltar etapa, receber...): Meus Processos, Solicitação, Cotações,
// Compras, Recebimentos, Autorização e o detalhe. `useRequest` só aceita 4
// chaves; este helper cobre o conjunto completo (execução 081, T-081-FE-01).
// -----------------------------------------------------------------------------

import { queryKey } from '@/constants/query-key';

import type { QueryClient } from '@tanstack/react-query';

export const supplyListQueryKeys: string[] = [
  queryKey.requestPurchases.myProcessesList,
  queryKey.requestPurchases.requestPurchasesList,
  queryKey.requestPurchases.inQuotationList,
  queryKey.requestPurchases.inPurchaseList,
  queryKey.requestPurchases.rejectedList,
  queryKey.requestReceipts.requestReceiptsList,
  queryKey.requestAuthorizations.requestAuthorizationsList,
  queryKey.requestPurchases.requestPurchase,
];

export function invalidateSupplyQueries(client: QueryClient, extraKeys: string[] = []): void {
  [...supplyListQueryKeys, ...extraKeys].forEach((key) => {
    client.invalidateQueries({ queryKey: [key] });
  });
}
