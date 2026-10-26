// src/components/ui/StepBody.tsx
// Corpo de uma etapa de wizard (DS): conteúdo centralizado, largura máxima 760px.
// Fonte única — as etapas não repetem `maxW`/`mx`.

import type { ReactNode } from 'react';

import { Box } from '@chakra-ui/react';

export function StepBody({ children }: { children: ReactNode }) {
  return (
    <Box maxW="760px" mx="auto">
      {children}
    </Box>
  );
}

export default StepBody;
