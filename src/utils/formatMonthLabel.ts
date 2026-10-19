// src/utils/formatMonthLabel.ts
// Fix wave F-211 (execução 062), item F: eixos/labels de série mensal
// (`financial-summary.monthly_revenue`/`cashflow_projection`, chave `YYYY-MM`)
// exibiam a chave crua da API (ex. `2026-01`) — formata para PT-BR curto
// (`Jan/2026`), mirror do formato já usado em badges/legendas de dashboard do
// fork. Entrada malformada (fora de `YYYY-MM`) devolve o valor original —
// nunca lança/renderiza `NaN`.

const MONTH_ABBREVIATIONS_PT_BR = [
  'Jan',
  'Fev',
  'Mar',
  'Abr',
  'Mai',
  'Jun',
  'Jul',
  'Ago',
  'Set',
  'Out',
  'Nov',
  'Dez',
];

/**
 * Formata uma chave de mês `YYYY-MM` (fonte: API) para `Mmm/AAAA` (PT-BR, 3 letras).
 * @param {string} month - Chave de mês no formato `YYYY-MM` (ex. `'2026-01'`).
 * @return {string} `Mmm/AAAA` (ex. `'Jan/2026'`), ou o valor original se malformado.
 */
export default function formatMonthLabel(month: string): string {
  const match = /^(\d{4})-(\d{2})$/.exec(month);
  if (!match) return month;

  const [, year, monthNumber] = match;
  const monthIndex = Number(monthNumber) - 1;
  if (monthIndex < 0 || monthIndex > 11) return month;

  return `${MONTH_ABBREVIATIONS_PT_BR[monthIndex]}/${year}`;
}
