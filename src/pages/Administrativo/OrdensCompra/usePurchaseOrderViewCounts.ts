// src/pages/Administrativo/OrdensCompra/usePurchaseOrderViewCounts.ts
// Contador de cada visão da tela única de Ordens de compra (tags). Enquanto a
// API não tem contagem por visão, cada contador é o `pagination.total` da
// própria lista da visão, pedido com 1 item por página e sem filtros. A chave
// começa pela chave da lista, então as invalidações que a lista já faz (criar,
// excluir, trâmite) atualizam o contador junto.

import { useQueries } from '@tanstack/react-query';

import { queryKey } from '@/constants/query-key';

import { listRequestAuthorizations } from '@/services/v2/RequestAuthorizations/request-authorization-service';
import {
  listInPurchase,
  listMyProcesses,
  listRejectedRequestPurchases,
  listRequestPurchases,
  listRequestPurchasesInQuotation,
} from '@/services/v2/RequestPurchases/request-purchase-service';
import { listRequestReceipts } from '@/services/v2/RequestReceipts/request-receipt-service';

import type { PurchaseOrderView, PurchaseOrderViewKey } from './purchaseOrderViews';

type CountSource = {
  key: string;
  // Assinaturas dos serviços variam só nos filtros opcionais; aqui vão page/per_page.
  fetch: (params: { page: number; per_page: number; status?: number; scope?: 'all' }) => Promise<unknown>;
};

const COUNT_SOURCES: Record<PurchaseOrderViewKey, CountSource> = {
  todas: { key: queryKey.requestPurchases.requestPurchasesList, fetch: listRequestPurchases as CountSource['fetch'] },
  minhas: { key: queryKey.requestPurchases.requestPurchasesList, fetch: listRequestPurchases as CountSource['fetch'] },
  responsabilidade: { key: queryKey.requestPurchases.myProcessesList, fetch: listMyProcesses as CountSource['fetch'] },
  aprovar: { key: queryKey.requestAuthorizations.requestAuthorization, fetch: listRequestAuthorizations as CountSource['fetch'] },
  cotacao: { key: queryKey.requestPurchases.inQuotationList, fetch: listRequestPurchasesInQuotation as CountSource['fetch'] },
  compra: { key: queryKey.requestPurchases.inPurchaseList, fetch: listInPurchase as CountSource['fetch'] },
  recebimento: { key: queryKey.requestReceipts.requestReceiptsList, fetch: listRequestReceipts as CountSource['fetch'] },
  rejeitadas: { key: queryKey.requestPurchases.rejectedList, fetch: listRejectedRequestPurchases as CountSource['fetch'] },
  canceladas: { key: queryKey.requestPurchases.rejectedList, fetch: listRejectedRequestPurchases as CountSource['fetch'] },
};

function totalOf(response: unknown): number | undefined {
  const total = (response as { data?: { pagination?: { total?: number } } })?.data?.pagination?.total;
  return typeof total === 'number' ? total : undefined;
}

/** Total por visão visível; `undefined` enquanto carrega ou se a consulta falhar. */
export function usePurchaseOrderViewCounts(
  views: PurchaseOrderView[]
): Partial<Record<PurchaseOrderViewKey, number>> {
  const results = useQueries({
    queries: views.map((view) => ({
      queryKey: [COUNT_SOURCES[view.key].key, 'view-count', view.fixedFilter ?? null],
      queryFn: () =>
        COUNT_SOURCES[view.key].fetch({ page: 1, per_page: 1, ...(view.fixedFilter ?? {}) }),
      staleTime: 60 * 1000,
      retry: false,
    })),
  });

  const counts: Partial<Record<PurchaseOrderViewKey, number>> = {};
  views.forEach((view, index) => {
    counts[view.key] = totalOf(results.at(index)?.data);
  });
  return counts;
}
