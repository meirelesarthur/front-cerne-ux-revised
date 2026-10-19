// src/pages/Dashboards/Suprimentos/SupplyTopProvidersCard.tsx
// -----------------------------------------------------------------------------
// Fileira 3 — Top fornecedores (Tarefa 58, contrato de tela v2 §5.4/§6.1).
// Lista nome·valor·badge·barra — mirror visual de `StatusDosAtivos.tsx`/
// `SaldoPorConta.tsx` (`Progress.Root/Track/Range`, `prefers-reduced-motion`)
// — MAS importando `DashboardCard` da casca PRIVADA desta tela
// (`@/components/ui/DashboardGrid`, D-01 do PRD), NUNCA do barrel
// compartilhado `@/components/Dashboard` que aqueles 2 blocos usam (10
// dashboards, ~67 arquivos, proibido de tocar/importar aqui).
//
// `top_providers: []` é resultado válido (RF-08, "nenhuma cotação
// selecionada de compra finalizada no período") — mensagem DENTRO do card,
// NUNCA `EmptyState` de página. Barra de progresso proporcional ao MAIOR
// `total_value` da lista recebida — normalização VISUAL local (largura da
// barra), NÃO um agregado de negócio recalculado (RNF-06): `total_value`/
// `saving_percentage` exibidos vêm exatamente como o backend mandou.
// -----------------------------------------------------------------------------

import { Badge, Flex, Progress, Text, useMediaQuery } from '@chakra-ui/react';

import { DashboardCard } from '@/components/ui/DashboardGrid';

import { useLanguage } from '@/hooks/useLanguage';

import formatCurrencyBRL from '@/utils/formatCurrencyBRL';

import type { SupplyDashboardProvider } from '@/@types/v2/SupplyDashboard';

import classifyProviderBadge, { type ProviderBadgeLevel } from './classifyProviderBadge';

const BADGE_COLOR_PALETTE: Record<ProviderBadgeLevel, string> = {
  excellent: 'green',
  good: 'blue',
  regular: 'orange',
};

export interface SupplyTopProvidersCardProps {
  providers: SupplyDashboardProvider[];
}

export function SupplyTopProvidersCard({ providers }: SupplyTopProvidersCardProps) {
  const { languageGB } = useLanguage();
  const text = languageGB.supplyDashboard.providers;
  const [prefersReducedMotion] = useMediaQuery(['(prefers-reduced-motion: reduce)']);

  if (providers.length === 0) {
    return (
      <DashboardCard title={text.title}>
        <Text fontSize="sm" color="cardTextSecondary">
          {text.empty}
        </Text>
      </DashboardCard>
    );
  }

  const maxTotalValue = Math.max(...providers.map((provider) => provider.total_value));

  return (
    <DashboardCard title={text.title}>
      <Flex direction="column" gap="4">
        {providers.map((provider) => {
          const level = classifyProviderBadge(provider.saving_percentage);
          const pct = maxTotalValue > 0 ? (provider.total_value / maxTotalValue) * 100 : 0;

          return (
            <Flex key={provider.provider_uuid} direction="column" gap="1">
              <Flex justify="space-between" align="baseline" gap="2" wrap="wrap">
                <Text fontSize="sm" color="cardTextPrimary" fontWeight="medium">
                  {provider.name}
                </Text>
                <Flex align="center" gap="2">
                  <Text fontSize="sm" fontWeight="bold" color="cardTextPrimary">
                    {formatCurrencyBRL(provider.total_value)}
                  </Text>
                  <Badge
                    colorPalette={BADGE_COLOR_PALETTE[level]}
                    borderRadius="full"
                    fontWeight="medium"
                  >
                    {text.badge[level]}
                  </Badge>
                </Flex>
              </Flex>
              {/* @ts-ignore - Chakra UI v3 compound type issue, mesmo padrão de StatusDosAtivos.tsx */}
              <Progress.Root
                value={pct}
                max={100}
                colorPalette="green"
                size="sm"
                borderRadius="full"
              >
                {/* @ts-ignore - Chakra UI v3 compound type issue */}
                <Progress.Track borderRadius="full">
                  {/* @ts-ignore - Chakra UI v3 compound type issue */}
                  <Progress.Range
                    style={{ transition: prefersReducedMotion ? 'none' : undefined }}
                  />
                </Progress.Track>
              </Progress.Root>
            </Flex>
          );
        })}
      </Flex>
    </DashboardCard>
  );
}
