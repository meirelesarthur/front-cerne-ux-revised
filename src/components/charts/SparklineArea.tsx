// src/components/charts/SparklineArea.tsx
// Adaptação Chakra v3 (`@chakra-ui/charts` + `recharts`) de
// `GB.Cerne.UX/src/components/ui/SparklineArea.tsx@8663490` (execução 046,
// TASK-DASH-FE-03). Ver nota de cabeçalho em `LineChart.tsx`. Micro-gráfico
// decorativo (base do `DashboardKpiCard`) — sem eixo/grade/tooltip/legenda.

import { Chart, useChart } from '@chakra-ui/charts';
import { Area, AreaChart, ResponsiveContainer } from 'recharts';

interface SparklineAreaProps {
  data: number[];
  color?: string;
  height?: number;
  filled?: boolean;
}

interface SparklineRow {
  index: number;
  value: number;
}

export function SparklineArea({ data, color, height = 60, filled = true }: SparklineAreaProps) {
  const rows: SparklineRow[] = data.map((value, index) => ({ index, value }));

  const chart = useChart<SparklineRow>({
    data: rows,
    series: [{ name: 'value', color: color ?? 'chart.series.0' }],
  });

  if (!data || data.length < 2) return null;

  const seriesColor = chart.color(chart.series[0]?.color);

  return (
    <Chart.Root height={`${height}px`} chart={chart}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chart.data}>
          <Area
            type="monotone"
            dataKey={chart.key('value')}
            stroke={seriesColor}
            fill={filled ? seriesColor : 'none'}
            fillOpacity={filled ? 0.18 : 0}
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </Chart.Root>
  );
}
