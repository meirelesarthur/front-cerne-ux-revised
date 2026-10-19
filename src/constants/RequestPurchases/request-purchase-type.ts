// src/constants/RequestPurchases/request-purchase-type.ts
// Enum `type` de Solicitação de Compra (RequestPurchase — Administrativo /
// Suprimentos, esteira 97-Esteiras/022, TASK-RP-FE-02). Mirror EXATO de
// `RequestPurchaseType` (backend, string-backed, contrato §4) — 11 valores
// fechados, imutável no update (regra 14).
//
// `type` é ESCRITO SEMPRE EM STRING (código de 1 letra) no payload — nunca
// reenviado no PUT (mesmo shape do backend, ver `@/@types/v2/RequestPurchases`).

export const requestPurchaseType = {
  produto: 'P',
  servico: 'S',
  adiantamento: 'A',
  reembolso: 'R',
  diaria: 'D',
  empreitada: 'C',
  compraEfetuada: 'F',
  frete: 'E',
  manutencao: 'M',
  emergencial: 'U',
  despesaFixa: 'B',
} as const;

export type RequestPurchaseType = (typeof requestPurchaseType)[keyof typeof requestPurchaseType];

// Execução 081 (T-081-FE-01) — agrupamentos de tipo que o legado usa para
// decidir as ações de fechamento em Meus Processos e Recebimentos
// (`my-processes.blade.php:138,147`; `request-receipts/index.blade.php`).
// "Gerar Financeiro": S, A, R, D, C. "Finalizar Pedido": P, U, F, E, M em
// Meus Processos (B fica SEM ação de fechamento ali, como no legado) e
// P, F, E, M, U, B em Recebimentos.
export const financialGenerationTypes: readonly string[] = [
  requestPurchaseType.servico,
  requestPurchaseType.adiantamento,
  requestPurchaseType.reembolso,
  requestPurchaseType.diaria,
  requestPurchaseType.empreitada,
];

export const finalizeTypesMyProcesses: readonly string[] = [
  requestPurchaseType.produto,
  requestPurchaseType.emergencial,
  requestPurchaseType.compraEfetuada,
  requestPurchaseType.frete,
  requestPurchaseType.manutencao,
];

export const finalizeTypesReceipts: readonly string[] = [
  ...finalizeTypesMyProcesses,
  requestPurchaseType.despesaFixa,
];
