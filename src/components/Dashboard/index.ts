// src/components/Dashboard/index.ts
// Barrel export do kit de dashboard (execução 046, TASK-DASH-FE-02/06).

export {
  DashboardGrid,
  DashboardHeader,
  DashboardRow,
  DashboardCard,
  DashboardKpiCard,
  DashboardSkeleton,
} from './DashboardGrid';
export type { DashboardCardProps } from './DashboardGrid';
export { FocusableChartCard } from './FocusableChartCard';
export { ProxyBadge } from './ProxyBadge';
export { LacunaNote } from './LacunaNote';
export { CardInfoTooltip } from './CardInfoTooltip';
export { DashboardStateMessage } from './DashboardStateMessage';
export { FarmAreasMap } from './FarmAreasMap';
export type { FarmAreasMapArea, FarmAreasMapProps } from './FarmAreasMap';
