// src/components/ui/PageCard.tsx
// Casca visual compartilhada (bg/shadow/radius + overflow hidden), fonte única
// do padrão (Lei 2 do `cerne`). `fullHeight` liga a casca "altura cheia" com o
// corpo como passthrough flex-column (`flex:1; minH:0`) — quem realmente rola é
// a região de scroll da grid mais abaixo, nunca o card.

import { ReactNode } from 'react';

import { Box } from '@chakra-ui/react';

export interface PageCardProps {
  children: ReactNode;
  fullHeight?: boolean;
}

export function PageCard({ children, fullHeight = false }: PageCardProps) {
  if (!fullHeight) {
    return (
      <Box bg="formBG" borderRadius="xl" boxShadow="cardShadow" overflow="hidden">
        {children}
      </Box>
    );
  }

  return (
    <Box
      bg="formBG"
      borderRadius="xl"
      boxShadow="cardShadow"
      overflow="hidden"
      height="100%"
      display="flex"
      flexDirection="column"
    >
      {/* Passthrough: propaga a altura bounded ao filho sem rolar aqui. */}
      <Box flex="1" minH={0} display="flex" flexDirection="column">
        {children}
      </Box>
    </Box>
  );
}

export default PageCard;
