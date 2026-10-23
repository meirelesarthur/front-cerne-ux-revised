// src/components/ui/ProgressRing.tsx
// Anel de progresso (0–100) com o percentual no centro. Puro CSS (conic-gradient):
// sem lib de gráfico, tema claro/escuro via tokens. Usado no resumo de conciliação.

import { Box } from '@chakra-ui/react';

export interface ProgressRingProps {
  /** 0–100. */
  value: number;
  /** Diâmetro em px (default 42). */
  size?: number;
  /** Rótulo acessível (ex.: "Progresso da conciliação"). */
  label?: string;
}

export function ProgressRing({ value, size = 42, label }: ProgressRingProps) {
  const pct = Math.max(0, Math.min(100, Math.round(value)));
  const inner = size - 10;
  return (
    <Box
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
      position="relative"
      flexShrink={0}
      width={`${size}px`}
      height={`${size}px`}
      borderRadius="full"
      display="grid"
      placeItems="center"
      style={{
        background: `conic-gradient(var(--chakra-colors-green-600) ${pct * 3.6}deg, var(--chakra-colors-semantic-neutral-200) 0)`,
      }}
    >
      <Box
        width={`${inner}px`}
        height={`${inner}px`}
        borderRadius="full"
        bg="cardBG"
        display="grid"
        placeItems="center"
        fontSize="2xs"
        fontWeight="semibold"
        color="fg.default"
      >
        {pct}%
      </Box>
    </Box>
  );
}

export default ProgressRing;
