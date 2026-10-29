// src/components/ui/BandSlider.tsx
// Régua deslizante dividida em faixas iguais (ex.: faixas de tamanho da fazenda): valores dos
// limites acima da barra e o nome de cada faixa no centro do trecho. Controlado; a posição vai de 0 a
// `bands × 100`. A conversão posição ↔ valor fica com quem usa (regra de negócio).

import { Box, Flex, Text } from '@chakra-ui/react';

export interface BandSliderProps {
  /** Posição atual, de 0 a `bandLabels.length × 100`. */
  value: number;
  onChange: (position: number) => void;
  /** Rótulos dos limites (`bandLabels.length + 1`), ex.: `0 · 500 · 1.500 · … · 20.000+`; uma quebra de linha no rótulo vira 2 linhas. */
  ticks: string[];
  /** Nome de cada faixa, no centro do trecho. */
  bandLabels: string[];
  ariaLabel: string;
  /** Faixa em destaque (índice), opcional. */
  activeBand?: number;
}

export function BandSlider({ value, onChange, ticks, bandLabels, ariaLabel, activeBand }: BandSliderProps) {
  const max = bandLabels.length * 100;
  const pct = (value / max) * 100;
  return (
    <Box w="full">
      {/* valores acima da barra, cada um com um pequeno traço apontando para ela */}
      <Box position="relative" h={ticks.some((t) => t.includes('\n')) ? '40px' : '26px'} aria-hidden="true">
        {ticks.map((label, i) => (
          <Flex key={i} direction="column" align="center" position="absolute" left={`${(i / bandLabels.length) * 100}%`} transform="translateX(-50%)" bottom={0}>
            <Text fontSize="xs" color="fg.muted" mb="2px" whiteSpace="pre-line" textAlign="center" lineHeight="1.25">
              {label}
            </Text>
            <Box w="1px" h="6px" bg="semanticNeutral.300" />
          </Flex>
        ))}
      </Box>
      <Box position="relative" h="28px">
        <input
          type="range"
          min={0}
          max={max}
          step={1}
          value={value}
          aria-label={ariaLabel}
          onChange={(e) => onChange(Number(e.target.value))}
          style={{
            width: '100%',
            height: 28,
            margin: 0,
            accentColor: 'var(--chakra-colors-green-600)',
            background: `linear-gradient(to right, var(--chakra-colors-green-600) ${pct}%, transparent ${pct}%)`,
            backgroundSize: '100% 4px',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'center',
          }}
        />
      </Box>
      <Box position="relative" h="20px" aria-hidden="true">
        {bandLabels.map((label, i) => (
          <Text
            key={i}
            position="absolute"
            left={`${(i / bandLabels.length) * 100 + 100 / bandLabels.length / 2}%`}
            transform="translateX(-50%)"
            fontSize="xs"
            fontWeight={activeBand === i ? 'bold' : 'medium'}
            color={activeBand === i ? 'selectedText' : 'fg.muted'}
            whiteSpace="nowrap"
          >
            {label}
          </Text>
        ))}
      </Box>
    </Box>
  );
}

export default BandSlider;
