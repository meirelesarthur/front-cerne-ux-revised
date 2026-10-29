// src/components/ui/GiaTierCard.tsx
// Cartão de um nível da GIA (assistente de IA): nome do nível e plano onde vem, métricas (janela de
// uso por pessoa etc.) e a lista do que a GIA faz, cada item com sua situação (disponível / a
// construir / a decidir). Só apresentação — o conteúdo vem do catálogo e os textos de interface
// por props (i18n no chamador).

import { Box, Flex, Text } from '@chakra-ui/react';

export type GiaCapabilityTone = 'available' | 'build' | 'decide';

export interface GiaTierCardCapability {
  title?: string;
  text: string;
  tone: GiaCapabilityTone;
  statusLabel: string;
}

export interface GiaTierCardProps {
  name: string;
  /** Etiqueta no topo (ex.: "No plano Pro"). */
  tag: string;
  /** Linha "Tudo do …", quando o nível herda de outro. */
  inheritsLabel?: string;
  /** Cor de realce do cartão (token do plano). */
  accent?: string;
  metrics: { label: string; value: string }[];
  capabilities: GiaTierCardCapability[];
}

const TONE: Record<GiaCapabilityTone, { bg: string; color: string }> = {
  available: { bg: 'selectedBG', color: 'selectedText' },
  build: { bg: 'addonSoftBG', color: 'addonText' },
  decide: { bg: 'semanticNeutral.100', color: 'fg.muted' },
};

export function GiaTierCard({ name, tag, inheritsLabel, accent, metrics, capabilities }: GiaTierCardProps) {
  return (
    <Flex direction="column" gap={4} p={4} h="full" borderWidth="1px" borderColor="border.subtle" borderRadius="xl" bg="cardBG">
      <Flex align="center" justify="space-between" gap={2}>
        <Text fontSize="lg" fontWeight="semibold" style={accent ? { color: accent } : undefined}>
          {name}
        </Text>
        <Box as="span" px="10px" py="2px" borderRadius="full" bg="semanticNeutral.100" color="fg.muted" fontSize="xs" fontWeight="semibold" whiteSpace="nowrap">
          {tag}
        </Box>
      </Flex>

      <Flex direction="column" gap="6px">
        {metrics.map((m) => (
          <Flex key={m.label} justify="space-between" gap={3} fontSize="base">
            <Text color="fg.muted">{m.label}</Text>
            <Text fontWeight="semibold" textAlign="right">
              {m.value}
            </Text>
          </Flex>
        ))}
      </Flex>

      <Box pt={3} borderTopWidth="1px" borderColor="border.subtle" flex="1">
        {inheritsLabel && (
          <Text fontSize="base" fontWeight="semibold" mb={2}>
            {inheritsLabel}
          </Text>
        )}
        <Flex as="ul" direction="column" gap={2} listStyleType="none" m={0} p={0}>
          {capabilities.map((c) => (
            <Box as="li" key={c.text} fontSize="base" lineHeight="1.45">
              {c.title && <b>{c.title}: </b>}
              {c.text}{' '}
              <Box as="span" px="8px" py="1px" borderRadius="full" bg={TONE[c.tone].bg} color={TONE[c.tone].color} fontSize="xs" fontWeight="semibold" whiteSpace="nowrap">
                {c.statusLabel}
              </Box>
            </Box>
          ))}
        </Flex>
      </Box>
    </Flex>
  );
}

export default GiaTierCard;
