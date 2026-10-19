// src/pages/Dashboards/AssetsDashboard/blocks/StatusDosAtivos.tsx
// Bloco "Status dos ativos" (`AT-STATUS-01`, execução 046, TASK-AT-FE-07) —
// `StatusCards` (composição local: linha label·%·contagem + barra de
// progresso), 3 baldes fixos (`MUD-046-02`, nunca um 4º). Respeita
// `prefers-reduced-motion` (a barra nasce no valor final, sem animação).

import { Flex, Progress, Text, useMediaQuery } from '@chakra-ui/react';

import { DashboardCard } from '@/components/Dashboard';

import { assetsStatusColor } from '@/constants/dashboards/assetsDashboard/assets-status';

import type { AssetsStatusSlice } from '@/@types/v2/Dashboards/assetsDashboard';

interface StatusDosAtivosProps {
  data: AssetsStatusSlice[];
}

export function StatusDosAtivos({ data }: StatusDosAtivosProps) {
  const [prefersReducedMotion] = useMediaQuery(['(prefers-reduced-motion: reduce)']);

  return (
    <DashboardCard flex={2}>
      <Flex direction="column" gap="4">
        {data.map((slice) => (
          <Flex key={slice.status} direction="column" gap="1">
            <Flex justify="space-between" align="baseline">
              <Text fontSize="sm" color="cardTextPrimary" fontWeight="medium">
                {slice.label}
              </Text>
              <Text fontSize="xs" color="cardTextSecondary">
                {slice.percentage.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}% (
                {slice.count})
              </Text>
            </Flex>
            {/* @ts-ignore - Chakra UI v3 compound type issue, mesmo padrão de src/components/Form/Select.tsx */}
            <Progress.Root
              value={slice.percentage}
              max={100}
              colorPalette={assetsStatusColor[slice.status]}
              size="sm"
              borderRadius="full"
            >
              {/* @ts-ignore - Chakra UI v3 compound type issue */}
              <Progress.Track borderRadius="full">
                {/* @ts-ignore - Chakra UI v3 compound type issue */}
                <Progress.Range style={{ transition: prefersReducedMotion ? 'none' : undefined }} />
              </Progress.Track>
            </Progress.Root>
          </Flex>
        ))}
      </Flex>
    </DashboardCard>
  );
}
