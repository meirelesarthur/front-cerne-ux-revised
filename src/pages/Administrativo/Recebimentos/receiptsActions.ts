// src/pages/Administrativo/Recebimentos/receiptsActions.ts
// -----------------------------------------------------------------------------
// Ações da linha de "Recebimentos" (execução 081, T-081-FE-10; contrato
// LEGADO-SUPRIMENTOS-09, manifesto AM-01..AM-08 e LM-12). Funções PURAS: devolvem,
// na ORDEM do dropdown do legado (`request-receipts/index.blade.php:158-216`), os
// ids das ações visíveis; a tela só mapeia cada id para rótulo, ícone e efeito.
// As condições vêm de `supplyActionRules`.
//
// Ajustes sobre o legado (permissões que a API passou a exigir, T-081-API-03):
//  - "Visualizar" usa `request-purchases_view` (o `show` da API exige esse slug);
//  - "Transferir" exige `request-purchases_edit` e some nos status 3 e 4;
//  - "Voltar Etapa" exige `request-purchases_edit`.
// Esconder botão não protege a operação: a autorização real é do servidor (403).
// -----------------------------------------------------------------------------

import { canSlaReport } from '@/components/Suprimentos/slaReport';
import {
  canConfirmReceipt,
  canFinalize,
  canGenerateFinancial,
  canReceive,
  canStepBack,
  canTransfer,
  canView,
  type SupplyActionContext,
  type SupplyRuleRow,
} from '@/components/Suprimentos/supplyActionRules';

import { requestPurchaseStatus } from '@/constants/RequestPurchases/request-purchase-status';

export type ReceiptActionId =
  | 'receive'
  | 'view'
  | 'slaReport'
  | 'transfer'
  | 'confirmReceipt'
  | 'generateFinancial'
  | 'finalize'
  | 'stepBack';

// Ordem do dropdown do legado: Receber, Visualizar, Relatório SLA, Transferir,
// Confirmar Recebimento, Gerar Financeiro, Finalizar Pedido, Voltar Etapa.
export function getReceiptActions(row: SupplyRuleRow, ctx: SupplyActionContext): ReceiptActionId[] {
  const checks: Array<[ReceiptActionId, boolean]> = [
    ['receive', canReceive(row)],
    ['view', canView(ctx)],
    ['slaReport', canSlaReport(ctx.can)],
    ['transfer', canTransfer(row, ctx)],
    ['confirmReceipt', canConfirmReceipt(row, ctx)],
    ['generateFinancial', canGenerateFinancial(row, ctx)],
    ['finalize', canFinalize(row, ctx, 'receipts')],
    ['stepBack', canStepBack(row, ctx)],
  ];
  return checks.filter(([, visible]) => visible).map(([id]) => id);
}

// LM-12 — coluna "Lançado": `has_financial` OU status 9 (Pedido Finalizado).
export function isLaunched(row: { has_financial?: boolean; status: number }): boolean {
  return row.has_financial === true || row.status === requestPurchaseStatus.pedidoFinalizado;
}

export const receiptRoutes = {
  list: '/administrativo/recebimentos',
  view: (uuid: string) => `/administrativo/solicitacao/${uuid}/visualizar`,
  confirm: (uuid: string) => `/administrativo/recebimentos/${uuid}/confirmar`,
  financial: (uuid: string) => `/administrativo/recebimentos/${uuid}/financeiro`,
  finalize: (uuid: string) => `/administrativo/recebimentos/${uuid}/finalizar`,
} as const;
