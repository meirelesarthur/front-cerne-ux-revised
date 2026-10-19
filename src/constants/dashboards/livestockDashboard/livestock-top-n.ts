// src/constants/dashboards/livestockDashboard/livestock-top-n.ts
// Agrupamento top-N + "Outros" para `composition.by_breed`/`by_category`
// (35 raças/42 categorias reais, DEC-101) — a API devolve a lista completa
// (`LivestockDashboardRepository::compositionByBreedAndCategory`); o front
// recorta aqui para não estourar `DonutChart` visualmente (`ROTEIRO §5.5`,
// decisão default do dono: top 6-8 por `total` + bucket "Outros"). Rótulo
// "Outros" vem de i18n (`languageGB.dashboards.livestockDashboard.charts.*Others`),
// nunca literal — ver assinatura abaixo.
//
// **CORREÇÃO PÓS-E2E:** o campo real da API é `total` (não `count`,
// nome antigo especulativo) — `LivestockBreedRow`/`LivestockCategoryRow`
// (`@/@types/v2/Dashboards/livestockDashboard`) já usam o nome certo; esta
// função aceita qualquer shape estruturalmente compatível com
// `{label,total}` (ambos os tipos reais satisfazem isso).

interface LivestockCompositionLike {
  label: string;
  total: number;
}

const TOP_N = 6;

export interface LivestockTopNSlice {
  label: string;
  value: number;
}

/**
 * @param {LivestockCompositionLike[]} rows - Linhas de composição (raça ou categoria), na ordem que a API mandar.
 * @param {string} othersLabel - Rótulo i18n do bucket agregado (`charts.breedOthers`/`charts.categoryOthers`).
 * @return {LivestockTopNSlice[]} No máximo `TOP_N + 1` fatias (top N por `total`, desc, + "Outros" se sobrar resto > 0).
 */
export function groupLivestockTopN(
  rows: LivestockCompositionLike[],
  othersLabel: string
): LivestockTopNSlice[] {
  const sorted = [...rows].sort((a, b) => b.total - a.total);
  const top = sorted.slice(0, TOP_N).map((row) => ({ label: row.label, value: row.total }));
  const rest = sorted.slice(TOP_N).reduce((sum, row) => sum + row.total, 0);

  return rest > 0 ? [...top, { label: othersLabel, value: rest }] : top;
}
