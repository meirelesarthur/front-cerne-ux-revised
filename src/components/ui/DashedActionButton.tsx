// src/components/ui/DashedActionButton.tsx
// Ação secundária em contorno tracejado, com seta à direita (ex.: "Copiar resumo da proposta →"),
// feita para o painel escuro de resumo. Cores pelos tokens do painel (`summary*`).

import { Flex, Text } from '@chakra-ui/react';

// `as="button"` não altera os tipos de props do Chakra; o `type` entra por spread.
const BUTTON_ATTRS = { type: 'button' } as Record<string, string>;

export interface DashedActionButtonProps {
  label: string;
  onClick: () => void;
}

export function DashedActionButton({ label, onClick }: DashedActionButtonProps) {
  return (
    <Flex
      as="button"
      {...BUTTON_ATTRS}
      onClick={onClick}
      align="center"
      justify="space-between"
      gap={2}
      w="full"
      px="14px"
      h="40px"
      borderWidth="1px"
      borderStyle="dashed"
      borderColor="summaryFaint"
      borderRadius="lg"
      color="summaryText"
      fontSize="base"
      fontWeight="semibold"
      bg="transparent"
      transition="background 0.15s ease, border-color 0.15s ease"
      _hover={{ bg: 'summaryFill', borderColor: 'summaryText' }}
      _focusVisible={{ outline: '2px solid', outlineColor: 'summaryAccent', outlineOffset: '2px' }}
    >
      <Text as="span" flex="1" textAlign="center">
        {label}
      </Text>
      <Text as="span" aria-hidden="true">
        →
      </Text>
    </Flex>
  );
}

export default DashedActionButton;
