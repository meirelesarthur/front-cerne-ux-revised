// src/components/ui/StepIndicator.tsx
// Indicador de etapas de configurador (estilo "simulador"): quadradinho numerado + rótulo,
// ligados por uma linha. A etapa ativa fica em verde; todas são clicáveis (navegação livre).
// Difere do `Steps` (wizard de formulário com validação por etapa).

import { Box, Flex } from '@chakra-ui/react';

// `as="button"` não altera os tipos de props do Chakra; o `type` entra por spread.
const BUTTON_ATTRS = { type: 'button' } as Record<string, string>;

export interface StepIndicatorItem<K extends string = string> {
  key: K;
  label: string;
}

export interface StepIndicatorProps<K extends string = string> {
  steps: StepIndicatorItem<K>[];
  value: K;
  onChange: (key: K) => void;
  ariaLabel?: string;
}

export function StepIndicator<K extends string = string>({ steps, value, onChange, ariaLabel }: StepIndicatorProps<K>) {
  return (
    <Flex role="tablist" aria-label={ariaLabel} align="center" justify="center" gap="14px" wrap="wrap">
      {steps.map((step, index) => {
        const active = step.key === value;
        return (
          <Flex key={step.key} align="center" gap="14px">
            {index > 0 && <Box aria-hidden="true" w="64px" h="1px" bg="semanticNeutral.200" />}
            <Flex
              as="button"
              role="tab"
              {...BUTTON_ATTRS}
              id={`step-${step.key}`}
              aria-selected={active}
              onClick={() => onChange(step.key)}
              align="center"
              gap="10px"
              px="4px"
              py="6px"
              borderRadius="md"
              fontWeight="semibold"
              fontSize="md"
              color={active ? 'fg.default' : 'fg.muted'}
            >
              <Flex
                align="center"
                justify="center"
                boxSize="30px"
                borderRadius="lg"
                borderWidth="1px"
                borderColor={active ? 'green.600' : 'semanticNeutral.200'}
                bg={active ? 'green.600' : 'semanticNeutral.100'}
                color={active ? 'white' : 'fg.muted'}
                fontSize="base"
                fontWeight="bold"
                transition="background 0.2s ease, border-color 0.2s ease"
              >
                {index + 1}
              </Flex>
              {step.label}
            </Flex>
          </Flex>
        );
      })}
    </Flex>
  );
}

export default StepIndicator;
