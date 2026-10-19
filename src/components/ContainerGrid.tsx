// src/components/ContainerGrid.tsx
// Casca das telas de LISTAGEM (fonte única, Lei 2 do `cerne`). Compõe
// `PageCard` e monta a cadeia flex-column bounded: o content box preenche o
// card e entrega `flex:1; minH:0` ao seu ÚLTIMO filho de fluxo (o bloco da
// grid) — o título (1º filho) fica na altura natural e a grid vira a única
// região com scroll interno. Sem tocar telas: o header é sempre o 1º filho e
// os overlays (Drawer/Dialog) saem por portal, então `:last-child` é o bloco
// da grid.

import { ReactNode, forwardRef } from 'react';

import { Box, useMediaQuery } from '@chakra-ui/react';

import { PageCard } from './ui/PageCard';

interface ContainerProps {
  children: ReactNode;
  form?: boolean;
}

export const ContainerGrid = forwardRef<HTMLDivElement, ContainerProps>(
  ({ children, form }, ref) => {
    const [isMobile] = useMediaQuery(['(max-width: 850px)']);

    // Telas de formulário usam `FormContainer` (casca própria) — aqui só o markup bare.
    if (form) {
      return (
        <Box
          ref={ref}
          width="full"
          height="fit-content"
          paddingX="0"
          paddingTop="8"
          flexFlow="wrap"
        >
          {children}
        </Box>
      );
    }

    return (
      <Box ref={ref} width="full" height="100%" padding="2">
        <PageCard fullHeight>
          <Box
            display="flex"
            flexDirection="column"
            flex="1"
            minH={0}
            paddingX={isMobile ? '4' : '6'}
            paddingTop="6"
            paddingBottom={isMobile ? '4' : '6'}
            css={{
              '& > :last-child': {
                flex: '0 1 auto',
                minHeight: 0,
                display: 'flex',
                flexDirection: 'column',
              },
              '& > :last-child > :last-child': {
                flex: '0 1 auto',
                minHeight: 0,
              },
            }}
          >
            {children}
          </Box>
        </PageCard>
      </Box>
    );
  }
);
