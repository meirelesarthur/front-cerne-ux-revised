// src/pages/Administrativo/Solicitacao/RequestTabParts.tsx
// Peças comuns das abas da Ordem de compra (Itens, Anexos, Histórico e
// Cotações): cabeçalho "título + contador + ações" e estado vazio tracejado.
// Uma fonte só para as quatro abas terem o mesmo visual.

import type { ReactNode } from 'react';

import { Box, Flex, HStack, Text } from '@chakra-ui/react';

export interface RequestTabHeaderProps {
  title: string;
  /** Contador ao lado do título; some quando zero ou ausente. */
  count?: number;
  /** Botões à direita. */
  children?: ReactNode;
}

export function RequestTabHeader({ title, count, children }: RequestTabHeaderProps) {
  return (
    <Flex justify="space-between" align="center" mb={4} gap={3} wrap="wrap">
      <HStack gap={2}>
        <Text fontSize="xl" fontWeight="semibold" color="strongText">
          {title}
        </Text>
        {!!count && (
          <Box
            as="span"
            px="7px"
            borderRadius="md"
            bg="semanticNeutral.100"
            color="fg.muted"
            fontSize="sm"
            fontWeight="medium"
          >
            {count}
          </Box>
        )}
      </HStack>
      {children && (
        <HStack gap={2} wrap="wrap">
          {children}
        </HStack>
      )}
    </Flex>
  );
}

export function RequestTabEmpty({ children }: { children: ReactNode }) {
  return (
    <Box
      px={4}
      py={6}
      borderWidth="1px"
      borderStyle="dashed"
      borderColor="semanticNeutral.200"
      borderRadius="xl"
      textAlign="center"
    >
      <Text fontSize="sm" color="fg.muted">
        {children}
      </Text>
    </Box>
  );
}
