// src/utils/formatCurrencyBRL.ts
// Extraído de `ProcessingDetalhe.tsx` (round-6, 97-Esteiras/039,
// TASK-FE-039-R6-03) para reuso pelos componentes de seção do Detalhe de
// Processamento (`ProcessingDetailAnimalsTable`).
export default function formatCurrencyBRL(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
