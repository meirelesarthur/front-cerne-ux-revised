// src/constants/dashboards/abcIndicators/abc-indicator-format.ts
// Precisão de apresentação dos 14 indicadores (execução 046, TASK-ABC-FE-03)
// — `CLM-008`: o serviço NUNCA arredonda, só a apresentação. 12 contínuos em
// 2 casas (mirror `money(...,2)` do legado), 2 inteiros (`days_filled`/
// `days_empty`, mirror `intval`). A UNIDADE de cada indicador vem de
// `languageGB.dashboards.abcIndicators.units.*` (i18n, nunca literal aqui).

import type { AbcIndicatorsData } from '@/@types/v2/Dashboards/abcIndicators';

export type AbcIndicatorField = keyof Omit<AbcIndicatorsData, 'meta'>;

export const abcIndicatorFormat: Record<AbcIndicatorField, { precision: number }> = {
  total_production_kg: { precision: 2 },
  total_production_rearing: { precision: 2 },
  total_production_slaughter: { precision: 2 },
  total_comercialize: { precision: 2 },
  productivity_kg_ha: { precision: 2 },
  productivity_arroba_ha: { precision: 2 },
  capacity_rate_ua: { precision: 2 },
  capacity_rate_ha: { precision: 2 },
  daily_weight_gain: { precision: 2 },
  average_entry_weight: { precision: 2 },
  average_weight_out: { precision: 2 },
  average_consumption: { precision: 2 },
  days_filled: { precision: 0 },
  days_empty: { precision: 0 },
};

/**
 * Formata um indicador do ABC Corte com a precisão canônica do campo.
 * @param {AbcIndicatorField} field - Nome do campo em `AbcIndicatorsData`.
 * @param {number} value - Valor cru vindo da API (sem arredondamento).
 * @return {string} Valor formatado pt-BR (vírgula decimal) na precisão do campo.
 */
export function formatAbcIndicator(field: AbcIndicatorField, value: number): string {
  const { precision } = abcIndicatorFormat[field];
  return value.toLocaleString('pt-BR', {
    minimumFractionDigits: precision,
    maximumFractionDigits: precision,
  });
}
