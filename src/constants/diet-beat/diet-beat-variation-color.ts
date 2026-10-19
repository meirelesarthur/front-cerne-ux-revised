// src/constants/diet-beat/diet-beat-variation-color.ts
// -----------------------------------------------------------------------------
// Cor de Badge da `variation` de cada item de Batida (`ItemDietBeatResource.
// variation`, CV-08: `quantity_realized*100/quantity`) — fidelidade ao
// accessor legado `ItemDietBeat::getVariationColorAttribute()` (CL-015,
// confirmado por leitura direta do `CONTRATO-dieta.md`): `green` quando
// `variation===100`, `orange` quando `>100`, `red` quando `<100`. Puramente
// cosmético/preview — o servidor já devolve `variation` calculada, este
// arquivo só resolve a cor (mirror `TYPE_BADGE_COLOR`/
// `getDietIngredientTypeBadgeColor`, convenção real do repo: `colorPalette`
// do Chakra v3, nunca `Record` inline dentro do componente).
// -----------------------------------------------------------------------------

/** Tolerância de ponto flutuante — evita falso "orange"/"red" por resíduo
 *  de arredondamento (ex.: 99.999999 tratado como 100). */
const VARIATION_TOLERANCE = 0.01;

const EXACT_VARIATION = 100;

/**
 * Resolve a cor de Badge para a `variation` de um item de Batida, fiel ao
 * accessor legado (CL-015).
 * @param {number | null | undefined} variation - Percentual realizado/previsto (CV-08).
 * @return {string} `colorPalette` do Chakra v3 para a Badge.
 */
export function getDietBeatItemVariationColor(variation: number | null | undefined): string {
  if (variation == null) return 'gray';
  if (Math.abs(variation - EXACT_VARIATION) < VARIATION_TOLERANCE) return 'green';
  return variation > EXACT_VARIATION ? 'orange' : 'red';
}
