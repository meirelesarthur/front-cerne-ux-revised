// src/pages/Administrativo/Autorizacao/authorizationRules.ts
// -----------------------------------------------------------------------------
// Regras PURAS da Autorização e Ciência (execução 081, T-081-FE-06; contrato
// LEGADO-SUPRIMENTOS-07 §5/§6). A tela só chama estas funções (sem condição
// inline), o que permite testar cada vetor do legado sem renderizar:
//   - rateio do Ordenador: linha inicial 100,00, soma acima de 100 zera o campo
//     editado, envio exige soma 100, categoria e centro (IG03, IG07, IG08, CV06/CV07);
//   - validações da "Próxima Etapa" da Aprovação (IG05, IG06 e as mensagens do
//     servidor RA:183-250): comentário, cotação, itens e "um item, uma cotação";
//   - seleção de cotação (checkbox só com forma de pagamento) e lápis do item
//     (só P/S/U/M com cotação);
//   - gate do "Transf. Responsável" da Aprovação (a lista de Suprimentos esconde
//     nos status 3/4; aqui o legado mostrava sempre, e a API exige permissão).
// Textos: literais do legado, dos catálogos de idioma (`messages` injetadas).
// -----------------------------------------------------------------------------

import { requestPurchaseType } from '@/constants/RequestPurchases/request-purchase-type';

import type { RequestQuotationData } from '@/@types/v2/RequestQuotations';

/** Total que o rateio precisa fechar. */
export const RATIO_TOTAL = 100;
const RATIO_TOLERANCE = 0.001;

/** Limites de justificativa (T-081-API-01/02). */
export const APPROVAL_JUSTIFY_MAX_LENGTH = 600;
export const SECOND_LEVEL_JUSTIFY_MAX_LENGTH = 400;

/** Tipos que passam por cotação (P, S, U, M): status resultante 6 na aprovação. */
const QUOTABLE_TYPES: readonly string[] = [
  requestPurchaseType.produto,
  requestPurchaseType.servico,
  requestPurchaseType.emergencial,
  requestPurchaseType.manutencao,
];

export function isQuotableType(type: string | null | undefined): boolean {
  return !!type && QUOTABLE_TYPES.includes(type);
}

// ---- Rateio ----------------------------------------------------------------

/** Linha de UI do rateio (categoria e centro por uuid, percentual numérico). */
export interface RatioRow {
  category_uuid: string;
  center_uuid: string;
  percent: number | null;
}

// Linha inicial do legado: uma linha com 100,00.
export function initialRatioRows(): RatioRow[] {
  return [{ category_uuid: '', center_uuid: '', percent: RATIO_TOTAL }];
}

export function ratioTotal(rows: RatioRow[]): number {
  return rows.reduce((sum, row) => sum + (Number(row.percent) || 0), 0);
}

// IG03: ao sair do campo, total acima de 100 zera o campo editado.
export function ratioExceedsTotal(rows: RatioRow[]): boolean {
  return ratioTotal(rows) - RATIO_TOTAL > RATIO_TOLERANCE;
}

/** Parte do estado do rateio que a validação lê (o `RatioState` da tela satisfaz). */
export type RatioValidationInput = { rows: RatioRow[] };

export type RatioValidationError = 'sum' | 'category' | 'center';

// D-100-22: Safra e Classificação NÃO bloqueiam nenhuma ação (iguais ao legado: o
// asterisco existe, a exigência não). Ordem: IG07 (soma diferente de 100), IG08
// (categoria vazia, centro vazio). Só deve ser chamada quando o servidor mandou
// `requires_ratio_block`.
export function validateRatio(input: RatioValidationInput): RatioValidationError | null {
  if (Math.abs(ratioTotal(input.rows) - RATIO_TOTAL) > RATIO_TOLERANCE) return 'sum';
  if (input.rows.some((row) => !row.category_uuid)) return 'category';
  if (input.rows.some((row) => !row.center_uuid)) return 'center';
  return null;
}

