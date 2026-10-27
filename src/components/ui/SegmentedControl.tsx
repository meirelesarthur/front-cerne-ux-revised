// src/components/ui/SegmentedControl.tsx
// Controle segmentado (2–4 opções mutuamente exclusivas, uma sempre ativa). Ex.: Vincular a
// título · Criar lançamento · Transferência. Controlado; acessível como `tablist`.

import { Flex } from '@chakra-ui/react';

// `as="button"` não altera os tipos de props do Chakra; o `type` entra por spread.
const BUTTON_ATTRS = { type: 'button' } as Record<string, string>;

export interface SegmentedOption<K extends string = string> {
  key: K;
  label: string;
}

export interface SegmentedControlProps<K extends string = string> {
  options: SegmentedOption<K>[];
  value: K;
  onChange: (key: K) => void;
  ariaLabel?: string;
}

export function SegmentedControl<K extends string = string>({
  options,
  value,
  onChange,
  ariaLabel,
}: SegmentedControlProps<K>) {
  return (
    <Flex
      role="tablist"
      aria-label={ariaLabel}
      display="inline-flex"
      bg="semanticNeutral.100"
      borderRadius="lg"
      p="3px"
      gap="2px"
      maxW="100%"
      overflowX="auto"
    >
      {options.map((option) => {
        const active = option.key === value;
        return (
          <Flex
            as="button"
            key={option.key}
            role="tab"
            {...BUTTON_ATTRS}
            aria-selected={active}
            onClick={() => onChange(option.key)}
            px="14px"
            py="7px"
            borderRadius="md"
            whiteSpace="nowrap"
            fontSize="base"
            fontWeight={active ? 'semibold' : 'medium'}
            color={active ? 'fg.default' : 'fg.muted'}
            bg={active ? 'cardBG' : 'transparent'}
            boxShadow={active ? 'cardShadow' : 'none'}
            transition="background 0.15s ease, color 0.15s ease"
          >
            {option.label}
          </Flex>
        );
      })}
    </Flex>
  );
}

export default SegmentedControl;
