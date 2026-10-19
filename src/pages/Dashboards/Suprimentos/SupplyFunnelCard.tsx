// src/pages/Dashboards/Suprimentos/SupplyFunnelCard.tsx
// -----------------------------------------------------------------------------
// Fileira 2 — Funil de suprimentos (Tarefa 57, contrato de tela v2 §5.3/
// §6.3). `SankeyFunnel` (porta adaptada do `cerne`, `src/components/charts/
// SankeyFunnel.tsx`) + pílula de taxa final no slot `action` do
// `DashboardCard` + grade de metadados (Valor médio/Lead time/Prazo médio)
// por estágio, com `ProxyBadge` quando `stage.is_proxy`.
//
// Todo número exibido vem PRONTO do backend (RNF-06) — nenhum cálculo de
// conversão/duração/valor aqui, só formatação
// (`formatCurrencyBRL`/`formatDurationHoursCompact`). O "100%" do primeiro
// estágio é texto FIXO só porque `conversion_rate` do primeiro item já É
// sempre 100 (vem do backend) — nunca hardcode o valor em si, só o texto.
// -----------------------------------------------------------------------------

import { Badge, Flex, SimpleGrid, Text } from '@chakra-ui/react';

import { SankeyFunnel } from '@/components/charts/SankeyFunnel';
import { ProxyBadge } from '@/components/Dashboard/ProxyBadge';
import { DashboardCard } from '@/components/ui/DashboardGrid';

import { useLanguage } from '@/hooks/useLanguage';

import formatCurrencyBRL from '@/utils/formatCurrencyBRL';
import formatDurationHoursCompact from '@/utils/formatDurationHoursCompact';

import type { SupplyDashboardFunnel } from '@/@types/v2/SupplyDashboard';

function formatPercent(value: number): string {
  return `${value.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`;
}

export interface SupplyFunnelCardProps {
  funnel: SupplyDashboardFunnel;
}

export function SupplyFunnelCard({ funnel }: SupplyFunnelCardProps) {
  const { languageGB } = useLanguage();
  const text = languageGB.supplyDashboard.funnel;

  const sankeyStages = funnel.stages.map((stage, index) => ({
    label: stage.stage_label,
    value: stage.volume,
    sublabel:
      index === 0 ? '100%' : `${formatPercent(stage.conversion_rate)} ${text.conversionSuffix}`,
  }));

  return (
    <DashboardCard
      title={text.title}
      action={
        <Badge colorPalette="green" borderRadius="full" px={3} py={1} fontWeight="medium">
          {formatPercent(funnel.final_conversion_rate)} {text.finalConversionRate}
        </Badge>
      }
    >
      <SankeyFunnel
        stages={sankeyStages}
        chartHeight={160}
        hoverConversionLabel={text.conversionSuffix}
      />

      <SimpleGrid columns={funnel.stages.length || 1} gap={4} marginTop={4} paddingTop={3}>
        {funnel.stages.map((stage) => (
          <Flex key={stage.stage} direction="column" gap={1}>
            <Text fontSize="xs" color="cardTextSecondary">
              {text.averageValue}
            </Text>
            <Text fontSize="sm" fontWeight="semibold" color="cardTextPrimary">
              {formatCurrencyBRL(stage.average_value)}
            </Text>
            <Text fontSize="xs" color="cardTextSecondary" marginTop={1}>
              {text.leadTime}
            </Text>
            <Text fontSize="sm" fontWeight="semibold" color="cardTextPrimary">
              {formatDurationHoursCompact(stage.lead_time_hours)}
            </Text>
            <Text fontSize="xs" color="cardTextSecondary" marginTop={1}>
              {text.actualDuration}
            </Text>
            <Text fontSize="sm" fontWeight="semibold" color="cardTextPrimary">
              {formatDurationHoursCompact(stage.actual_duration_hours)}
            </Text>
            <Text fontSize="xs" color="cardTextSecondary" fontWeight="medium" marginTop={2}>
              {stage.stage_label}
            </Text>
            {stage.is_proxy && <ProxyBadge rule={stage.proxy_notes?.join(' ') ?? ''} />}
          </Flex>
        ))}
      </SimpleGrid>
    </DashboardCard>
  );
}