// Os 3 arrays paralelos por índice que a API espera (`categories[i]` ↔ `centers[i]` ↔ `category_percent_values[i]`).
export function zipRatioRows(rows: RatioRow[]) {
  return {
    categories: rows.map((row) => row.category_uuid),
    centers: rows.map((row) => row.center_uuid),
    category_percent_values: rows.map((row) => Number(row.percent) || 0),
  };
}

// ---- Seleção de cotações e itens ---------------------------------------------

// Cotação "com forma de pagamento": escolhida (`selected_payment_uuid`) ou com uma
// única condição, que o servidor assume ao aprovar (efeito do `edit()` legado,
// RA:133-139, agora sem escrita em GET).
export function quotationHasPayment(
  quotation: Pick<RequestQuotationData, 'selected_payment_uuid' | 'payments'>
): boolean {
  if (quotation.selected_payment_uuid) return true;
  return (quotation.payments?.length ?? 0) === 1;
}

// Condição de pagamento exibida na coluna "Forma de pagamento": a escolhida ou a única.
export function selectedPayment<T extends { uuid: string }>(
  quotation: Pick<RequestQuotationData, 'selected_payment_uuid'> & { payments?: T[] }
): T | null {
  const payments = quotation.payments ?? [];
  if (quotation.selected_payment_uuid) {
    return payments.find((payment) => payment.uuid === quotation.selected_payment_uuid) ?? null;
  }
  return payments.length === 1 ? payments[0] : null;
}

// Legado FF02: marcada por padrão só quando há exatamente uma cotação e ela tem pagamento.
export function initialSelectedQuotations(quotations: RequestQuotationData[]): string[] {
  if (quotations.length === 1 && quotationHasPayment(quotations[0])) return [quotations[0].uuid];
  return [];
}

// AC13: lápis do item só em P, S, U, M e com cotação.
export function canEditItemQuantity(
  type: string | null | undefined,
  quotationsCount: number
): boolean {
  return isQuotableType(type) && quotationsCount > 0;
}

export interface ApproveValidationInput {
  justify: string;
  type: string | null | undefined;
  quotationsCount: number;
  selectedQuotationCount: number;
  itemsCount: number;
  selectedItemCount: number;
}

export type ApproveValidationError = 'comment' | 'quotation' | 'items' | 'singleItemQuotations';

// "Próxima Etapa" da Aprovação. Ordem: comentário (IG05); cotação marcada quando há
// cotações (IG06); nos tipos P/S/U/M (status 6): itens marcados e "um item, uma
// cotação" (RA:239-250).
export function validateApprove(input: ApproveValidationInput): ApproveValidationError | null {
  if (!input.justify.trim()) return 'comment';
  if (input.quotationsCount > 0 && input.selectedQuotationCount === 0) return 'quotation';
  if (isQuotableType(input.type)) {
    if (input.selectedItemCount === 0) return 'items';
    if (input.selectedItemCount === 1 && input.selectedQuotationCount > 1) {
      return 'singleItemQuotations';
    }
  }
  return null;
}

// ---- Ações ------------------------------------------------------------------

// IG05/IG10/IG12: justificativa preenchida (swal "Informe um comentário").
export function isJustifyFilled(justify: string): boolean {
  return justify.trim().length > 0;
}

// "Transf. Responsável" da Aprovação (AC05): sempre visível no legado; a API exige
// `request-purchases_edit` e (responsável atual OU `request-purchases_transfer`).
export function canTransferInApproval(
  ctx: { userUuid?: string | null; can: (permission: string) => boolean },
  responsibleUuid: string | null | undefined
): boolean {
  if (!ctx.can('request-purchases_edit')) return false;
  const isResponsible = !!ctx.userUuid && !!responsibleUuid && ctx.userUuid === responsibleUuid;
  return isResponsible || ctx.can('request-purchases_transfer');
}

// Hora de promover: só na Ciência, com a flag do contexto e permissão de escrita.
export function shouldAutoPromote(
  context:
    { auto_promote_available?: boolean; can_acknowledge_second_level?: boolean } | null | undefined,
  canEdit: boolean
): boolean {
  return !!context?.auto_promote_available && !!context.can_acknowledge_second_level && canEdit;
}
