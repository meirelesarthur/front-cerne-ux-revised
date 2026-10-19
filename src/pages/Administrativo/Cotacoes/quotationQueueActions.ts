// src/pages/Administrativo/Cotacoes/quotationQueueActions.ts
// -----------------------------------------------------------------------------
// Ações da linha da fila "Cotações" e contagem de recebidas (execução 081,
// T-081-FE-08; contrato LEGADO 05 AM-11..AM-14 e P72, `request-quotations/
// index.blade.php:99-186`). Funções PURAS: a tela só mapeia id -> rótulo, ícone
// e efeito. As condições vêm de `supplyActionRules`.
//
// Ordem do dropdown do legado: Visualizar, Relatório SLA, Receber Solicitação,
// Transferir Responsável, Cotar Pedido, Enviar Autorização, Criar Sub
// Solicitação e Voltar Etapa. Editar e Excluir não existem nessa fila no legado;
// ficam ao final como acréscimo do novo mantido (decisão D-01 do plano), com as
// mesmas regras de status da Solicitação.
// -----------------------------------------------------------------------------

import { canSlaReport } from '@/components/Suprimentos/slaReport';
import {
  canDelete,
  canEdit,
  canQuote,
  canReceive,
  canSendToAuthorization,
  canSeparate,
  canStepBack,
  canTransfer,
  canView,
  type SupplyActionContext,
  type SupplyRuleRow,
} from '@/components/Suprimentos/supplyActionRules';

export type QuotationQueueActionId =
  | 'view'
  | 'slaReport'
  | 'receive'
  | 'transfer'
  | 'quote'
  | 'sendToAuthorization'
  | 'createSub'
  | 'stepBack'
  | 'edit'
  | 'delete';

export function getQuotationQueueActions(
  row: SupplyRuleRow,
  ctx: SupplyActionContext
): QuotationQueueActionId[] {
  const checks: Array<[QuotationQueueActionId, boolean]> = [
    ['view', canView(ctx)],
    ['slaReport', canSlaReport(ctx.can)],
    ['receive', canReceive(row)],
    ['transfer', canTransfer(row, ctx)],
    ['quote', canQuote(row, ctx)],
    ['sendToAuthorization', canSendToAuthorization(row, ctx)],
    ['createSub', canSeparate(row, ctx, 'quotation')],
    ['stepBack', canStepBack(row, ctx)],
    ['edit', canEdit(row, ctx)],
    ['delete', canDelete(row, ctx)],
  ];
  return checks.filter(([, visible]) => visible).map(([id]) => id);
}

// Rotas de destino das ações de navegação.
export const quotationQueueRoutes = {
  view: (uuid: string) => `/administrativo/solicitacao/${uuid}/visualizar`,
  edit: (uuid: string) => `/administrativo/solicitacao/${uuid}`,
  // Cotar Pedido e Enviar Autorização levam à aba Cotações da solicitação.
  quotationTab: (uuid: string) => `/administrativo/solicitacao/${uuid}?tab=4`,
} as const;

// "Cot. Recebidas" = recebidas/total (legado: `$item->received . '/' . $item->quotations_count`).
export function formatReceivedQuotations(row: {
  received_quotations_count?: number;
  quotations_count?: number;
}): string {
  return `${row.received_quotations_count ?? 0}/${row.quotations_count ?? 0}`;
}
