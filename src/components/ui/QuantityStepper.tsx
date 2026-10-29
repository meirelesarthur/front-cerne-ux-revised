// src/components/ui/QuantityStepper.tsx
// Seletor de quantidade: régua (opcional) e − [número] + (campo editável) na mesma linha.
// Controlado; limita ao intervalo [min, max]. Rótulos acessíveis vêm por props (i18n fora).

import { Box, Flex, Input, Text } from '@chakra-ui/react';

// `as="button"` não altera os tipos de props do Chakra; o `type` entra por spread.
const BUTTON_ATTRS = { type: 'button' } as Record<string, string>;

export interface QuantityStepperProps {
  value: number;
  min?: number;
  max?: number;
  onChange: (value: number) => void;
  labels: { decrease: string; increase: string; input: string };
  /** Mostra a régua ao lado (limitada a `sliderMax`). */
  slider?: boolean;
  sliderMax?: number;
  /** Legenda da extremidade mínima da régua (ex.: "5 incluídos no Pro"): o piso não pode ser reduzido. */
  minLabel?: string;
}

export function QuantityStepper({
  value,
  min = 1,
  max = 500,
  onChange,
  labels,
  slider = true,
  sliderMax = 60,
  minLabel,
}: QuantityStepperProps) {
  const clamp = (v: number) => Math.max(min, Math.min(max, Math.round(Number(v) || min)));

  const stepButton = (symbol: string, label: string, delta: number) => (
    <Flex
      as="button"
      {...BUTTON_ATTRS}
      aria-label={label}
      {...({ disabled: (delta < 0 && value <= min) || (delta > 0 && value >= max) } as Record<string, boolean>)}
      onClick={() => onChange(clamp(value + delta))}
      align="center"
      justify="center"
      w="36px"
      bg="semanticNeutral.100"
      fontSize="xl"
      fontWeight="semibold"
      _hover={{ bg: 'semanticNeutral.200' }}
      _disabled={{ opacity: 0.4, cursor: 'not-allowed', _hover: { bg: 'semanticNeutral.100' } }}
    >
      {symbol}
    </Flex>
  );

  // Na horizontal: régua à esquerda (ocupa o espaço que sobrar) e − [número] + à direita.
  return (
    <Flex align="center" gap="14px">
      {slider && (
        <Box flex="1 1 80px" minW="80px">
          <input
            type="range"
            aria-label={labels.input}
            min={min}
            max={sliderMax}
            value={Math.min(sliderMax, value)}
            onChange={(e) => onChange(clamp(Number(e.target.value)))}
            style={{ width: '100%', accentColor: 'var(--chakra-colors-green-600)' }}
          />
          {minLabel && (
            <Text fontSize="xs" color="fg.muted" mt="2px">
              ▲ {minLabel}
            </Text>
          )}
        </Box>
      )}
      <Flex display="inline-flex" flexShrink={0} borderWidth="1px" borderColor="semanticNeutral.200" borderRadius="lg" overflow="hidden" bg="cardBG">
        {stepButton('−', labels.decrease, -1)}
        <Input
          type="number"
          aria-label={labels.input}
          value={value}
          min={min}
          max={max}
          onChange={(e) => e.target.value !== '' && onChange(clamp(Number(e.target.value)))}
          w="56px"
          h="auto"
          py="10px"
          textAlign="center"
          fontSize="figure"
          fontWeight="bold"
          border="none"
          borderRadius={0}
          borderInline="1px solid"
          borderColor="semanticNeutral.200"
        />
        {stepButton('+', labels.increase, 1)}
      </Flex>
    </Flex>
  );
}

export default QuantityStepper;
