// src/components/ui/BulkActionBar.tsx
// Barra de ações em lote (DS `BulkActionBar`): aparece quando há itens selecionados, mostra a
// contagem e hospeda as ações (botões) à direita. Não conhece a regra de negócio.

import type { ReactNode } from 'react';

import { Flex, Text } from '@chakra-ui/react';

export interface BulkActionBarProps {
  /** Texto já pronto, ex.: "3 selecionadas". */
  label: string;
  /** Ações (botões do kit). */
  children: ReactNode;
}

export function BulkActionBar({ label, children }: BulkActionBarProps) {
  return (
    <Flex
      role="region"
      aria-live="polite"
      align="center"
      gap={3}
      wrap="wrap"
      mx={4}
      mb={2}
      px={3}
      py="8px"
      borderRadius="lg"
      borderWidth="1px"
      borderColor="green.100"
      bg="green.50"
    >
      <Text fontWeight="semibold" fontSize="base" color="fg.default">
        {label}
      </Text>
      <Flex ml="auto" gap="8px" wrap="wrap">
        {children}
      </Flex>
    </Flex>
  );
}

export default BulkActionBar;
