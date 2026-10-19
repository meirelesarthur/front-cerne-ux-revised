// src/pages/Operacional/Reproducao/ProtocoloEstacao/utils/formatStockDisplay.ts
// -----------------------------------------------------------------------------
// CAL-004 — formatação/parse do campo "Estoque" (FLD-024, `InputReadOnly`
// money pt-BR, calculado). Funções PURAS, sem dependência de React.
// -----------------------------------------------------------------------------

export function formatStockDisplay(value: number): string {
  return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/**
 * Inverso de `formatStockDisplay` — usado só para comparação (CAL-009), o
 * campo em si nunca é editado pelo usuário.
 *
 * @param {string} display - Valor formatado (pt-BR, ex.: "1.234,56").
 * @return {number} Valor numérico puro correspondente.
 */
export function parseStockDisplay(display: string): number {
  if (!display) return 0;
  const normalized = display.replace(/\./g, '').replace(',', '.');
  const parsed = Number(normalized);
  return Number.isNaN(parsed) ? 0 : parsed;
}
