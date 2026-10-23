// src/components/ui/RemainingBalance.tsx
// Indicador "ao vivo" de saldo de uma divisão (rateio): mostra quanto já foi distribuído do
// total e, em destaque, quanto FALTA (laranja) / PASSOU (vermelho) ou que FECHOU (verde).
// Genérico: quem usa passa valores e rótulos já traduzidos + o formatador de moeda.

import { Box, Flex, Text } from '@chakra-ui/react';

import { Icon } from './Icon';

export interface RemainingBalanceProps {
  /** Valor total a distribuir. */
  total: number;
  /** Soma já distribuída. */
  allocated: number;
  format: (value: number) => string;
  labels: { allocated: string; remaining: string; over: string; balanced: string };
}

export function RemainingBalance({ total, allocated, format, labels }: RemainingBalanceProps) {
  const diff = Math.round((total - allocated) * 100) / 100;
  const balanced = Math.abs(diff) < 0.01;
  const over = diff < 0;

  const tone = balanced
    ? { bg: 'feedBack.success', color: 'feedBack.successMain' }
    : over
      ? { bg: 'feedBack.error', color: 'feedBack.errorMain' }
      : { bg: 'feedBack.warn', color: 'feedBack.warnMain' };

  return (
    <Flex align="center" gap="10px" wrap="wrap" role="status" aria-live="polite">
      <Text fontSize="base" color="fg.muted">
        {labels.allocated}: <b>{format(allocated)}</b> / {format(total)}
      </Text>
      <Flex align="center" gap="4px" px="10px" py="3px" borderRadius="full" bg={tone.bg} color={tone.color} fontSize="sm" fontWeight="medium">
        <Box display="flex">
          <Icon name={balanced ? 'check-circle' : 'alert'} size={13} />
        </Box>
        {balanced ? labels.balanced : `${over ? labels.over : labels.remaining} ${format(Math.abs(diff))}`}
      </Flex>
    </Flex>
  );
}

export default RemainingBalance;
