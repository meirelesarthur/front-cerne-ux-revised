// src/constants/RequestPurchases/request-purchase-status.ts
// Enum `status` de Solicitação de Compra (RequestPurchase — Administrativo /
// Suprimentos, esteira 97-Esteiras/022, TASK-RP-FE-02). Mirror EXATO de
// `RequestPurchaseStatus` (backend, int-backed, contrato §4) — 11 valores
// fechados, máquina de estados de trâmite (receber/transferir/mudar status/
// finalizar).
//
// `requestPurchaseStatusColor` — sugestão visual do Arquiteto/Executor (não é
// regra de negócio), ajustável por revisão do dev quando a listagem
// (`TASK-RP-FE-08`) estiver pronta.

export const requestPurchaseStatus = {
  solicitacao: 1,
  cotacaoEmAndamento: 2,
  aguardandoAprovacao: 3,
  aguardandoCiencia: 4,
  pedidoNaoAprovado: 5,
  aguardandoCompra: 6,
  compraEfetuada: 7,
  compraRecebida: 8,
  pedidoFinalizado: 9,
  pedidoCancelado: 10,
  analisarProcesso: 11,
} as const;

export type RequestPurchaseStatus =
  (typeof requestPurchaseStatus)[keyof typeof requestPurchaseStatus];

export const requestPurchaseStatusColor: Record<RequestPurchaseStatus, string> = {
  1: 'gray',
  2: 'blue',
  3: 'orange',
  4: 'yellow',
  5: 'red',
  6: 'orange',
  7: 'blue',
  8: 'teal',
  9: 'green',
  10: 'red',
  11: 'purple',
};

// Execução 081 (T-081-FE-01) — bolinha de status do LEGADO
// (`RequestPurchase::colors()`, 1..11). Valor = NOME do token semântico
// `supplyStatusN` (light e dark em `styles/theme/semantic`), nunca hex fixo.
export const requestPurchaseStatusDotToken: Record<RequestPurchaseStatus, string> = {
  1: 'supplyStatus1',
  2: 'supplyStatus2',
  3: 'supplyStatus3',
  4: 'supplyStatus4',
  5: 'supplyStatus5',
  6: 'supplyStatus6',
  7: 'supplyStatus7',
  8: 'supplyStatus8',
  9: 'supplyStatus9',
  10: 'supplyStatus10',
  11: 'supplyStatus11',
};
