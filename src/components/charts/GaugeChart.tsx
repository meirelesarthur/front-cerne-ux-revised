// src/components/charts/GaugeChart.tsx
// Gauge de arco (execução 048, TASK-04-FE — gap de kit do ROTEIRO §2) —
// adaptação Chakra v3 (`@chakra-ui/charts` + `recharts`) do `ArcGauge`
// (`GB.Cerne.UX/src/pages/dashboards/DashFinanceiro.tsx@8663490`), NÃO uma
// cópia do componente cru: implementado como semicírculo de `Pie`
// (`startAngle=180`/`endAngle=0`, mesma técnica de arco de
// `recharts`), reaproveitando `Chart.RadialText` do `DonutChart.tsx` para o
// valor central — `ResponsiveContainer` + `isAnimationActive={false}`
// (padrão INVIOLÁVEL). Track (parte não preenchida) usa
// `var(--chakra-colors-chart-grid)`, mesmo token de `LineChart`/
// `StackedBarChart` — nunca hex fixo. Exportado no barrel compartilhado
// (`src/components/charts/index.ts`) — reutilizável por qualquer dashboard
// futuro, não é componente local do Financeiro.

import { Chart, useChart } from '@chakra-ui/charts';
import { Cell, Label, Pie, PieChart, ResponsiveContainer } from 'recharts';

import { getChartSeriesColor } from '@/constants/dashboards/chart-series-palette';

interface GaugeSlice {
  label: string;
  value: number;
  color?: string;
}

interface GaugeChartProps {
  /** Valor preenchido, 0..100. */
  value: number;
  height?: number;
  centerValue?: string;
  centerLabel?: string;
  /** Cor do arco preenchido — token semântico (`getChartSeriesColor` por default). */
  color?: string;
}

export function GaugeChart({
  value,
  height = 180,
  centerValue,
  centerLabel,
  color,
}: GaugeChartProps) {
  const clamped = Math.max(0, Math.min(100, value));
  const filledColor = color ?? getChartSeriesColor(0);

  const data: GaugeSlice[] = [
    { label: 'filled', value: clamped, color: filledColor },
    { label: 'remainder', value: 100 - clamped, color: 'var(--chakra-colors-chart-grid)' },
  ];

  const chart = useChart<GaugeSlice>({ data });

  return (
    <Chart.Root height={`${height}px`} chart={chart}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chart.data}
            dataKey={chart.key('value')}
            nameKey={chart.key('label')}
            startAngle={180}
            endAngle={0}
            innerRadius="70%"
            outerRadius="100%"
            paddingAngle={0}
            strokeWidth={0}
            isAnimationActive={false}
          >
            {(centerValue || centerLabel) && (
              // eslint-disable-next-line react/no-unstable-nested-components -- Recharts exige `content` como render-prop
              <Label
                content={({ viewBox }) => (
                  <Chart.RadialText
                    viewBox={viewBox}
                    title={centerValue ?? ''}
                    description={centerLabel ?? ''}
                  />
                )}
              />
            )}
            {chart.data.map((slice) => (
              <Cell key={slice.label} fill={chart.color(slice.color)} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    </Chart.Root>
  );
}

/**
 * Vazio (sem `value` real do backend) — o CALLER decide o que renderizar
 * no lugar (`DashboardStateMessage`/omitir o bloco); diferente de
 * `DonutChart`/`LineChart`, um gauge em 0% ainda é um arco válido
 * @param {number | null | undefined} value - Valor do gauge, 0..100, ou ausente quando o backend não tem a métrica.
 * @return {boolean} `true` quando não há valor real para desenhar o arco.
 * (100% `track`), então não há um "branch vazio" próprio aqui.
 */
export function isGaugeEmpty(value: number | null | undefined): boolean {
  return value === null || value === undefined || Number.isNaN(value);
}
