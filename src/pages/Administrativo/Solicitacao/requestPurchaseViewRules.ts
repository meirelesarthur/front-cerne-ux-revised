// src/pages/Administrativo/Solicitacao/requestPurchaseViewRules.ts
// -----------------------------------------------------------------------------
// Regras puras da visualização da Solicitação (execução 081, T-081-FE-05).
// -----------------------------------------------------------------------------

import { requestPurchaseStatus } from '@/constants/RequestPurchases/request-purchase-status';

import type { RequestClassification } from '@/@types/v2/RequestPurchases';

// Rótulo da classificação do rateio (`null`/ausente = "Não Classificado").
export function classificationLabel(
  classification: RequestClassification | null | undefined,
  labels: Record<RequestClassification, string>
): string {
  return labels[classification ?? 'N'] ?? labels.N;
}

// A seção "Recebimento" só aparece depois da compra recebida (status 8).
export function showReceiptSection(status: number | undefined): boolean {
  return status === requestPurchaseStatus.compraRecebida;
}
