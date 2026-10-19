// src/components/charts/index.ts
// Barrel export do kit de gráficos de dashboard (execução 046, TASK-DASH-FE-03).

export { LineChart } from './LineChart';
export type { LineSeries } from './LineChart';
export { StackedBarChart } from './StackedBarChart';
export type { StackSeries } from './StackedBarChart';
export { GroupedBarChart } from './GroupedBarChart';
export type { GroupedSeries } from './GroupedBarChart';
export { DonutChart } from './DonutChart';
export type { DonutSlice } from './DonutChart';
export { SparklineArea } from './SparklineArea';
export { GaugeChart, isGaugeEmpty } from './GaugeChart';
