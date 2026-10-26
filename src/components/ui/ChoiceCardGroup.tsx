// src/components/ui/ChoiceCardGroup.tsx
// Grupo de cartões de escolha única (rádio): título, valor e descrição curta por opção.
// Ex.: serviço GB Consult (Sem serviço · Fiscal · Fazenda · Corporativo). Controlado.

import { Box, Flex, Grid, Text } from '@chakra-ui/react';

// `as="button"` não altera os tipos de props do Chakra; o `type` entra por spread.
const BUTTON_ATTRS = { type: 'button' } as Record<string, string>;

export interface ChoiceCardOption {
  key: string;
  title: string;
  /** Linha de valor (ex.: "R$ 489/mês"). */
  value: string;
  description?: string;
}

export interface ChoiceCardGroupProps {
  options: ChoiceCardOption[];
  value: string;
  onChange: (key: string) => void;
  ariaLabel: string;
}

export function ChoiceCardGroup({ options, value, onChange, ariaLabel }: ChoiceCardGroupProps) {
  return (
    <Grid role="radiogroup" aria-label={ariaLabel} templateColumns={{ base: '1fr', sm: 'repeat(2, minmax(0, 1fr))', xl: 'repeat(4, minmax(0, 1fr))' }} gap="8px">
      {options.map((opt) => {
        const selected = opt.key === value;
        return (
          <Flex
            key={opt.key}
            as="button"
            role="radio"
            {...BUTTON_ATTRS}
            aria-checked={selected}
            onClick={() => onChange(opt.key)}
            direction="column"
            align="flex-start"
            gap="3px"
            p="12px"
            textAlign="left"
            borderRadius="xl"
            borderWidth="1.5px"
            borderStyle="solid"
            borderColor={selected ? 'green.600' : 'semanticNeutral.200'}
            bg={selected ? 'green.50' : 'cardBG'}
            transition="border-color 0.15s ease, background 0.15s ease"
            _hover={{ bg: selected ? 'green.50' : 'semanticNeutral.100' }}
            _focusVisible={{ outline: '2px solid', outlineColor: 'green.600', outlineOffset: '2px' }}
          >
            <Text fontSize="base" fontWeight="bold" color={selected ? 'green.700' : 'gray.900'}>
              {opt.title}
            </Text>
            <Text fontSize="sm" fontWeight="medium" color="fg.muted">
              {opt.value}
            </Text>
            {opt.description && (
              <Box fontSize="xs" color="fg.muted" lineHeight="1.4">
                {opt.description}
              </Box>
            )}
          </Flex>
        );
      })}
    </Grid>
  );
}

export default ChoiceCardGroup;
