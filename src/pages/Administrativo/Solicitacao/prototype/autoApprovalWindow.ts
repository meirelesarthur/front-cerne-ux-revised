// src/pages/Administrativo/Solicitacao/prototype/autoApprovalWindow.ts
// -----------------------------------------------------------------------------
// PROTÓTIPO — aprovação automática por VALOR, PRAZO e CONTAGEM (tela "Fluxo da
// ordem de compra"; decisão do dono de 26/11/2026, no lugar de "valor por
// ordem × limite diário × transações por dia").
//   - Valor: a soma das ordens aprovadas sem aprovador dentro do prazo não passa
//     dele; acima, a ordem vai para o aprovador.
//   - Prazo: diário, semanal, mensal ou anual.
//   - Contagem:
//       · dias corridos — conta para trás a partir de hoje (1, 7, 30 ou 365 dias,
//         incluindo hoje);
//       · período fechado — corte no início do período (hoje; segunda-feira da
//         semana; dia 1 do mês; 1º de janeiro).
// Regra pura, testada. Datas em `yyyy-MM-dd`, sem fuso.
// -----------------------------------------------------------------------------

export type ApprovalPeriod = 'diario' | 'semanal' | 'mensal' | 'anual';
export type ApprovalCounting = 'corridos' | 'fechado';

export interface AutoApprovalRule {
  value: number | null;
  period: ApprovalPeriod;
  counting: ApprovalCounting;
}

export const APPROVAL_PERIODS: ApprovalPeriod[] = ['diario', 'semanal', 'mensal', 'anual'];
export const APPROVAL_COUNTINGS: ApprovalCounting[] = ['corridos', 'fechado'];

/** Dias da janela em "dias corridos", contando hoje. */
const ROLLING_DAYS: Record<ApprovalPeriod, number> = { diario: 1, semanal: 7, mensal: 30, anual: 365 };

const toDate = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
};
const toIso = (date: Date) => date.toISOString().slice(0, 10);

/** Primeiro dia que entra na soma, para a data `today`. */
export function approvalWindowStart(today: string, period: ApprovalPeriod, counting: ApprovalCounting): string {
  const date = toDate(today);
  if (counting === 'corridos') {
    date.setUTCDate(date.getUTCDate() - (ROLLING_DAYS[period] - 1));
    return toIso(date);
  }
  if (period === 'semanal') {
    const weekday = (date.getUTCDay() + 6) % 7; // segunda = 0
    date.setUTCDate(date.getUTCDate() - weekday);
  } else if (period === 'mensal') {
    date.setUTCDate(1);
  } else if (period === 'anual') {
    date.setUTCMonth(0, 1);
  }
  return toIso(date);
}

/** A ordem segue sem aprovador? Soma já aprovada no prazo + esta ordem não passa do valor. */
export function canAutoApprove(orderValue: number, approvedInWindow: number, rule: AutoApprovalRule): boolean {
  const limit = rule.value ?? 0;
  return limit > 0 && approvedInWindow + orderValue <= limit;
}
