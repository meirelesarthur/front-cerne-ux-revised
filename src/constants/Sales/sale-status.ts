// src/constants/Sales/sale-status.ts
// Enum `status` de Venda (Sale — Operacional / Vendas COMERCIAL, venda de
// PRODUTOS, 97-Esteiras/043). Mirror EXATO de `App\Enums\SaleStatus`
// (backend, int-backed) — 3 valores fechados (contrato-api-sale-comercial.md
// §0/§3): 1 Aguardando Emissão de NFe, 2 Fechado, 9 Cancelado.
//
// `saleStatusColor` — CO-LOCADO neste arquivo (get_pwa_constants_and_mappers_
// pattern §4), valores fixados pela Tarefa (não é sugestão do Executor).

export const saleStatus = {
  aguardandoEmissaoNfe: 1,
  fechado: 2,
  cancelado: 9,
} as const;

export type SaleStatus = (typeof saleStatus)[keyof typeof saleStatus];

export const saleStatusColor: Record<SaleStatus, string> = {
  1: 'yellow',
  2: 'green',
  9: 'red',
};
