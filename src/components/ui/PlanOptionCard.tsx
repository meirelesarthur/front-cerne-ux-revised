// src/components/ui/PlanOptionCard.tsx
// Cartão selecionável de plano (Pro / Deluxe / Enterprise): nome na cor do plano,
// preço, preço mensal, descrição curta e selo opcional (ex.: "Plano atual"). Uso em grupo de rádio.

import { Box, Flex, Text } from '@chakra-ui/react';

// `as="button"` não altera os tipos de props do Chakra; o `type` entra por spread.
const BUTTON_ATTRS = { type: 'button' } as Record<string, string>;

export interface PlanOptionCardProps {
  name: string;
  /** Preço já formatado (ex.: "R$ 349"). */
  price: string;
  /** Sufixo do preço (ex.: "/mês"). */
  priceSuffix: string;
  description: string;
  /** Cor de identidade do plano (hex do catálogo). */
  accent: string;
  selected: boolean;
  onSelect: () => void;
  /** Selo no canto (ex.: "Plano atual"). */
  badge?: string;
}

export function PlanOptionCard({
  name,
  price,
  priceSuffix,
  description,
  accent,
  selected,
  onSelect,
  badge,
}: PlanOptionCardProps) {
  return (
    <Flex
      as="button"
      role="radio"
      {...BUTTON_ATTRS}
      aria-checked={selected}
      onClick={onSelect}
      direction="column"
      align="flex-start"
      gap="4px"
      textAlign="left"
      px={4}
      py="14px"
      borderRadius="xl"
      borderWidth="1px"
      borderColor={selected ? accent : 'semanticNeutral.200'}
      bg={selected ? 'semanticNeutral.100' : 'cardBG'}
      boxShadow={selected ? `0 0 0 1px ${accent} inset` : 'none'}
      transition="background 0.2s ease, border-color 0.2s ease"
      _hover={{ bg: 'semanticNeutral.100' }}
    >
      <Flex w="full" align="center" justify="space-between" gap={2}>
        <Text fontSize="lg" fontWeight="bold" style={{ color: accent }}>
          {name}
        </Text>
        {badge && (
          <Box as="span" px="8px" py="1px" borderRadius="full" fontSize="sm" fontWeight="semibold" bg="semanticNeutral.200" color="fg.default">
            {badge}
          </Box>
        )}
      </Flex>
      <Text fontSize="xl" fontWeight="bold" lineHeight="1.2">
        {price}
        <Text as="span" fontSize="sm" fontWeight="medium" color="fg.muted" ml="2px">
          {priceSuffix}
        </Text>
      </Text>
      <Text fontSize="sm" color="fg.muted" lineHeight="1.35">
        {description}
      </Text>
    </Flex>
  );
}

export default PlanOptionCard;
