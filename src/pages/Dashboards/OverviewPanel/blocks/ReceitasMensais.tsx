// src/pages/Dashboards/OverviewPanel/blocks/ReceitasMensais.tsx
// Bloco #4 — Receitas mensais realizado×previsto + YoY (F-211, execução 062,
// Fase B). Mirror `FluxoDeCaixa.tsx` (`CashbookDashboard`) — `LineChart`
// `area` com 2 séries. Fonte: `financial-summary.monthly_revenue` (13 meses,
// 12 anteriores + corrente), recortado pelo filtro "Período" do cabeçalho
// (últimos 3/6/10 dos 13 pontos já trazidos — nenhuma nova chamada de rede).
//
// YoY: `financial-summary.year_over_year` compara o MESMO mês do ano anterior
// (1º ponto da série de 13 meses) com o mês corrente (último ponto) —
// percentual derivado dos 2 valores reais, exibido como badge no header do
// card (mirror do padrão "X% em 1 comprador" da Referência UX).
//
// Fix wave F-211 (execução 062): item F — eixo X formatado `Mmm/AAAA`
// (`formatMonthLabel`, chave crua `YYYY-MM` da API nunca mais chega ao
// usuário); item G — tooltip do gráfico com `formatCurrencyBRL` (antes valor
// cru do Recharts); item H — loading (skeleton, refetch de período) + empty
// (`commonText.noData`) quando a série vier vazia, mirror `CoberturaEstoque`/
// `ResultadoPorProduto`; item C — ícone de info com o texto de origem do
// bloco (auditoria `AUDITORIA-cards-kpis-F211.md`, Bloco #4).

import { Badge, Flex, Icon, Skeleton, Text, VStack } from '@chakra-ui/react';
import { FiBarChart2 } from 'react-icons/fi';

import { LineChart } from '@/components/charts';
import { DashboardCard, CardInfoTooltip } from '@/components/Dashboard';

import { useLanguage } from '@/hooks/useLanguage';

import formatCurrencyBRL from '@/utils/formatCurrencyBRL';
import formatMonthLabel from '@/utils/formatMonthLabel';

import type {
  OverviewPanelMonthlyRevenuePoint,
  OverviewPanelYearOverYear,
} from '@/@types/v2/Dashboards/overviewPanel';

interface ReceitasMensaisProps {
  data: OverviewPanelMonthlyRevenuePoint[];
  yearOverYear: OverviewPanelYearOverYear;
  /** Refetch em background (troca de "Período" sobre cache já visitado) — mirror padrão V3 `Skeleton loading`. */
  isLoading?: boolean;
}

function yoyPercent(yoy: OverviewPanelYearOverYear): number | null {
  const previous = yoy.previous_year?.realized_income;
  const current = yoy.current_year?.realized_income;
  if (!previous || current === undefined) return null;
  return ((current - previous) / previous) * 100;
}

export function ReceitasMensais({ data, yearOverYear, isLoading = false }: ReceitasMensaisProps) {
  const { languageGB } = useLanguage();
  const text = languageGB.dashboards.overviewPanel.revenues;
  const commonText = languageGB.dashboards.common;

  const isEmpty = data.length === 0;

  const labels = data.map((point) => formatMonthLabel(point.month));
  const series = [
    { name: text.realized, data: data.map((point) => point.realized_income) },
    { name: text.predicted, data: data.map((point) => point.predicted_income) },
  ];

  const yoy = yoyPercent(yearOverYear);

  return (
    <DashboardCard
      flex={2}
      title={text.title}
      action={
        <Flex align="center" gap="2">
          {yoy !== null && (
            <Badge colorPalette={yoy >= 0 ? 'green' : 'red'} borderRadius="full">
              {text.yoyLabel.replace(
                '{value}',
                yoy.toLocaleString('pt-BR', { maximumFractionDigits: 1, signDisplay: 'always' })
              )}
            </Badge>
          )}
          <CardInfoTooltip content={text.tooltip} />
        </Flex>
      }
    >
      <Skeleton loading={isLoading}>
        {isEmpty ? (
          <VStack align="center" justify="center" height="260px" gap="2" textAlign="center">
            <Icon as={FiBarChart2} boxSize={6} color="fg.muted" />
            <Text fontSize="sm" color="cardTextSecondary">
              {commonText.noData}
            </Text>
          </VStack>
        ) : (
          <LineChart
            series={series}
            labels={labels}
            height={260}
            area
            yFormat={(value) =>
              value >= 1_000_000
                ? `R$ ${(value / 1_000_000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}M`
                : `R$ ${(value / 1_000).toFixed(0)}K`
            }
            tooltipFormat={(value) => formatCurrencyBRL(value)}
          />
        )}
      </Skeleton>
    </DashboardCard>
  );
}
