// src/components/ui/ConfidenceMeter.tsx
// Medidor de confiança (0–100) por FAIXA: alta ≥90 (verde), média 60–89 (âmbar), baixa <60
// (cinza). Mostra o percentual, uma barra e o nome da faixa — a cor nunca é a única pista.

import { Box, Text } from '@chakra-ui/react';

export type ConfidenceBand = 'high' | 'medium' | 'low';

export const HIGH_CONFIDENCE = 90;
export const MEDIUM_CONFIDENCE = 60;

export const bandOf = (score: number): ConfidenceBand =>
  score >= HIGH_CONFIDENCE ? 'high' : score >= MEDIUM_CONFIDENCE ? 'medium' : 'low';

const bandStyle: Record<ConfidenceBand, { color: string; bar: string }> = {
  high: { color: 'feedBack.successMain', bar: 'green.600' },
  medium: { color: 'feedBack.warnMain', bar: 'yellow.500' },
  low: { color: 'semanticNeutral.500', bar: 'semanticNeutral.400' },
};

export interface ConfidenceMeterProps {
  score: number;
  /** Nome de cada faixa, já traduzido. */
  labels: Record<ConfidenceBand, string>;
}

export function ConfidenceMeter({ score, labels }: ConfidenceMeterProps) {
  const pct = Math.max(0, Math.min(100, Math.round(score)));
  const band = bandOf(pct);
  const style = bandStyle[band];
  return (
    <Box minW="78px" textAlign="right" aria-label={`${labels[band]}: ${pct}%`}>
      <Text fontSize="md" fontWeight="semibold" color={style.color} lineHeight="1.2">
        {pct}%
      </Text>
      <Box h="5px" borderRadius="full" bg="semanticNeutral.200" mt="4px" overflow="hidden">
        <Box h="100%" width={`${pct}%`} bg={style.bar} borderRadius="full" />
      </Box>
      <Text fontSize="sm" color="fg.muted" mt="2px">
        {labels[band]}
      </Text>
    </Box>
  );
}

export default ConfidenceMeter;
