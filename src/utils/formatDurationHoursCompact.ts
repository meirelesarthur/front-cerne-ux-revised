// src/utils/formatDurationHoursCompact.ts
// Formata uma duração em horas como `Xh` (< 24h) ou `X dia`/`X dias` (>= 24h)
// — mirror de estilo de `formatDurationHms.ts` (parts só non-zero, sem casas
// decimais). `null` (sem base de cálculo — nenhuma farm filtrada tem
// parâmetro configurado, ou nenhum segmento mensurável no cohort, RF-08) →
// travessão (`—`), nunca `NaN`/`undefined` literal na tela (Tarefa 57,
// contrato de tela v2 §6.3).
//
// Suffixo "dia"/"dias" é literal pt-BR — mesmo racional de
// `formatCurrencyBRL.ts` (formatação de UNIDADE hardcoded independe do
// idioma da interface, não é copy de tela livre) — decisão de detalhe do
// Executor (contrato de tela §6.3 "decisão de detalhe do Executor, sem
// impacto de contrato"), não uma string de UI arbitrária.
export default function formatDurationHoursCompact(hours: number | null): string {
  if (hours === null) return '—';

  const safeHours = Math.max(0, hours);
  if (safeHours < 24) return `${Math.round(safeHours)}h`;

  const days = Math.round(safeHours / 24);
  return `${days} ${days === 1 ? 'dia' : 'dias'}`;
}
