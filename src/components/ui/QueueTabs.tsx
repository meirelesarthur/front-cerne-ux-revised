// src/components/ui/QueueTabs.tsx
// Abas de "fila de trabalho" com contador por aba (ex.: Para revisar 8 · Sugestões 3).
// Sublinhado verde na aba ativa; contador em pílula. Controlado (valor + onChange).

import { Box, Flex } from '@chakra-ui/react';

// `as="button"` não altera os tipos de props do Chakra; o `type` entra por spread.
const BUTTON_ATTRS = { type: 'button' } as Record<string, string>;

export interface QueueTab<K extends string = string> {
  key: K;
  label: string;
  count: number;
}

export interface QueueTabsProps<K extends string = string> {
  tabs: QueueTab<K>[];
  value: K;
  onChange: (key: K) => void;
  ariaLabel?: string;
}

export function QueueTabs<K extends string = string>({ tabs, value, onChange, ariaLabel }: QueueTabsProps<K>) {
  return (
    <Flex role="tablist" aria-label={ariaLabel} gap="2px" px={3} borderBottomWidth="1px" borderColor="border.muted" overflowX="auto">
      {tabs.map((tab) => {
        const active = tab.key === value;
        return (
          <Flex
            as="button"
            key={tab.key}
            role="tab"
            {...BUTTON_ATTRS}
            aria-selected={active}
            onClick={() => onChange(tab.key)}
            align="center"
            gap="6px"
            px="10px"
            py="10px"
            mb="-1px"
            whiteSpace="nowrap"
            fontSize="base"
            fontWeight="medium"
            color={active ? 'green.700' : 'fg.muted'}
            borderBottomWidth="2px"
            borderBottomColor={active ? 'green.600' : 'transparent'}
            transition="color 0.15s ease, border-color 0.15s ease"
            _hover={{ color: active ? 'green.700' : 'fg.default' }}
          >
            {tab.label}
            <Box
              as="span"
              px="7px"
              borderRadius="full"
              fontSize="sm"
              bg={active ? 'green.100' : 'semanticNeutral.100'}
              color={active ? 'green.700' : 'semanticNeutral.600'}
            >
              {tab.count}
            </Box>
          </Flex>
        );
      })}
    </Flex>
  );
}

export default QueueTabs;
