// src/components/ui/QuantityStepper.tsx
// Seletor de quantidade: − [número] + (campo editável) e, opcionalmente, um slider abaixo.
// Controlado; limita ao intervalo [min, max]. Rótulos acessíveis vêm por props (i18n fora).

import { Box, Flex, Input } from '@chakra-ui/react';

// `as="button"` não altera os tipos de props do Chakra; o `type` entra por spread.
const BUTTON_ATTRS = { type: 'button' } as Record<string, string>;

export interface QuantityStepperProps {
  value: number;
  min?: number;
  max?: number;
  onChange: (value: number) => void;
  labels: { decrease: string; increase: string; input: string };
  /** Mostra o slider abaixo (limitado a `sliderMax`). */
  slider?: boolean;
  sliderMax?: number;
}

export function QuantityStepper({
  value,
  min = 1,
  max = 500,
  onChange,
  labels,
  slider = true,
  sliderMax = 60,
}: QuantityStepperProps) {
  const clamp = (v: number) => Math.max(min, Math.min(max, Math.round(Number(v) || min)));

  const stepButton = (symbol: string, label: string, delta: number) => (
    <Flex
      as="button"
      {...BUTTON_ATTRS}
      aria-label={label}
      onClick={() => onChange(clamp(value + delta))}
      align="center"
      justify="center"
      w="42px"
      bg="semanticNeutral.100"
      fontSize="xl"
      fontWeight="semibold"
      _hover={{ bg: 'semanticNeutral.200' }}
    >
      {symbol}
    </Flex>
  );

  return (
    <Box>
      <Flex display="inline-flex" borderWidth="1px" borderColor="semanticNeutral.200" borderRadius="lg" overflow="hidden" bg="cardBG">
        {stepButton('−', labels.decrease, -1)}
        <Input
          type="number"
          aria-label={labels.input}
          value={value}
          min={min}
          max={max}
          onChange={(e) => e.target.value !== '' && onChange(clamp(Number(e.target.value)))}
          w="84px"
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
      {slider && (
        <input
          type="range"
          aria-label={labels.input}
          min={min}
          max={sliderMax}
          value={Math.min(sliderMax, value)}
          onChange={(e) => onChange(clamp(Number(e.target.value)))}
          style={{ width: '100%', marginTop: 12, accentColor: 'var(--chakra-colors-green-600)' }}
        />
      )}
    </Box>
  );
}

export default QuantityStepper;
