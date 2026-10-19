// src/pages/Dashboards/OverviewPanel/blocks/AgingTitulos.tsx
// Bloco #9b — Aging de títulos (F-211, execução 062, Fase B). Adaptação de
// `AgingRows` (`OverviewPanel.tsx@ffe92bc L.979-1006`, barras horizontais por
// faixa) para o kit de gráficos já existente no fork — `GroupedBarChart`
// (2 séries, Receber/Pagar, por faixa de atraso). Fonte:
// `financial-summary.aging` (buckets fixos 0-30/31-60/61-90/90+, GAP-02
// default do contrato de API §2.2/§5).
//
// Fix wave F-211 (execução 062): item G — tooltip do gráfico com
// `formatCurrencyBRL` (achado da auditoria: valor cru do Recharts, ex.
// `290638.3`); item H — loading (skeleton, refetch de período) + empty
// (`commonText.noData`) quando os 4 buckets vierem zerados, mirror
// `CoberturaEstoque`/`ResultadoPorProduto`; item C — ícone de info com o
// texto de origem do bloco (auditoria, Bloco #9b).

import { Icon, Skeleton, Text, VStack } from '@chakra-ui/react';
import { FiClock } from 'react-icons/fi';

import { GroupedBarChart } from '@/components/charts';
import { DashboardCard, CardInfoTooltip } from '@/components/Dashboard';

import { useLanguage } from '@/hooks/useLanguage';

import formatCurrencyBRL from '@/utils/formatCurrencyBRL';

import type { OverviewPanelAgingBucket } from '@/@types/v2/Dashboards/overviewPanel';

interface AgingTitulosProps {
  data: OverviewPanelAgingBucket[];
  /** Refetch em background (troca de "Período" sobre cache já visitado) — mirror padrão V3 `Skeleton loading`. */
  isLoading?: boolean;
}

export function AgingTitulos({ data, isLoading = false }: AgingTitulosProps) {
  const { languageGB } = useLanguage();
  const text = languageGB.dashboards.overviewPanel.aging;
  const commonText = languageGB.dashboards.common;

  const isEmpty =
    data.length === 0 || data.every((bucket) => bucket.receivable === 0 && bucket.payable === 0);

  const labels = data.map((bucket) => `${bucket.bucket} ${text.daysUnit}`);
  const series = [
    { name: text.receivable, data: data.map((bucket) => bucket.receivable) },
    { name: text.payable, data: data.map((bucket) => bucket.payable) },
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
            <Icon as={FiClock} boxSize={6} color="fg.muted" />
            <Text fontSize="sm" color="cardTextSecondary">
              {commonText.noData}
            </Text>
          </VStack>
        ) : (
          <GroupedBarChart
            series={series}
            labels={labels}
            height={220}
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
