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
  /** Ocupa toda a largura: primeira etapa colada à esquerda, última à direita, linha esticada entre elas. */
  spread?: boolean;
  /** Etapas bloqueadas (ex.: ainda não alcançadas num fluxo linear). */
  isStepDisabled?: (key: K) => boolean;
}

export function StepIndicator<K extends string = string>({ steps, value, onChange, ariaLabel, spread = false, isStepDisabled }: StepIndicatorProps<K>) {
  return (
    <Flex role="tablist" aria-label={ariaLabel} align="center" justify={spread ? 'space-between' : 'center'} gap="14px" wrap={spread ? 'nowrap' : 'wrap'} w={spread ? 'full' : undefined}>
      {steps.map((step, index) => {
        const active = step.key === value;
        const disabled = isStepDisabled?.(step.key) ?? false;
        return (
          <Flex key={step.key} align="center" gap="14px" flex={spread && index > 0 ? 1 : undefined} minW={0}>
            {index > 0 && <Box aria-hidden="true" w={spread ? undefined : '64px'} flex={spread ? 1 : undefined} h="1px" bg="semanticNeutral.200" />}
            <Flex
              as="button"
              role="tab"
              {...BUTTON_ATTRS}
              id={`step-${step.key}`}
              aria-selected={active}
              {...({ disabled } as Record<string, boolean>)}
              opacity={disabled ? 0.5 : 1}
              cursor={disabled ? 'not-allowed' : 'pointer'}
              onClick={() => !disabled && onChange(step.key)}
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
