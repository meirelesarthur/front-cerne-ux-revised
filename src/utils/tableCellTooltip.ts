/**
 * Regras puras de elegibilidade do tooltip de célula truncada da grid
 * compartilhada (`Table.tsx`, TASK EST-07/Tema C). Extraídas para permitir
 * teste unitário sem montar a árvore de componentes — a decisão de "mostrar
 * ou não tooltip" e "qual texto mostrar" não depende de DOM/hooks.
 *
 * Contrato: 97-Esteiras/005/CONTRATOS/CONTRATO-TEMA-C-tooltip-celula-truncada.md
 */

/**
 * Colunas de ação/ícone da grid — nunca têm tooltip de texto truncado,
 * mesmo que `minWidth="0"` seja aplicado ao wrapper (mesma lista já usada em
 * `Table.tsx` para os tratamentos especiais de `justify`/`onClick`/padding).
 */
const NON_TOOLTIP_COLUMN_IDS = new Set(['acoes', 'select', 'edit', 'pdf']);

/**
 * Uma coluna é elegível ao tooltip de overflow quando não é uma das colunas
 * de ação/seleção/ícone listadas acima.
 *
 * @param {string | undefined} columnId Id da coluna (`cell.column.columnDef.id`), se definido.
 * @return {boolean} `true` quando a coluna pode exibir tooltip de overflow.
 */
export function isTooltipEligibleColumn(columnId: string | undefined): boolean {
  if (!columnId) return false;
  return !NON_TOOLTIP_COLUMN_IDS.has(columnId);
}

/**
 * Retorna o texto a ser exibido no tooltip a partir do valor CRU da célula
 * (`cell.getValue()`), ou `undefined` quando a célula não é elegível (coluna
 * de ação) ou o valor não é uma string/number simples (JSX complexo, badge,
 * ícone, `null`/`undefined`).
 *
 * @param {string | undefined} columnId Id da coluna (`cell.column.columnDef.id`), se definido.
 * @param {unknown} value Valor cru da célula (`cell.getValue()`).
 * @return {string | undefined} O texto do tooltip, ou `undefined` quando não elegível.
 */
export function getCellTooltipText(
  columnId: string | undefined,
  value: unknown
): string | undefined {
  if (!isTooltipEligibleColumn(columnId)) return undefined;
  if (typeof value === 'string' || typeof value === 'number') {
    return String(value);
  }
  return undefined;
}
