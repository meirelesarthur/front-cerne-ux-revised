// src/constants/diet/diet-ingredient-type-classification-map.ts
// -----------------------------------------------------------------------------
// Mapa de classificação visual (cor de Badge) do campo `type` de cada linha
// de composição de Dieta (`IngredientType` — GAP-DIET-02, TASK-FE-DIET-01).
// Consumido pela badge de tipo do ingrediente (grid de detalhe/linha do
// form, TASK-FE-DIET-03).
//
// GAP-DIET-02 (herdado da API, registro — solução já definida pelo
// arquiteto): o backend SEMPRE grava `type: 'NU'` (Núcleo/CORE) em cada
// ingrediente, independente do produto selecionado — sem mapa produto→tipo
// (`ResolveIngredientLinesAction::ingredientType()`, confirmado por leitura
// direta). Este mapa cobre os 5 casos REAIS do enum (`IngredientType.php`:
// `VO`=Volumoso, `CO`=Concentrado, `NU`=Núcleo, `AD`=Aditivo, `AG`=Água)
// para quando/se o dono fornecer esse mapa no futuro — hoje, na prática, só
// `NU` é observado.
//
// Divergência documentada da tool `get_pwa_ui_components_pattern`
// (§12.6-bis, slots `classification.*`): esses tokens semânticos não foram
// encontrados materializados neste `frontend_root` (busca direta em
// `src/styles/theme`, `src/constants` — nenhum arquivo real usa
// `classification.<slot>`). Em vez de inventar tokens não confirmados no
// código real, este mapa segue a convenção REAL e já em produção neste
// repositório para badge-por-enum: `Record<Enum, string>` de
// `colorPalette` do Chakra v3 (mirror `TYPE_BADGE_COLOR` de
// `Fabrica/index.tsx`, Food). Fallback `'gray'` (mirror `neutral`) para
// qualquer valor fora do enum conhecido.
// -----------------------------------------------------------------------------

import type { IngredientType } from '@/@types/v2/Diets';

export const DIET_INGREDIENT_TYPE_BADGE_COLOR: Record<IngredientType, string> = {
  VO: 'green',
  CO: 'orange',
  NU: 'gray',
  AD: 'purple',
  AG: 'blue',
};

export const DIET_INGREDIENT_TYPE_BADGE_FALLBACK_COLOR = 'gray';

/**
 * Resolve a cor de Badge para um `IngredientType`, com fallback seguro
 * quando o valor não é reconhecido (defensivo — o backend hoje só emite
 * `'NU'`, GAP-DIET-02).
 * @param {string | null | undefined} type - Valor cru de `IngredientType`.
 * @return {string} `colorPalette` do Chakra v3 para a Badge.
 */
export function getDietIngredientTypeBadgeColor(type: string | null | undefined): string {
  if (!type) return DIET_INGREDIENT_TYPE_BADGE_FALLBACK_COLOR;
  return (
    DIET_INGREDIENT_TYPE_BADGE_COLOR[type as IngredientType] ??
    DIET_INGREDIENT_TYPE_BADGE_FALLBACK_COLOR
  );
}
