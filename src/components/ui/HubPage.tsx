// src/components/ui/HubPage.tsx
// -----------------------------------------------------------------------------
// Casca das telas de CENTRAL (central genérica de agrupador `/central/:groupId`
// e centrais próprias, ex.: `/operacional/central`). Mesma moldura das demais
// telas (`FormContainer`/`ContainerGrid`): respiro de 8px (`p="2"`) para o
// SecondaryNav e para as bordas do card externo, card de altura cheia alinhado
// ao topo e à base do SecondaryNav, e rolagem só dentro do card. Antes cada
// central usava `PageCard` solto: o card colava no SecondaryNav, ficava 8px
// acima dele e terminava no fim do conteúdo.
// -----------------------------------------------------------------------------

import type { ReactNode } from 'react';

import { Box } from '@chakra-ui/react';

import { PageCard } from './PageCard';

export interface HubPageProps {
  children: ReactNode;
}

export function HubPage({ children }: HubPageProps) {
  return (
    <Box p="2" h="100%">
      <PageCard fullHeight>
        <Box flex="1" minH={0} overflowY="auto" p={{ base: '16px', md: '24px' }}>
          {children}
        </Box>
      </PageCard>
    </Box>
  );
}
