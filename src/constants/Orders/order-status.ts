// src/constants/Orders/order-status.ts
// Enum `status` de Pedido (Order — Operacional / Vendas, F-051, PED-FE-01).
// Mirror EXATO de `App\Enums\OrderStatus` (backend, int-backed) — 4 valores
// fechados (contrato-api-pedidos.md §6): 1 Em Aberto, 2 Em Processamento
// (aguardando cobertura de venda), 3 Finalizado, 9 Cancelado.
//
// `orderStatusColor` — sugestão visual do Executor (não é regra de negócio),
// mirror do padrão já usado em `budgetStatusColor`.

export const orderStatus = {
  emAberto: 1,
  emProcessamento: 2,
  finalizado: 3,
  cancelado: 9,
} as const;

export type OrderStatus = (typeof orderStatus)[keyof typeof orderStatus];

export const orderStatusColor: Record<OrderStatus, string> = {
  1: 'gray',
  2: 'yellow',
  3: 'green',
  9: 'red',
};
