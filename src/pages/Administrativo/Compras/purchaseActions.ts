// src/pages/Administrativo/Compras/purchaseActions.ts
// -----------------------------------------------------------------------------
// Ações da linha de "Compras" (execução 081, T-081-FE-09; contrato
// LEGADO-SUPRIMENTOS-08, manifesto AM-01..AM-08 e LM-09). Funções PURAS: devolvem,
// na ORDEM do dropdown do legado, os ids das ações visíveis; a tela só mapeia
// cada id para rótulo, ícone e efeito. As condições vêm de `supplyActionRules`.
//
// Ajustes sobre o legado (permissões que a API passou a exigir, T-081-API-03):
//  - "Visualizar" usa `request-purchases_view` (o `show` da API exige esse slug;
//    o legado checava `request-buy_view`, que a lista já exige);
//  - "Criar Sub Solicitação" exige também `request-buy_edit` (o legado não
//    checava; a API passou a exigir).
// Esconder botão não protege a operação: a autorização real é do servidor (403).
// -----------------------------------------------------------------------------

import { canSlaReport } from '@/components/Suprimentos/slaReport';
import {
  canDownloadOrder,
  canInformStatus,
  canReceive,
  canSeparate,
  canStepBack,
  canTransfer,
  canView,
  type SupplyActionContext,
  type SupplyRuleRow,
} from '@/components/Suprimentos/supplyActionRules';

export type PurchaseActionId =
  | 'view'
  | 'slaReport'
  | 'receive'
  | 'transfer'
  | 'informStatus'
  | 'createSub'
  | 'downloadOrder'
  | 'stepBack';

// LM-09 — ícones WhatsApp e E-mail (e "Download Arquivo"): status >= 6, uma
// cotação aprovada e `request-buy_view`.
export function canSendOrder(row: SupplyRuleRow, ctx: SupplyActionContext): boolean {
  return canDownloadOrder(row, ctx, 'purchases');
}

// Ordem do dropdown do legado (`request-buy/index.blade.php:132-195`).
export function getPurchaseActions(
  row: SupplyRuleRow,
  ctx: SupplyActionContext
): PurchaseActionId[] {
  const checks: Array<[PurchaseActionId, boolean]> = [
    ['view', canView(ctx)],
    ['slaReport', canSlaReport(ctx.can)],
    ['receive', canReceive(row)],
    ['transfer', canTransfer(row, ctx)],
    ['informStatus', canInformStatus(row, ctx)],
    ['createSub', canSeparate(row, ctx, 'purchase') && ctx.can('request-buy_edit')],
    ['downloadOrder', canSendOrder(row, ctx)],
    ['stepBack', canStepBack(row, ctx)],
  ];
  return checks.filter(([, visible]) => visible).map(([id]) => id);
}

export const purchaseRoutes = {
  view: (uuid: string) => `/administrativo/solicitacao/${uuid}/visualizar`,
} as const;
