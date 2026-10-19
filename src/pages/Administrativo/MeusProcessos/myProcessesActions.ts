// src/pages/Administrativo/MeusProcessos/myProcessesActions.ts
// -----------------------------------------------------------------------------
// Ações da linha de "Meus Processos" (execução 081, T-081-FE-07; contrato
// LEGADO-SUPRIMENTOS-04, manifesto AM01..AM16). Função PURA: devolve, na ORDEM
// do dropdown do legado, os ids das ações visíveis para a linha. A tela só
// mapeia cada id para rótulo, ícone e efeito — nenhuma condição de status/papel
// fica inline no componente. As condições vêm de `supplyActionRules`.
//
// A lista já vem filtrada por responsável no servidor, então o contexto deve ser
// criado com `assumeResponsible: true` (o legado trata "Resp." como sempre
// verdadeiro nesta tela). Esconder botão não protege a operação: a autorização
// real é da API (403).
// -----------------------------------------------------------------------------

import { canSlaReport } from '@/components/Suprimentos/slaReport';
import {
  canAcknowledge,
  canAuthorize,
  canConfirmReceipt,
  canDelete,
  canDownloadOrder,
  canEdit,
  canFinalize,
  canGenerateFinancial,
  canInformStatus,
  canQuote,
  canSendToAuthorization,
  canSeparate,
  canStepBack,
  canTransfer,
  canView,
  type SupplyActionContext,
  type SupplyRuleRow,
} from '@/components/Suprimentos/supplyActionRules';

export type MyProcessesActionId =
  | 'view'
  | 'slaReport'
  | 'authorize'
  | 'acknowledge'
  | 'edit'
  | 'delete'
  | 'transfer'
  | 'quote'
  | 'sendToAuthorization'
  | 'informStatus'
  | 'createSub'
  | 'confirmReceipt'
  | 'generateFinancial'
  | 'finalize'
  | 'stepBack'
  | 'downloadOrder';

// Ordem do dropdown do legado (`my-processes.blade.php:60-169`).
export function getMyProcessesActions(
  row: SupplyRuleRow,
  ctx: SupplyActionContext
): MyProcessesActionId[] {
  const checks: Array<[MyProcessesActionId, boolean]> = [
    ['view', canView(ctx)],
    ['slaReport', canSlaReport(ctx.can)],
    ['authorize', canAuthorize(row, ctx)],
    ['acknowledge', canAcknowledge(row, ctx)],
    ['edit', canEdit(row, ctx)],
    ['delete', canDelete(row, ctx)],
    ['transfer', canTransfer(row, ctx)],
    ['quote', canQuote(row, ctx)],
    ['sendToAuthorization', canSendToAuthorization(row, ctx)],
    ['informStatus', canInformStatus(row, ctx)],
    ['createSub', canSeparate(row, ctx, 'purchase')],
    ['confirmReceipt', canConfirmReceipt(row, ctx)],
    ['generateFinancial', canGenerateFinancial(row, ctx)],
    ['finalize', canFinalize(row, ctx, 'myProcesses')],
    ['stepBack', canStepBack(row, ctx)],
    ['downloadOrder', canDownloadOrder(row, ctx, 'myProcesses')],
  ];
  return checks.filter(([, visible]) => visible).map(([id]) => id);
}

// Rotas de destino das ações de navegação (sem diálogo).
export const myProcessesRoutes = {
  view: (uuid: string) => `/administrativo/solicitacao/${uuid}/visualizar`,
  edit: (uuid: string) => `/administrativo/solicitacao/${uuid}`,
  // Cotar Pedido e Enviar Autorização levam à aba Cotações da solicitação.
  quotationTab: (uuid: string) => `/administrativo/solicitacao/${uuid}?tab=4`,
  authorization: (uuid: string) => `/administrativo/autorizacao/${uuid}`,
  confirmReceipt: (uuid: string) => `/administrativo/recebimentos/${uuid}/confirmar`,
  generateFinancial: (uuid: string) => `/administrativo/recebimentos/${uuid}/financeiro`,
  finalize: (uuid: string) => `/administrativo/recebimentos/${uuid}/finalizar`,
} as const;
