// src/components/ui/PlanTierCard.tsx
// Cartão de um plano na "escada" de planos (visão de resumo): faixa de cor no topo, nome e
// posicionamento, faixa de preço, chips (atividades/acessos), o que herda do plano de baixo, a
// lista do que inclui e o quadro de módulos avulsos disponíveis. Apresentacional.

import { Box, Flex, Text } from '@chakra-ui/react';

export interface PlanTierCardProps {
  name: string;
  tagline: string;
  /** Cor de identidade do plano (dado do catálogo). */
  accent: string;
  /** Faixa de preço já formatada (ex.: "R$ 189 a 1.590"). */
  priceRange: string;
  priceNote: string;
  chips: string[];
  /** Rótulo da lista (ex.: "Base do Cerne" · "Tudo do Pro, mais"). */
  listLabel: string;
  items: string[];
  /** Título do quadro de avulsos (ex.: "Avulsos disponíveis" ou "Sem avulsos"). */
  addonsLabel: string;
  addonLines: string[];
  /** Quadro de avulsos em tom do plano ("tudo incluído") em vez do tom de adicional. */
  addonsAllIncluded?: boolean;
}

export function PlanTierCard({ name, tagline, accent, priceRange, priceNote, chips, listLabel, items, addonsLabel, addonLines, addonsAllIncluded = false }: PlanTierCardProps) {
  return (
    <Flex direction="column" gap="12px" p={5} bg="cardBG" borderWidth="1px" borderColor="semanticNeutral.200" borderTopWidth="6px" borderRadius="xl" boxShadow="cardShadow" minW={0} style={{ borderTopColor: accent }}>
      <Box>
        <Text fontSize="24px" fontWeight="bold" lineHeight="1" style={{ color: accent }}>
          {name}
        </Text>
        <Text fontSize="base" color="fg.muted" mt="4px">
          {tagline}
        </Text>
      </Box>
      <Box>
        <Text fontSize="22px" fontWeight="bold" lineHeight="1.1" whiteSpace="nowrap">
          {priceRange}
        </Text>
        <Text fontSize="sm" color="fg.muted" mt="4px">
          {priceNote}
        </Text>
      </Box>
      <Flex wrap="wrap" gap="6px">
        {chips.map((chip) => (
          <Box key={chip} as="span" px="8px" py="3px" borderRadius="full" bg="semanticNeutral.100" color="fg.muted" fontSize="sm" fontWeight="semibold" whiteSpace="nowrap">
            {chip}
          </Box>
        ))}
      </Flex>
      <Text pt="12px" borderTopWidth="1px" borderColor="semanticNeutral.200" fontSize="xs" fontWeight="semibold" textTransform="uppercase" letterSpacing="0.05em" color="fg.muted">
        {listLabel}
      </Text>
      <Box as="ul" m={0} pl="18px" display="grid" gap="5px" fontSize="base">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </Box>
      <Flex
        mt="auto"
        direction="column"
        gap="2px"
        minH="76px"
        justify="center"
        px="12px"
        py="10px"
        borderRadius="10px"
        borderWidth="1px"
        borderStyle="dashed"
        borderColor={addonsAllIncluded ? undefined : 'addonText'}
        bg={addonsAllIncluded ? 'semanticNeutral.100' : 'rgba(138,59,107,0.08)'}
        color={addonsAllIncluded ? undefined : 'addonText'}
        fontSize="sm"
        style={addonsAllIncluded ? { borderColor: accent, color: accent } : undefined}
      >
        <Text fontSize="2xs" fontWeight="semibold" textTransform="uppercase" letterSpacing="0.05em" opacity={0.85}>
          {addonsLabel}
        </Text>
        {addonLines.map((line) => (
          <span key={line}>{line}</span>
        ))}
      </Flex>
    </Flex>
  );
}

export default PlanTierCard;
