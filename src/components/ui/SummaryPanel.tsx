// src/components/ui/SummaryPanel.tsx
// Painel de RESUMO escuro, fixo à direita de um configurador (modelo "simulador"): título com
// ícone, grupos recolhíveis (`SummaryGroup`) com linhas rótulo/valor (`SummaryRow`), total em
// destaque (`SummaryTotal`) e ações. As cores são fixas (verde-floresta escuro) de propósito:
// o painel é um bloco de contraste em qualquer tema — como o resumo do configurador da Eveo.

import type { ReactNode } from 'react';

import { Box, Flex, Text } from '@chakra-ui/react';

import { Icon, type IconName } from './Icon';

const SURFACE = '#0b2519';
const BORDER = 'rgba(255,255,255,0.10)';
const MUTED = '#9fc2b0';

export interface SummaryPanelProps {
  title: string;
  icon?: IconName;
  children: ReactNode;
}

export function SummaryPanel({ title, icon = 'receipt', children }: SummaryPanelProps) {
  return (
    <Flex
      as="aside"
      aria-label={title}
      direction="column"
      gap="12px"
      p={5}
      bg={SURFACE}
      color="#e2f0e8"
      borderLeftWidth="3px"
      borderLeftColor="#10b981"
      minW={0}
      position={{ lg: 'sticky' }}
      top={{ lg: 0 }}
      alignSelf="stretch"
    >
      <Flex align="center" gap="12px" pb="4px">
        <Flex align="center" justify="center" boxSize="38px" borderRadius="lg" bg="rgba(255,255,255,0.08)" borderWidth="1px" borderColor={BORDER} color="#6ee7b7">
          <Icon name={icon} size={18} />
        </Flex>
        <Text fontSize="md" fontWeight="semibold" color="white">
          {title}
        </Text>
      </Flex>
      {children}
    </Flex>
  );
}

export interface SummaryGroupProps {
  title: string;
  defaultOpen?: boolean;
  children: ReactNode;
}

/** Grupo recolhível (`<details>` nativo: teclado e leitor de tela de graça). */
export function SummaryGroup({ title, defaultOpen = true, children }: SummaryGroupProps) {
  return (
    <Box as="details" {...({ open: defaultOpen } as Record<string, boolean>)} bg="rgba(255,255,255,0.05)" borderWidth="1px" borderColor={BORDER} borderRadius="xl" overflow="hidden">
      <Box
        as="summary"
        cursor="pointer"
        px="14px"
        py="11px"
        fontSize="base"
        fontWeight="semibold"
        color="white"
        css={{ listStyle: 'none', '&::-webkit-details-marker': { display: 'none' } }}
      >
        {title}
      </Box>
      <Flex direction="column" gap="7px" px="14px" pb="12px" fontSize="base">
        {children}
      </Flex>
    </Box>
  );
}

export type SummaryTone = 'default' | 'included' | 'added';

const toneColor: Record<SummaryTone, string> = { default: 'white', included: '#4ade80', added: '#f0abcf' };

export function SummaryRow({ label, value, tone = 'default' }: { label: string; value: string; tone?: SummaryTone }) {
  return (
    <Flex justify="space-between" align="baseline" gap="12px">
      <Text as="span" color={MUTED}>
        {label}
      </Text>
      <Text as="span" fontWeight="semibold" textAlign="right" style={{ color: toneColor[tone] }}>
        {value}
      </Text>
    </Flex>
  );
}

export function SummaryNote({ children }: { children: ReactNode }) {
  return (
    <Text fontSize="sm" color="#7da893" lineHeight="1.45">
      {children}
    </Text>
  );
}

export function SummaryTotal({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <Flex direction="column" gap="3px" pt="14px" borderTopWidth="1px" borderTopColor="rgba(255,255,255,0.12)">
      <Text fontSize="sm" color="#7da893">
        {label}
      </Text>
      <Text fontSize="38px" fontWeight="bold" lineHeight="1.05" letterSpacing="-0.02em" color="white">
        {value}
      </Text>
      {hint && (
        <Text fontSize="base" color={MUTED}>
          {hint}
        </Text>
      )}
    </Flex>
  );
}

export default SummaryPanel;
