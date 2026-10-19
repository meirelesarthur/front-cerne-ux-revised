// src/pages/Dashboards/RainfallDashboard/blocks/AcumuladoAreaChart.tsx
// Bloco "Acumulado por área" — série única (`GroupedBarChart` com 1 série
// vira barra simples, mirror `ManutencoesPorMes.tsx`) — não cria
// `BarChart.tsx` novo (ROTEIRO §2).
//
// **CORREÇÃO PÓS-E2E (048):** campo real é `row.amount` (não `row.total`,
// nome antigo especulativo).

import { GroupedBarChart } from '@/components/charts';
import { DashboardCard } from '@/components/Dashboard';

import { useLanguage } from '@/hooks/useLanguage';

import type { RainfallByAreaRow } from '@/@types/v2/Dashboards/rainfallDashboard';

interface AcumuladoAreaChartProps {
  data: RainfallByAreaRow[];
}

export function AcumuladoAreaChart({ data }: AcumuladoAreaChartProps) {
  const { languageGB } = useLanguage();
  const text = languageGB.dashboards.rainfallDashboard.charts;

  const labels = data.map((row) => row.label);
  const series = [{ name: text.byAreaSeries, data: data.map((row) => row.amount) }];

  return (
    <DashboardCard title={text.byAreaTitle}>
      <GroupedBarChart
        series={series}
        labels={labels}
        height={220}
        showLegend={false}
        yFormat={(value) => `${value}mm`}
      />
    </DashboardCard>
  );
}
