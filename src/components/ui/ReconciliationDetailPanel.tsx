// src/components/ui/ReconciliationDetailPanel.tsx
// Painel de detalhe da transação selecionada (lado direito do workspace): cabeçalho com
// descrição, data/tipo e valor; bloco de situação (tom + título + texto) e ações. Sem
// modal — a decisão acontece ao lado da lista. As ações vêm por `children`.

import type { ReactNode } from 'react';

import { Box, Flex, Text } from '@chakra-ui/react';

import { Icon, type IconName } from './Icon';

export type DetailTone = 'info' | 'neutral' | 'success';

const toneStyle: Record<DetailTone, { bg: string; color: string; icon: IconName }> = {
  info: { bg: 'feedBack.info', color: 'feedBack.infoMain', icon: 'info' },
  neutral: { bg: 'semanticNeutral.100', color: 'semanticNeutral.600', icon: 'help' },
  success: { bg: 'feedBack.success', color: 'feedBack.successMain', icon: 'check-circle' },
};

export interface ReconciliationDetailPanelProps {
  title: string;
  /** Linha de apoio (ex.: "01/10/2026 · Entrada · Banco do Brasil"). */
  meta: string;
  /** Valor formatado com sinal. */
  amount: string;
  direction: 'in' | 'out';
  /** Situação atual da transação. */
  status: { tone: DetailTone; title: string; body: string };
  /** Selos (ex.: classificação). */
  badges?: ReactNode;
  /** Conteúdo abaixo da situação (ex.: seletor de modo + formulário inline). Largura total. */
  children?: ReactNode;
  /** Ações (botões) no rodapé do painel. */
  actions?: ReactNode;
}

export function ReconciliationDetailPanel({
  title,
  meta,
  amount,
  direction,
  status,
  badges,
  children,
  actions,
}: ReconciliationDetailPanelProps) {
  const tone = toneStyle[status.tone];
  return (
    <Box px={6} py={5}>
      <Flex justify="space-between" align="flex-start" gap={4} mb={4}>
        <Box minW={0}>
          <Text fontSize="lg" fontWeight="semibold" lineHeight="1.35">
            {title}
          </Text>
          <Text fontSize="base" color="fg.muted" mt="2px">
            {meta}
          </Text>
          {badges && <Flex gap="8px" mt="8px">{badges}</Flex>}
        </Box>
        <Text
          fontSize="26px"
          fontWeight="bold"
          letterSpacing="-0.4px"
          whiteSpace="nowrap"
          color={direction === 'in' ? 'feedBack.successMain' : 'feedBack.errorMain'}
        >
          {amount}
        </Text>
      </Flex>

      <Flex gap="12px" align="flex-start" bg={tone.bg} borderRadius="lg" px={4} py={3} mb={5}>
        <Box color={tone.color} mt="2px">
          <Icon name={tone.icon} size={17} />
        </Box>
        <Box>
          <Text fontWeight="semibold" color="fg.default">
            {status.title}
          </Text>
          <Text fontSize="base" color="fg.muted" mt="2px">
            {status.body}
          </Text>
        </Box>
      </Flex>

      {children}

      {actions && (
        <Flex gap="8px" wrap="wrap" justify="flex-end" borderTopWidth="1px" borderColor="border.muted" pt={4}>
          {actions}
        </Flex>
      )}
    </Box>
  );
}

export default ReconciliationDetailPanel;
