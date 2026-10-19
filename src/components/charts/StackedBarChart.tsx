// src/components/charts/StackedBarChart.tsx
// Adaptação Chakra v3 (`@chakra-ui/charts` + `recharts`) de
// `GB.Cerne.UX/src/components/ui/StackedBarChart.tsx@8663490` (execução 046,
// TASK-DASH-FE-03). Ver nota de cabeçalho em `LineChart.tsx`.

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

export interface StackSeries {
  name: string;
  data: number[];
  color?: string;
}

interface StackedBarChartRow {
  label: string;
  [seriesName: string]: string | number;
}

interface StackedBarChartProps {
  series: StackSeries[];
  labels: string[];
  height?: number;
  horizontal?: boolean;
  yFormat?: (value: number) => string;
  showLegend?: boolean;
}

export function StackedBarChart({
  series,
  labels,
  height = 220,
  horizontal = false,
  yFormat,
  showLegend = true,
}: StackedBarChartProps) {
  const data: StackedBarChartRow[] = labels.map((label, index) => {
    const row: StackedBarChartRow = { label };
    series.forEach((serie) => {
      row[serie.name] = serie.data[index] ?? 0;
    });
    return row;
  });

  const chart = useChart<StackedBarChartRow>({
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
        <BarChart data={chart.data} layout={horizontal ? 'vertical' : 'horizontal'}>
          <CartesianGrid
            stroke="var(--chakra-colors-chart-grid)"
            vertical={horizontal}
            horizontal={!horizontal}
          />
          {horizontal ? (
            <>
              <XAxis type="number" tickLine={false} axisLine={false} tickFormatter={yFormat} />
              <YAxis
                type="category"
                dataKey={chart.key('label')}
                tickLine={false}
                axisLine={false}
                width={96}
              />
            </>
          ) : (
            <>
              <XAxis
                type="category"
                dataKey={chart.key('label')}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                type="number"
                tickLine={false}
                axisLine={false}
                tickFormatter={yFormat}
                width={yFormat ? 56 : 32}
              />
            </>
          )}
          <Tooltip cursor={false} content={<Chart.Tooltip />} />
          {showLegend && <Legend content={<Chart.Legend />} />}
          {chart.series.map((item) => (
            <Bar
              key={item.name}
              dataKey={chart.key(item.name)}
              fill={chart.color(item.color)}
              stackId="stack"
              radius={[2, 2, 0, 0]}
              isAnimationActive={false}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </Chart.Root>
  );
}
