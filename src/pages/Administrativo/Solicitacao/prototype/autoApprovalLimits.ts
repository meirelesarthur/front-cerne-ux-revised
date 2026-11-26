// src/pages/Administrativo/Solicitacao/prototype/autoApprovalLimits.ts
// -----------------------------------------------------------------------------
// PROTÓTIPO — limites diários da aprovação automática (tela "Fluxo da ordem de
// compra"). Três números andam juntos:
//   limite diário = valor por ordem × transações por dia.
// Mudar um deles redistribui os outros (decisão do dono, 26/11):
//   - valor por ordem  → recalcula o limite diário (mantém as transações);
//   - transações/dia   → recalcula o limite diário;
//   - limite diário    → recalcula as transações (quantas ordens cabem nele).
// Sem valor por ordem (vazio ou 0) não há como dividir: as transações ficam como
// estão e o limite diário vai a 0.
// -----------------------------------------------------------------------------

export interface AutoApprovalLimits {
  /** Aprovação automática até este valor por ordem (R$). */
  perOrder: number | null;
  /** Soma máxima aprovada automaticamente por dia (R$). */
  dailyValue: number | null;
  /** Quantidade máxima de ordens aprovadas automaticamente por dia. */
  dailyCount: number | null;
}

export type AutoApprovalField = keyof AutoApprovalLimits;

const round2 = (value: number) => Math.round(value * 100) / 100;

export function redistributeAutoApproval(
  current: AutoApprovalLimits,
  field: AutoApprovalField,
  value: number | null
): AutoApprovalLimits {
  const next = { ...current, [field]: value };
  const perOrder = next.perOrder ?? 0;

  if (field === 'dailyValue') {
    if (perOrder <= 0) return next;
    return { ...next, dailyCount: Math.floor((value ?? 0) / perOrder) };
  }

  // valor por ordem ou transações mudaram: o limite diário acompanha.
  return { ...next, dailyValue: round2(perOrder * (next.dailyCount ?? 0)) };
}
