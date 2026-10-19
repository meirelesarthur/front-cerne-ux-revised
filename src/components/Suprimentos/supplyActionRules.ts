// src/components/Suprimentos/supplyActionRules.ts
// -----------------------------------------------------------------------------
// Regras PURAS de exibição das ações de Suprimentos por status, tipo e papel
// (execução 081, T-081-FE-01). Fonte da verdade do "quando a ação aparece" para
// Solicitação, Meus Processos, Cotações, Compras e Recebimentos — as telas só
// chamam estas funções (sem condição inline), o que permite testar cada linha
// do manifesto de ações do legado.
//
// Fonte: manifestos de ações dos contratos LEGADO-SUPRIMENTOS 03 (AC01..AC05),
// 04 (AM01..AM16), 05 (AM-01..AM-14), 08 (AM-01..AM-08) e 09 (AM-01..AM-08),
// com os AJUSTES do plano do front (A-01) onde a API passou a ter permissão e
// o legado não tinha checagem no servidor:
//   - Receber: SEM gate de permissão (T-081-API-03);
//   - Transferir: `request-purchases_edit` + (responsável OU `_transfer`),
//     fora dos status 3 e 4;
//   - Voltar Etapa: só o responsável (+ `request-purchases_edit`);
//   - Informar Status: `request-buy_edit`; Compras: `request-buy_*`;
//   - Enviar Autorização e Sub Solicitação na cotação: `request-quotation_view`
//     + responsável (DA-4, default A).
//
// UX apenas (esconder botão ≠ proteger operação): a autorização real é do
// servidor (403).
// -----------------------------------------------------------------------------

import { requestPurchaseStatus } from '@/constants/RequestPurchases/request-purchase-status';
import {
  financialGenerationTypes,
  finalizeTypesMyProcesses,
  finalizeTypesReceipts,
  requestPurchaseType,
} from '@/constants/RequestPurchases/request-purchase-type';

/** Subconjunto da linha de lista/detalhe que as regras leem. */
export interface SupplyRuleRow {
  status: number;
  type: string;
  responsible?: { uuid: string } | null;
  is_authorizer?: boolean;
  approved_quotations_count?: number;
  has_financial?: boolean;
}

export interface SupplyActionContext {
  /** Uuid do usuário logado (`useAuth().user?.uuid`). */
  userUuid?: string | null;
  /** Verificador de permissão (`usePermissions().can`). */
  can: (permission: string) => boolean;
  /**
   * `true` em listas JÁ filtradas por responsável (Meus Processos): o legado
   * trata "Resp." como sempre verdadeiro ali (contrato 04, §4.1), e a linha
   * pode vir sem o objeto `responsible`.
   */
  assumeResponsible?: boolean;
}

const NON_TRANSFERABLE_STATUS: readonly number[] = [
  requestPurchaseStatus.aguardandoAprovacao,
  requestPurchaseStatus.aguardandoCiencia,
];

const QUOTATION_STAGE_STATUS: readonly number[] = [
  requestPurchaseStatus.solicitacao,
  requestPurchaseStatus.cotacaoEmAndamento,
];

// "Resp." — `responsible_id == usuário logado`.
export function isResponsible(row: SupplyRuleRow, ctx: SupplyActionContext): boolean {
  if (ctx.assumeResponsible) return true;
  return !!ctx.userUuid && !!row.responsible?.uuid && row.responsible.uuid === ctx.userUuid;
}

function approvedCount(row: SupplyRuleRow): number {
  return row.approved_quotations_count ?? 0;
}

// ---- Solicitação (03) --------------------------------------------------------

// AC01 / AM01 — "Visualizar".
export function canView(ctx: SupplyActionContext): boolean {
  return ctx.can('request-purchases_view');
}

// AC03 / AM05 — "Editar": status 1.
export function canEdit(row: SupplyRuleRow, ctx: SupplyActionContext): boolean {
  return row.status === requestPurchaseStatus.solicitacao && ctx.can('request-purchases_edit');
}

// AC04 / AM06 — "Excluir": status 1.
export function canDelete(row: SupplyRuleRow, ctx: SupplyActionContext): boolean {
  return row.status === requestPurchaseStatus.solicitacao && ctx.can('request-purchases_delete');
}

// ---- Trâmite comum (03, 04, 05, 08, 09) ---------------------------------------

// AM-03 (Compras) / AM-01 (Recebimentos) — "Receber Solicitação": sem responsável, sem gate.
export function canReceive(row: SupplyRuleRow): boolean {
  return !row.responsible;
}

// AM07 / AM-04 — "Transferir Responsável": (responsável OU `request-purchases_transfer`)
// E status fora de {3, 4}; exige `request-purchases_edit`.
export function canTransfer(row: SupplyRuleRow, ctx: SupplyActionContext): boolean {
  if (!ctx.can('request-purchases_edit')) return false;
  if (NON_TRANSFERABLE_STATUS.includes(row.status)) return false;
  return isResponsible(row, ctx) || ctx.can('request-purchases_transfer');
}

// AC05 / AM15 / AM-08 — "Voltar Etapa": só o responsável, com
// `request-purchases_edit`. Na lista de Solicitação o legado esconde no status 1
// (`excludeFirstStatus`).
export function canStepBack(
  row: SupplyRuleRow,
  ctx: SupplyActionContext,
  options?: { excludeFirstStatus?: boolean }
): boolean {
  if (options?.excludeFirstStatus && row.status === requestPurchaseStatus.solicitacao) {
    return false;
  }
  return isResponsible(row, ctx) && ctx.can('request-purchases_edit');
}

