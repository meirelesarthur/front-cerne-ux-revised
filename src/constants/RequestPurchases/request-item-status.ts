// src/constants/RequestPurchases/request-item-status.ts
// Enum `status` de item de Solicitação de Compra (RequestItem — mirror EXATO
// de `RequestItemStatus`, backend, string-backed, contrato §4) — 3 valores
// fechados, somente leitura no formulário (nunca editado diretamente pelo
// usuário, muda por ação de trâmite).
//
// `requestItemStatusColor` — sugestão visual do Arquiteto/Executor (não é
// regra de negócio), ajustável por revisão do dev.

export const requestItemStatus = {
  pendente: 'P',
  entregue: 'E',
  cancelado: 'C',
} as const;

export type RequestItemStatus = (typeof requestItemStatus)[keyof typeof requestItemStatus];

export const requestItemStatusColor: Record<RequestItemStatus, string> = {
  P: 'yellow',
  E: 'green',
  C: 'red',
};
