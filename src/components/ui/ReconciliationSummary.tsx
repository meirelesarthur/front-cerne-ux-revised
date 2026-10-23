// src/components/ui/ReconciliationSummary.tsx
// Faixa de resumo da conciliação: indicadores em R$ (com dica) + anel de progresso.
// Genérico: quem usa passa os indicadores já formatados (i18n/moeda ficam fora).

import { Box, Flex, Text } from '@chakra-ui/react';

import { ProgressRing } from './ProgressRing';

export type SummaryTone = 'default' | 'in' | 'out';

export interface SummaryStat {
  label: string;
  value: string;
  hint?: string;
  tone?: SummaryTone;
}

export interface ReconciliationSummaryProps {
  stats: SummaryStat[];
  progress: { value: number; title: string; subtitle?: string };
}

const toneColor: Record<SummaryTone, string> = {
  default: 'fg.default',
  in: 'green.700',
  out: 'red.700',
};

export function ReconciliationSummary({ stats, progress }: ReconciliationSummaryProps) {
  return (
    <Flex gap={3} px={5} pb={3} align="stretch" wrap="wrap">
      {stats.map((stat) => (
        <Box key={stat.label} flex="1" minW="150px" bg="bg.muted" borderRadius="lg" px={4} py="10px">
          <Text fontSize="sm" color="fg.muted">
            {stat.label}
          </Text>
          <Text fontSize="lg" fontWeight="semibold" color={toneColor[stat.tone ?? 'default']} lineHeight="1.35" mt="2px">
            {stat.value}
          </Text>
          {stat.hint && (
            <Text fontSize="sm" color="fg.muted" mt="2px">
              {stat.hint}
            </Text>
          )}
        </Box>
      ))}
      <Flex flex="1" minW="190px" bg="bg.muted" borderRadius="lg" px={4} py="10px" align="center" gap={3}>
        <ProgressRing value={progress.value} label={progress.title} />
        <Box>
          <Text fontSize="md" fontWeight="semibold" lineHeight="1.35">
            {progress.title}
          </Text>
          {progress.subtitle && (
            <Text fontSize="sm" color="fg.muted">
              {progress.subtitle}
            </Text>
          )}
        </Box>
      </Flex>
    </Flex>
  );
}

export default ReconciliationSummary;
