// src/pages/Dashboards/DepreciationDashboard/blocks/ProjecaoChart.tsx
// Bloco "Projeção — próximos 24 meses" — `LineChart` (saldo residual
// projetado, `forecast_24m[].sd_depreciate`, CV-006: piso zero). REUSO
// DIRETO de `CalculateDepreciationForecastAction` — front não recalcula.

import { LineChart } from '@/components/charts';
import { DashboardCard } from '@/components/Dashboard';

import { useLanguage } from '@/hooks/useLanguage';

import formatDate from '@/utils/formatDate';

import type { DepreciationForecastRow } from '@/@types/v2/BaseRegistrations/depreciationForecasts';

interface ProjecaoChartProps {
  data: DepreciationForecastRow[];
}

export function ProjecaoChart({ data }: ProjecaoChartProps) {
  const { languageGB } = useLanguage();
  const text = languageGB.dashboards.depreciationDashboard.charts;

  const labels = data.map((row) =>
    formatDate(`${row.year}-${String(row.month).padStart(2, '0')}-01`, 'MM/yyyy')
  );
  const series = [{ name: text.projectionSeries, data: data.map((row) => row.sd_depreciate) }];

  return (
    <DashboardCard flex={2} minWidth={340} title={text.projectionTitle}>
      <LineChart
        series={series}
        labels={labels}
        height={220}
        area
        showLegend={false}
        yFormat={(value) =>
          `${(value / 1_000_000).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}M`
        }
      />
    </DashboardCard>
  );
}
