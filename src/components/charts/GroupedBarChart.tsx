// src/components/charts/GroupedBarChart.tsx
// Adaptação Chakra v3 (`@chakra-ui/charts` + `recharts`) de
// `GB.Cerne.UX/src/components/ui/GroupedBarChart.tsx@8663490` (execução 046,
// TASK-DASH-FE-03). Ver nota de cabeçalho em `LineChart.tsx`. Diferença para
// `StackedBarChart`: sem `stackId` — o Recharts agrupa barras lado a lado por
// categoria quando cada série é um `<Bar>` independente.

import { Chart, useChart } from '@chakra-ui/charts';
import { Box } from '@chakra-ui/react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { getChartSeriesColor } from '@/constants/dashboards/chart-series-palette';

export interface GroupedSeries {
  name: string;
  data: number[];
  color?: string;
}

interface GroupedBarChartRow {
  label: string;
  [seriesName: string]: string | number;
}

interface GroupedBarChartProps {
  series: GroupedSeries[];
  labels: string[];
  height?: number;
  yFormat?: (value: number) => string;
  /**
   * Formata o valor exibido no tooltip da barra (fix wave F-211, item G) —
   * independente de `yFormat` (eixo). Default: número pt-BR com 2 casas
   * decimais (nunca o valor cru do Recharts, ex. `290638.3`).
   */
  tooltipFormat?: (value: number) => string;
  showLegend?: boolean;
}

const defaultTooltipFormat = (value: number): string =>
  value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function GroupedBarChart({
  series,
  labels,
  height = 220,
  yFormat,
  tooltipFormat = defaultTooltipFormat,
  showLegend = true,
}: GroupedBarChartProps) {
  const data: GroupedBarChartRow[] = labels.map((label, index) => {
    const row: GroupedBarChartRow = { label };
    series.forEach((serie) => {
      row[serie.name] = serie.data[index] ?? 0;
    });
    return row;
  });

  const chart = useChart<GroupedBarChartRow>({
    data,
    series: series.map((serie, index) => ({
      name: serie.name,
      color: serie.color ?? getChartSeriesColor(index),
    })),
  });

  const isEmpty = series.length === 0 || labels.length === 0;
  if (isEmpty) {
    return <Box height={`${height}px`} width="full" />;
  }

  return (
    <Chart.Root height={`${height}px`} chart={chart}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chart.data}>
          <CartesianGrid stroke="var(--chakra-colors-chart-grid)" vertical={false} />
          <XAxis dataKey={chart.key('label')} tickLine={false} axisLine={false} />
          <YAxis
            tickLine={false}
            axisLine={false}
            tickFormatter={yFormat}
            width={yFormat ? 56 : 32}
          />
          <Tooltip
            cursor={false}
            content={<Chart.Tooltip formatter={(value) => tooltipFormat(Number(value))} />}
          />
          {showLegend && <Legend content={<Chart.Legend />} />}
          {chart.series.map((item) => (
            <Bar
              key={item.name}
              dataKey={chart.key(item.name)}
              fill={chart.color(item.color)}
              radius={[2, 2, 0, 0]}
              isAnimationActive={false}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </Chart.Root>
  );
}
