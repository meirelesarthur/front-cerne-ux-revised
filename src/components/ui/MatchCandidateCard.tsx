// src/components/ui/MatchCandidateCard.tsx
// Cartão de candidato de conciliação: título + subtítulo, MOTIVOS do casamento (✓ atendido,
// ≈ aproximado) e o medidor de confiança. Selecionável (radio) — um candidato por transação.

import { Box, Flex, Text } from '@chakra-ui/react';

import { ConfidenceMeter, type ConfidenceBand } from './ConfidenceMeter';
import { Icon } from './Icon';

export interface MatchReason {
  label: string;
  matched: boolean;
}

export interface MatchCandidateCardProps {
  /** Nome do grupo de rádio (uma transação = um grupo). */
  name: string;
  title: string;
  subtitle: string;
  score: number;
  reasons: MatchReason[];
  selected: boolean;
  onSelect: () => void;
  meterLabels: Record<ConfidenceBand, string>;
}

export function MatchCandidateCard({
  name,
  title,
  subtitle,
  score,
  reasons,
  selected,
  onSelect,
  meterLabels,
}: MatchCandidateCardProps) {
  return (
    <Flex
      as="label"
      align="center"
      gap="12px"
      px={4}
      py={3}
      mb="10px"
      borderRadius="xl"
      borderWidth="1.5px"
      borderColor={selected ? 'green.600' : 'semanticNeutral.200'}
      bg={selected ? 'green.50' : 'transparent'}
      cursor="pointer"
      transition="border-color 0.12s ease, background 0.12s ease"
      _hover={{ borderColor: selected ? 'green.600' : 'semanticNeutral.300' }}
    >
      <input
        type="radio"
        name={name}
        checked={selected}
        onChange={onSelect}
        style={{ accentColor: 'var(--chakra-colors-green-600)', width: 16, height: 16, margin: 0 }}
      />
      <Box flex="1" minW={0}>
        <Text fontWeight="semibold" color="fg.default">
          {title}
        </Text>
        <Text fontSize="base" color="fg.muted">
          {subtitle}
        </Text>
        <Flex gap="6px" wrap="wrap" mt="8px">
          {reasons.map((reason) => (
            <Flex
              key={reason.label}
              align="center"
              gap="4px"
              px="8px"
              py="1px"
              borderRadius="full"
              fontSize="sm"
              fontWeight="medium"
              bg={reason.matched ? 'feedBack.success' : 'feedBack.warn'}
              color={reason.matched ? 'feedBack.successMain' : 'feedBack.warnMain'}
            >
              <Icon name={reason.matched ? 'check-circle' : 'alert'} size={12} />
              {reason.label}
            </Flex>
          ))}
        </Flex>
      </Box>
      <ConfidenceMeter score={score} labels={meterLabels} />
    </Flex>
  );
}

export default MatchCandidateCard;
