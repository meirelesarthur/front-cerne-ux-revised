// src/pages/Dashboards/RainfallDashboard/blocks/VolumeChart.tsx
// Bloco "Volume pluviométrico acumulado (mm)" — `LineChart` em área,
// mirror `VolumeAreaChart` da Referência UX.
//
// **CORREÇÃO PÓS-E2E (048):** campo real é `historical.accumulated_by_period[]`
// (`{period:"YYYY-MM", amount}`) — o tipo antigo (`volume_by_month`,
// `{month,total}`) nunca existiu no backend; `row.month`/`row.total`
// liam `undefined`, quebrando o gráfico. `period` já vem no formato
// `"YYYY-MM"` — `formatDate` recebe direto, sem concatenar `-01` duas vezes.

import { LineChart } from '@/components/charts';
import { DashboardCard } from '@/components/Dashboard';

import { useLanguage } from '@/hooks/useLanguage';

import formatDate from '@/utils/formatDate';

import type { RainfallAccumulatedPeriodRow } from '@/@types/v2/Dashboards/rainfallDashboard';

interface VolumeChartProps {
  data: RainfallAccumulatedPeriodRow[];
}

export function VolumeChart({ data }: VolumeChartProps) {
  const { languageGB } = useLanguage();
  const text = languageGB.dashboards.rainfallDashboard.charts;

  const labels = data.map((row) => formatDate(`${row.period}-01`, 'MM/yyyy'));
  const series = [{ name: text.volumeSeries, data: data.map((row) => row.amount) }];

  return (
    <DashboardCard title={text.volumeTitle}>
      <LineChart
        series={series}
        labels={labels}
        height={220}
        area
        showLegend={false}
        yFormat={(value) => `${value}mm`}
      />
    </DashboardCard>
  );
}