// ---- Cotação (05) e Meus Processos (04) ------------------------------------------

// AM08 / AM-12 — "Cotar Pedido": responsável E status em {1, 2}; `request-quotation_view`.
export function canQuote(row: SupplyRuleRow, ctx: SupplyActionContext): boolean {
  return (
    isResponsible(row, ctx) &&
    QUOTATION_STAGE_STATUS.includes(row.status) &&
    ctx.can('request-quotation_view')
  );
}

// AM09 / AM-13 — "Enviar Autorização": responsável E status em {1, 2}. O legado
// não tinha `@can`; a API exige `request-quotation_view` (DA-4, default A).
export function canSendToAuthorization(row: SupplyRuleRow, ctx: SupplyActionContext): boolean {
  return (
    isResponsible(row, ctx) &&
    QUOTATION_STAGE_STATUS.includes(row.status) &&
    ctx.can('request-quotation_view')
  );
}

// AM03 — "Autorizar": status 3 E `is_authorizer`; `request-authorization_edit`.
export function canAuthorize(row: SupplyRuleRow, ctx: SupplyActionContext): boolean {
  return (
    row.status === requestPurchaseStatus.aguardandoAprovacao &&
    row.is_authorizer === true &&
    ctx.can('request-authorization_edit')
  );
}

// AM04 — "Acusar ciência": status 4 E responsável; `request-authorization_edit`.
export function canAcknowledge(row: SupplyRuleRow, ctx: SupplyActionContext): boolean {
  return (
    row.status === requestPurchaseStatus.aguardandoCiencia &&
    isResponsible(row, ctx) &&
    ctx.can('request-authorization_edit')
  );
}

// ---- Compras (08) ----------------------------------------------------------------

// AM10 / AM-05 — "Informar Status": responsável E status 6 E exatamente uma
// cotação aprovada; `request-buy_edit`.
export function canInformStatus(row: SupplyRuleRow, ctx: SupplyActionContext): boolean {
  return (
    isResponsible(row, ctx) &&
    row.status === requestPurchaseStatus.aguardandoCompra &&
    approvedCount(row) === 1 &&
    ctx.can('request-buy_edit')
  );
}

// "Criar Sub Solicitação".
//  - `stage: 'purchase'` (AM11 / AM-06, Meus Processos e Compras): responsável E
//    status 6 E mais de uma cotação aprovada (sem permissão adicional).
//  - `stage: 'quotation'` (AM-11 da Cotação): responsável E status em {1, 2};
//    `request-quotation_view` (DA-4).
export function canSeparate(
  row: SupplyRuleRow,
  ctx: SupplyActionContext,
  stage: 'purchase' | 'quotation' = 'purchase'
): boolean {
  if (!isResponsible(row, ctx)) return false;
  if (stage === 'quotation') {
    return QUOTATION_STAGE_STATUS.includes(row.status) && ctx.can('request-quotation_view');
  }
  return row.status === requestPurchaseStatus.aguardandoCompra && approvedCount(row) > 1;
}

// AM16 / AM-07 — "Download Arquivo": status >= 6 E uma cotação aprovada.
//  - `scope: 'myProcesses'`: responsável, sem `@can` (legado);
//  - `scope: 'purchases'`: `request-buy_view`.
export function canDownloadOrder(
  row: SupplyRuleRow,
  ctx: SupplyActionContext,
  scope: 'myProcesses' | 'purchases' = 'myProcesses'
): boolean {
  if (row.status < requestPurchaseStatus.aguardandoCompra || approvedCount(row) !== 1) {
    return false;
  }
  return scope === 'purchases' ? ctx.can('request-buy_view') : isResponsible(row, ctx);
}

// ---- Recebimentos (09) e fechamento em Meus Processos (04) ---------------------------

// AM12 / AM-05 — "Confirmar Recebimento": responsável E status 7; `request-receipts_edit`.
export function canConfirmReceipt(row: SupplyRuleRow, ctx: SupplyActionContext): boolean {
  return (
    isResponsible(row, ctx) &&
    row.status === requestPurchaseStatus.compraEfetuada &&
    ctx.can('request-receipts_edit')
  );
}

// AM13 / AM-06 — "Gerar Financeiro": responsável E status 8 E sem lançamento
// financeiro E tipo em {S, A, R, D, C}; `request-purchases_financial`.
export function canGenerateFinancial(row: SupplyRuleRow, ctx: SupplyActionContext): boolean {
  return (
    isResponsible(row, ctx) &&
    row.status === requestPurchaseStatus.compraRecebida &&
    row.has_financial !== true &&
    financialGenerationTypes.includes(row.type) &&
    ctx.can('request-purchases_financial')
  );
}

// AM14 / AM-07 — "Finalizar Pedido": responsável E status 8; `request-purchases_financial`.
// Tipos: Meus Processos = {P, U, F, E, M} (B sem ação de fechamento, como no
// legado); Recebimentos = {P, F, E, M, U, B}.
export function canFinalize(
  row: SupplyRuleRow,
  ctx: SupplyActionContext,
  scope: 'myProcesses' | 'receipts' = 'myProcesses'
): boolean {
  const allowedTypes = scope === 'receipts' ? finalizeTypesReceipts : finalizeTypesMyProcesses;
  return (
    isResponsible(row, ctx) &&
    row.status === requestPurchaseStatus.compraRecebida &&
    allowedTypes.includes(row.type) &&
    ctx.can('request-purchases_financial')
  );
}

// Linha do tipo U (Emergencial).
export function isEmergency(row: Pick<SupplyRuleRow, 'type'>): boolean {
  return row.type === requestPurchaseType.emergencial;
}
