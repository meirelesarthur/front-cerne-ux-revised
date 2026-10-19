// src/components/charts/LineChart.tsx
// Adaptação Chakra v3 (`@chakra-ui/charts` + `recharts`) de
// `GB.Cerne.UX/src/components/ui/LineChart.tsx@8663490` (execução 046,
// TASK-DASH-FE-03). Assinatura preservada (contrato visual), implementação
// TROCADA: o UX desenha SVG à mão; aqui é `useChart` + `Chart.Root` sobre
// Recharts (`get_pwa_ui_components_pattern §29` — ApexCharts é PROIBIDO,
// tooltip customizado é PROIBIDO, dado direto ao Recharts é PROIBIDO).

import { Chart, useChart } from '@chakra-ui/charts';
import { Box } from '@chakra-ui/react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart as RechartsLineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { getChartSeriesColor } from '@/constants/dashboards/chart-series-palette';

export interface LineSeries {
  name: string;
  data: number[];
  color?: string;
}

interface LineChartRow {
  label: string;
  [seriesName: string]: string | number;
}

interface LineChartProps {
  series: LineSeries[];
  labels: string[];
  height?: number;
  yFormat?: (value: number) => string;
  /**
   * Formata o valor exibido no tooltip do ponto (fix wave F-211, item G) —
   * independente de `yFormat` (que abrevia K/M só no eixo). Default: número
   * pt-BR com 2 casas decimais (nunca o valor cru do Recharts).
   */
  tooltipFormat?: (value: number) => string;
  showGrid?: boolean;
  showLegend?: boolean;
  area?: boolean;
}

const defaultTooltipFormat = (value: number): string =>
  value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function LineChart({
  series,
  labels,
  height = 220,
  yFormat,
  tooltipFormat = defaultTooltipFormat,
  showGrid = true,
  showLegend,
  area = false,
}: LineChartProps) {
  const data: LineChartRow[] = labels.map((label, index) => {
    const row: LineChartRow = { label };
    series.forEach((serie) => {
      row[serie.name] = serie.data[index] ?? 0;
    });
    return row;
  });

  const chart = useChart<LineChartRow>({
    data,
    series: series.map((serie, index) => ({
      name: serie.name,
      color: serie.color ?? getChartSeriesColor(index),
    })),
  });

  const showLegendFinal = showLegend ?? series.length > 1;
  const isEmpty = series.length === 0 || labels.length === 0;

  if (isEmpty) {
    return <Box height={`${height}px`} width="full" />;
  }

  const ChartComponent = area ? AreaChart : RechartsLineChart;

  return (
    <Chart.Root height={`${height}px`} chart={chart}>
      <ResponsiveContainer width="100%" height="100%">
        <ChartComponent data={chart.data}>
          {showGrid && <CartesianGrid stroke="var(--chakra-colors-chart-grid)" vertical={false} />}
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
          {showLegendFinal && <Legend content={<Chart.Legend />} />}
          {chart.series.map((item) =>
            area ? (
              <Area
                key={item.name}
                type="monotone"
                dataKey={chart.key(item.name)}
                stroke={chart.color(item.color)}
                fill={chart.color(item.color)}
                fillOpacity={0.16}
                strokeWidth={2}
                isAnimationActive={false}
              />
            ) : (
              <Line
                key={item.name}
                type="monotone"
                dataKey={chart.key(item.name)}
                stroke={chart.color(item.color)}
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
            )
          )}
        </ChartComponent>
      </ResponsiveContainer>
    </Chart.Root>
  );
}
