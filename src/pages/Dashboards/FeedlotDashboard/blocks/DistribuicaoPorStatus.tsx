// src/pages/Dashboards/FeedlotDashboard/blocks/DistribuicaoPorStatus.tsx
// Bloco "Distribuição por status" (`LC-CHART-01`, execução 046, TASK-LC-FE-06)
// — DonutChart com os 7 status reais do enum (`VA/VS/OC/MA/LI/EN/FE`), REUSO
// obrigatório de `feedlotCorralStatusColor` do fork (nunca hex novo).

import { DonutChart } from '@/components/charts';
import { DashboardCard } from '@/components/Dashboard';

import { useLanguage } from '@/hooks/useLanguage';

import { feedlotCorralStatusColor } from '@/constants/FeedlotCorrals/feedlot-corral-status-color';

import type { FeedlotStatusSlice } from '@/@types/v2/Dashboards/feedlotDashboard';

interface DistribuicaoPorStatusProps {
  data: FeedlotStatusSlice[];
}

export function DistribuicaoPorStatus({ data }: DistribuicaoPorStatusProps) {
  const { languageGB } = useLanguage();
  const text = languageGB.dashboards.feedlotDashboard.charts;

  const total = data.reduce((sum, slice) => sum + slice.count, 0);
  const slices = data.map((slice) => ({
    label: slice.label,
    value: slice.count,
    color: feedlotCorralStatusColor[slice.status],
  }));

  return (
    <DashboardCard title={text.statusDistributionTitle}>
      <DonutChart
        data={slices}
        height={220}
        centerValue={String(total)}
        centerLabel={text.statusDistributionCenterLabel}
        showLegend
      />
    </DashboardCard>
  );
}
