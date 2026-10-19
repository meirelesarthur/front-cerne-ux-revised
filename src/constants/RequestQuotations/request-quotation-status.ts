// src/constants/RequestQuotations/request-quotation-status.ts
// Enum `status` de Cotação (RequestQuotation — Administrativo / Suprimentos,
// esteira 97-Esteiras/035, TASK-CQ-FE-01). Mirror EXATO de
// `App\Enums\RequestQuotationStatus` (backend, int-backed,
// `app/Enums/RequestQuotationStatus.php`) — 3 valores fechados: 1 aguardando
// o fornecedor preencher, 2 já enviada ao fornecedor, 3 recebida/preenchida
// pelo fornecedor via hash público (CL-039).
//
// `requestQuotationStatusColor` — sugestão visual do Executor (não é regra
// de negócio), mirror do padrão já usado em `requestPurchaseStatusColor`.

export const requestQuotationStatus = {
  aguardando: 1,
  enviada: 2,
  recebida: 3,
} as const;

export type RequestQuotationStatus =
  (typeof requestQuotationStatus)[keyof typeof requestQuotationStatus];

export const requestQuotationStatusColor: Record<RequestQuotationStatus, string> = {
  1: 'gray',
  2: 'blue',
  3: 'green',
};
