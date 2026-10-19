// src/constants/inventoried/inventoried-status.ts
// -----------------------------------------------------------------------------
// Mapa de STATUS do animal no inventário (pivot `inventoried_animals.status`,
// 1/2/3) → TOKEN do design system `cerne` — TASK-INV-FE-04, contrato de tela
// §5 S3 (Mapa de status → token DS).
//
// Cores FIÉIS ao legado (`InventoriedAnimalsController.php:123-128`,
// `InventoriedAnimalStatus::color()` no backend novo): status 1 "Em Lote" =
// hex origem `#4ade80` · status 2 "Fora do Lote" = hex origem `#fbbf24` ·
// status 3 "Faltantes na Planilha" = hex origem `#f87171`. A API já devolve
// esse HEX em `status.color` (fiel ao legado) — o front NUNCA renderiza esse
// hex cru (Lei UX/get_spa_ux_fidelity_pattern): só a `status.value` decide o
// TOKEN abaixo, que resolve corretamente em light+dark.
//
// Regra de ouro (get_pwa_constants_and_mappers_pattern §4): mapa de cor NUNCA
// dentro do componente — sempre em `constants/`.
// -----------------------------------------------------------------------------

export const inventoriedAnimalStatus = {
  inBatch: 1,
  outOfBatch: 2,
  missing: 3,
} as const;

export type InventoriedAnimalStatusValue =
  (typeof inventoriedAnimalStatus)[keyof typeof inventoriedAnimalStatus];

// value → token do DS (colorPalette/cor sólida) — hex de origem documentado
// no comentário de cabeçalho, nunca usado diretamente no JSX.
export const inventoriedAnimalStatusColorToken: Record<InventoriedAnimalStatusValue, string> = {
  [inventoriedAnimalStatus.inBatch]: 'green.400', // origem hex legado: #4ade80
  [inventoriedAnimalStatus.outOfBatch]: 'yellow.400', // origem hex legado: #fbbf24
  [inventoriedAnimalStatus.missing]: 'red.400', // origem hex legado: #f87171
};

export function getInventoriedAnimalStatusColorToken(value: number): string {
  return inventoriedAnimalStatusColorToken[value as InventoriedAnimalStatusValue] ?? 'gray.400';
}
