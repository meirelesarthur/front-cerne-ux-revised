// src/constants/RequestPurchases/request-purchase-priority.ts
// Enum `priority` de Solicitação de Compra (RequestPurchase — Administrativo /
// Suprimentos, esteira 97-Esteiras/022, TASK-RP-FE-02). Mirror EXATO de
// `RequestPurchasePriority` (backend, int-backed, contrato §4) — 3 valores
// fechados.
//
// `requestPurchasePriorityColor` — sugestão visual do Arquiteto/Executor (não
// é regra de negócio), ajustável por revisão do dev.

export const requestPurchasePriority = {
  alta: 0,
  media: 1,
  baixa: 2,
} as const;

export type RequestPurchasePriority =
  (typeof requestPurchasePriority)[keyof typeof requestPurchasePriority];

export const requestPurchasePriorityColor: Record<RequestPurchasePriority, string> = {
  0: 'red',
  1: 'yellow',
  2: 'gray',
};
