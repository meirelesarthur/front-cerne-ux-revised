// src/components/charts/DonutChart.tsx
// Adaptação Chakra v3 (`@chakra-ui/charts` + `recharts`) de
// `GB.Cerne.UX/src/components/ui/DonutChart.tsx@8663490` (execução 046,
// TASK-DASH-FE-03). Ver nota de cabeçalho em `LineChart.tsx`.
//
// **CORREÇÃO PÓS-HOMOLOGAÇÃO (048, 4ª rodada) — `key` React duplicada quando
// duas fatias/itens de legenda têm o MESMO `label` (reportado no Financeiro
// "Despesas por categoria": 2× "Pgto Adiant de Crédito de Produto", 2× "13º
// Salário").** `label` é texto livre vindo da API (categoria/família) e pode
// repetir — nunca é identidade estável. `key` das fatias (`Cell`) e dos itens
// de legenda agora usa o ÍNDICE do array (posição estável dentro do mesmo
// render), não mais o `label`.
//
// **CORREÇÃO PÓS-HOMOLOGAÇÃO (048, 3ª rodada) — legenda sobrepondo o donut/
// valor central (reportado no Financeiro "Despesas por categoria" e na
// Pecuária "Composição do rebanho"; componente COMPARTILHADO — afeta TODO
// donut com legenda: também Depreciações "Composição por tipo").** Causa-raiz:
// a 2ª rodada já corrigiu o BASELINE do `<text>` central (`dominantBaseline`),
// mas a LEGENDA continuava renderizada pelo `<Legend>` do recharts DENTRO do
// mesmo `Chart.Root`/`ResponsiveContainer` de altura FIXA do donut — com
// muitas categorias (catálogo real, DEC-101) os itens da legenda não cabem
// nessa caixa fixa e o recharts não dá scroll próprio a ela: os itens
// extras acabam desenhados por cima do anel/número central. Reescrito para:
// (1) o número/rótulo central agora é um overlay CSS puro (`Flex
// position="absolute" inset={0}`) sobre a `Box` do gráfico — centralização
// pixel-perfect por layout, não depende mais do `viewBox` que o `<Label>`
// do recharts entrega para o `<Pie>`; (2) a legenda sai do
// `Chart.Root`/SVG e passa a ser HTML normal (`Flex wrap`) ABAIXO do
// gráfico, em área própria com `maxHeight`+`overflowY="auto"` — estrutural-
// mente não pode mais se sobrepor ao donut, só cresce/rola na própria caixa.

import { Chart, useChart } from '@chakra-ui/charts';
import { Box, Flex, Text } from '@chakra-ui/react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

import { getChartSeriesColor } from '@/constants/dashboards/chart-series-palette';

export interface DonutSlice {
  label: string;
  value: number;
  color?: string;
}

interface DonutChartProps {
  data: DonutSlice[];
  height?: number;
  centerLabel?: string;
  centerValue?: string;
  showLegend?: boolean;
  valueFormat?: (value: number) => string;
}

export function DonutChart({
  data,
  height = 220,
  centerLabel,
  centerValue,
  showLegend = true,
  valueFormat = (value) => String(value),
}: DonutChartProps) {
  // `useChart<T>` exige `series[].name` como `keyof T` (chave de coluna), não
  // um valor de linha — não serve para "1 série por fatia" (Donut é `keyof T
  // = 'label'|'value'|'color'`, sem index signature, diferente dos gráficos
  // de série em `LineChart`/`StackedBarChart`/`GroupedBarChart`). Por isso a
  // cor resolvida vai DENTRO da própria linha (`color`): `chart.getSeries`
  // (usado por `Chart.Tooltip`) já lê `item.payload.color` como fallback
  // (`use-chart.js`), então o tooltip pega o swatch certo sem precisar de
  // `series[]` casada por nome.
  const resolvedData = data.map((slice, index) => ({
    ...slice,
    color: slice.color ?? getChartSeriesColor(index),
  }));

  const chart = useChart<DonutSlice>({ data: resolvedData });

  const isEmpty = data.length === 0 || data.every((slice) => !slice.value);
  if (isEmpty) {
    return <Box height={`${height}px`} width="full" />;
  }

  return (
    <Box width="full">
      <Chart.Root height={`${height}px`} chart={chart}>
        <Box position="relative" width="full" height="full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Tooltip
                cursor={false}
                content={
                  <Chart.Tooltip hideLabel formatter={(value) => valueFormat(Number(value))} />
                }
              />
              <Pie
                data={chart.data}
                dataKey={chart.key('value')}
                nameKey={chart.key('label')}
                innerRadius="65%"
                outerRadius="100%"
                paddingAngle={2}
                strokeWidth={0}
                isAnimationActive={false}
              >
                {chart.data.map((slice, index) => (
                  <Cell key={`${slice.label}-${index}`} fill={chart.color(slice.color)} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>

          {(centerLabel || centerValue) && (
            <Flex
              position="absolute"
              inset={0}
              align="center"
              justify="center"
              direction="column"
              gap="0.5"
              paddingX="6"
              textAlign="center"
              pointerEvents="none"
            >
              {centerValue && (
                <Text
                  fontSize="1.5rem"
                  fontWeight="600"
                  lineHeight="1.15"
                  color="cardTextPrimary"
                  overflow="hidden"
                  textOverflow="ellipsis"
                  whiteSpace="nowrap"
                  maxWidth="full"
                >
                  {centerValue}
                </Text>
              )}
              {centerLabel && (
                <Text fontSize="0.75rem" lineHeight="1.15" color="cardTextSecondary">
                  {centerLabel}
                </Text>
              )}
            </Flex>
          )}
        </Box>
      </Chart.Root>

      {showLegend && (
        <Flex wrap="wrap" gap="3" rowGap="1.5" marginTop="3" maxHeight="72px" overflowY="auto">
          {resolvedData.map((slice, index) => (
            <Flex
              key={`${slice.label}-${index}`}
              align="center"
              gap="1.5"
              minWidth={0}
              maxWidth="full"
            >
              <Box flexShrink={0} boxSize="8px" borderRadius="full" bg={slice.color} />
              <Text
                fontSize="xs"
                color="cardTextSecondary"
                maxWidth="140px"
                overflow="hidden"
                textOverflow="ellipsis"
                whiteSpace="nowrap"
                title={slice.label}
              >
                {slice.label}
              </Text>
            </Flex>
          ))}
        </Flex>
      )}
    </Box>
  );
}
