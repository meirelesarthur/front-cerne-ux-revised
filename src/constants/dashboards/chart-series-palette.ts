// src/constants/dashboards/chart-series-palette.ts
// Paleta categórica de séries dos gráficos de dashboard (execução 046,
// TASK-DASH-FE-01). A COR em si mora no tema semântico (dark E light —
// `src/styles/theme/semantic/{light,dark}.ts` → `chart.series.0..7`); este
// arquivo só declara a ORDEM canônica de consumo (índice 0..7, mesma ordem
// do `cerne`) e o helper de acesso circular para blocos com mais de 8
// categorias. Consumido por `src/components/charts/*` via
// `useChart({ series })` — nunca hex direto em componente (Regra de Ouro).

export const CHART_SERIES_TOKEN_COUNT = 8;

/** Ordem canônica dos slots de série — índice 0..7, mesma ordem do UX `cerne`. */
export const chartSeriesTokens = [
  'chart.series.0',
  'chart.series.1',
  'chart.series.2',
  'chart.series.3',
  'chart.series.4',
  'chart.series.5',
  'chart.series.6',
  'chart.series.7',
] as const;

export type ChartSeriesToken = (typeof chartSeriesTokens)[number];

/**
 * Cor de série por posição, com wrap circular (a 9ª série reusa o slot 0).
 *
 * Uso:
 * ```ts
 * useChart({ series: data.map((s, i) => ({ name: s.key, color: getChartSeriesColor(i) })) })
 * ```
 * @param {number} index - Posição da série na ordem de renderização (0-based).
 * @return {ChartSeriesToken} Caminho do token semântico da cor (`chart.series.0..7`).
 */
export function getChartSeriesColor(index: number): ChartSeriesToken {
  const safeIndex =
    ((index % CHART_SERIES_TOKEN_COUNT) + CHART_SERIES_TOKEN_COUNT) % CHART_SERIES_TOKEN_COUNT;
  return chartSeriesTokens[safeIndex];
}
