// src/components/ui/SummaryPanel.tsx
// Painel de RESUMO escuro, fixo à direita de um configurador (modelo "simulador"): título com
// ícone, grupos recolhíveis (`SummaryGroup`) com linhas rótulo/valor (`SummaryRow`), total em
// destaque (`SummaryTotal`) e ações. As cores são fixas (verde-floresta escuro) de propósito:
// o painel é um bloco de contraste em qualquer tema — como o resumo do configurador da Eveo.

import type { ReactNode } from 'react';

import { Box, Flex, Text } from '@chakra-ui/react';

import { Icon, type IconName } from './Icon';

const BORDER = 'summaryLine';
const MUTED = 'summaryMuted';

/** Altura única do cabeçalho do configurador (faixa dos passos à esquerda e título do resumo à direita). */
export const CONFIGURATOR_HEADER_HEIGHT = '72px';

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
      bg="summaryBg"
      color="summaryText"
      borderLeftWidth="3px"
      borderLeftColor="summaryAccent"
      minW={0}
      position={{ lg: 'sticky' }}
      top={{ lg: 0 }}
      alignSelf="stretch"
    >
      <Flex align="center" gap="12px" h={CONFIGURATOR_HEADER_HEIGHT} px={5} flexShrink={0} borderBottomWidth="1px" borderBottomColor="summaryLine">
        <Flex align="center" justify="center" boxSize="38px" borderRadius="lg" bg="summaryFillMid" borderWidth="1px" borderColor={BORDER} color="summaryIcon">
          <Icon name={icon} size={18} />
        </Flex>
        <Text fontSize="md" fontWeight="semibold" color="white">
          {title}
        </Text>
      </Flex>
      <Flex direction="column" gap="12px" p={5}>
        {children}
      </Flex>
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
    <Box as="details" {...({ open: defaultOpen } as Record<string, boolean>)} bg="summaryFill" borderWidth="1px" borderColor={BORDER} borderRadius="xl" overflow="hidden">
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

const toneColor: Record<SummaryTone, string> = { default: 'white', included: 'summaryPositive', added: 'summaryAdded' };

export function SummaryRow({ label, value, tone = 'default' }: { label: string; value: string; tone?: SummaryTone }) {
  return (
    <Flex justify="space-between" align="baseline" gap="12px">
      <Text as="span" color={MUTED}>
        {label}
      </Text>
      <Text as="span" fontWeight="semibold" textAlign="right" color={toneColor[tone]}>
        {value}
      </Text>
    </Flex>
  );
}

export function SummaryNote({ children }: { children: ReactNode }) {
  return (
    <Text fontSize="sm" color="summaryFaint" lineHeight="1.45">
      {children}
    </Text>
  );
}

export function SummaryTotal({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <Flex direction="column" gap="3px" pt="14px" borderTopWidth="1px" borderTopColor="summaryLineStrong">
      <Text fontSize="sm" color="summaryFaint">
        {label}
      </Text>
      <Text fontSize="stat" fontWeight="bold" lineHeight="1.05" letterSpacing="-0.02em" color="white">
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
