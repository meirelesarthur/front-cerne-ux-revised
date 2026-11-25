// src/pages/Administrativo/Solicitacao/quotationRanking.ts
// Comparação das cotações de UMA ordem de compra (aba Cotações): valor final,
// ordem de exibição, menor valor e resumo. Regra pura, testada à parte.
//
// - Só cotação RECEBIDA (status 3) tem preço de verdade; aguardando e enviada
//   ainda não voltaram do fornecedor, então não entram na comparação e mostram
//   "—" no lugar de R$ 0,00.
// - Ordem: recebidas do menor para o maior valor final; depois enviadas e
//   aguardando, as mais recentes primeiro.
// - Menor valor: a recebida de menor valor final maior que zero (empate: a
//   primeira na ordem).

import { requestQuotationStatus } from '@/constants/RequestQuotations/request-quotation-status';

import type { RequestQuotationData } from '@/@types/v2/RequestQuotations';

type QuotationLike = Pick<
  RequestQuotationData,
  'uuid' | 'status' | 'total_value' | 'discount' | 'quotation_date' | 'created_at'
>;

export interface RankedQuotation<Q extends QuotationLike = QuotationLike> {
  quotation: Q;
  /** `total_value - discount`; `null` enquanto a cotação não foi recebida. */
  netValue: number | null;
  isReceived: boolean;
  isBest: boolean;
}

export interface QuotationSummary<Q extends QuotationLike = QuotationLike> {
  total: number;
  received: number;
  best: RankedQuotation<Q> | null;
}

export function isReceivedQuotation(quotation: Pick<QuotationLike, 'status'>): boolean {
  return quotation.status === requestQuotationStatus.recebida;
}

function quotationTime(quotation: QuotationLike): number {
  const time = Date.parse(quotation.quotation_date ?? quotation.created_at);
  return Number.isNaN(time) ? 0 : time;
}

export function rankQuotations<Q extends QuotationLike>(quotations: Q[]): RankedQuotation<Q>[] {
  const ranked = quotations.map((quotation) => {
    const isReceived = isReceivedQuotation(quotation);
    return {
      quotation,
      isReceived,
      netValue: isReceived ? quotation.total_value - quotation.discount : null,
      isBest: false,
    };
  });

  ranked.sort((a, b) => {
    if (a.isReceived !== b.isReceived) return a.isReceived ? -1 : 1;
    if (a.isReceived && b.isReceived) return (a.netValue ?? 0) - (b.netValue ?? 0);
    if (a.quotation.status !== b.quotation.status) return b.quotation.status - a.quotation.status;
    return quotationTime(b.quotation) - quotationTime(a.quotation);
  });

  const best = ranked.find((row) => row.isReceived && (row.netValue ?? 0) > 0);
  if (best) best.isBest = true;

  return ranked;
}

export function summarizeQuotations<Q extends QuotationLike>(
  ranked: RankedQuotation<Q>[]
): QuotationSummary<Q> {
  return {
    total: ranked.length,
    received: ranked.filter((row) => row.isReceived).length,
    best: ranked.find((row) => row.isBest) ?? null,
  };
}
