// src/pages/Dashboards/OverviewPanel/blocks/FluxoCaixaProjetado.tsx
// Bloco #6 — Fluxo de caixa projetado (F-211, execução 062, Fase B). Mirror
// `FluxoDeCaixa.tsx` (`CashbookDashboard`) — `LineChart` `area`, 2 séries
// (líquido do mês / acumulado). Fonte: `financial-summary.cashflow_projection`
// (12 meses futuros a partir do mês corrente), recortado pelo filtro
// "Período" do cabeçalho (primeiros 3/6/10 dos 12 pontos já trazidos).
//
// Nome de rota `cashflow` NÃO é reusado (colisão com F-107 "Fluxo Bancário")
// — dado vem do MESMO endpoint `financial-summary`, sub-recorte próprio
// (contrato de API §1.1/§2.2).
//
// Fix wave F-211 (execução 062): item F — eixo X formatado `Mmm/AAAA`
// (`formatMonthLabel`); item G — tooltip do gráfico com `formatCurrencyBRL`;
// item H — loading (skeleton, refetch de período) + empty (`commonText.
// noData`) quando a série vier vazia, mirror `CoberturaEstoque`/
// `ResultadoPorProduto`; item C — ícone de info com o texto de origem do
// bloco (auditoria, Bloco #6).

import { Icon, Skeleton, Text, VStack } from '@chakra-ui/react';
import { FiTrendingUp } from 'react-icons/fi';

import { LineChart } from '@/components/charts';
import { DashboardCard, CardInfoTooltip } from '@/components/Dashboard';

import { useLanguage } from '@/hooks/useLanguage';

import formatCurrencyBRL from '@/utils/formatCurrencyBRL';
import formatMonthLabel from '@/utils/formatMonthLabel';

import type { OverviewPanelCashflowProjectionMonth } from '@/@types/v2/Dashboards/overviewPanel';

interface FluxoCaixaProjetadoProps {
  data: OverviewPanelCashflowProjectionMonth[];
  /** Refetch em background (troca de "Período" sobre cache já visitado) — mirror padrão V3 `Skeleton loading`. */
  isLoading?: boolean;
}

export function FluxoCaixaProjetado({ data, isLoading = false }: FluxoCaixaProjetadoProps) {
  const { languageGB } = useLanguage();
  const text = languageGB.dashboards.overviewPanel.cashflow;
  const commonText = languageGB.dashboards.common;

  const isEmpty = data.length === 0;

  const labels = data.map((point) => formatMonthLabel(point.month));
  const series = [
    { name: text.net, data: data.map((point) => point.projected_net) },
    { name: text.accumulated, data: data.map((point) => point.accumulated) },
  ];

  return (
    <DashboardCard
      flex={1}
      minWidth={280}
      title={text.title}
      action={<CardInfoTooltip content={text.tooltip} />}
    >
      <Skeleton loading={isLoading}>
        {isEmpty ? (
          <VStack align="center" justify="center" height="220px" gap="2" textAlign="center">
            <Icon as={FiTrendingUp} boxSize={6} color="fg.muted" />
            <Text fontSize="sm" color="cardTextSecondary">
              {commonText.noData}
            </Text>
          </VStack>
        ) : (
          <LineChart
            series={series}
            labels={labels}
            height={220}
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
