// src/pages/Dashboards/UserAnalysis/blocks/ModulosAcessados.tsx
// Bloco "Módulos mais acessados" (`UA-CHART-02`, execução 046, TASK-UA-FE-06)
// — DonutChart (showLegend=false) + legenda custom (cor·label·%·n), mirror do
// desenho `DashUsuarios.tsx`. Badge de proxy dirigido por `meta.proxies[]`
// (`MUD-046-04`) — nunca hardcoded.

import { Flex, Text } from '@chakra-ui/react';

import { DonutChart } from '@/components/charts';
import { DashboardCard, ProxyBadge } from '@/components/Dashboard';

import { useLanguage } from '@/hooks/useLanguage';

import { getChartSeriesColor } from '@/constants/dashboards/chart-series-palette';

import type { DashboardMeta } from '@/@types/v2/Dashboards/dashboard-meta';
import type { UserAnalysisModuleSlice } from '@/@types/v2/Dashboards/userAnalysis';

interface ModulosAcessadosProps {
  data: UserAnalysisModuleSlice[];
  meta?: DashboardMeta;
}

const BLOCK_ID = 'chart_modules';

/**
 * Token semântico (`chart.series.N`) → var CSS Chakra, mesma técnica de `CartesianGrid`.
 * @param {string} token - Caminho do token semântico (ex.: `chart.series.0`).
 * @return {string} Expressão `var(--chakra-colors-...)` pronta para uso em `background`.
 */
function tokenToCssVar(token: string): string {
  return `var(--chakra-colors-${token.replace(/\./g, '-')})`;
}

export function ModulosAcessados({ data, meta }: ModulosAcessadosProps) {
  const { languageGB } = useLanguage();
  const text = languageGB.dashboards.userAnalysis.charts;
  const proxy = meta?.proxies?.find((item) => item.block_id === BLOCK_ID);

  const slices = data.map((module) => ({ label: module.label, value: module.value }));

  return (
    <DashboardCard
      flex={1}
      title={text.modulesAccessedTitle}
      action={proxy ? <ProxyBadge rule={proxy.rule} /> : undefined}
    >
      <DonutChart data={slices} height={180} showLegend={false} />
      <Flex direction="column" gap="1" marginTop="3">
        {data.map((module, index) => (
          <Flex key={module.label} align="center" gap="2">
            <Flex
              boxSize="8px"
              borderRadius="full"
              background={tokenToCssVar(getChartSeriesColor(index))}
              flexShrink={0}
            />
            <Text fontSize="xs" color="cardTextSecondary" flex="1" truncate>
              {module.label}
            </Text>
            <Text fontSize="xs" color="cardTextPrimary" fontWeight="medium">
              {module.percentage.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}%
            </Text>
            <Text fontSize="xs" color="cardTextSecondary">
              ({module.value})
            </Text>
          </Flex>
        ))}
      </Flex>
    </DashboardCard>
  );
}
