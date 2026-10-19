// src/pages/CadastrosBase/Fazendas/FarmFormShell.tsx
// Casca do wizard de Fazenda — COMPÕE o `FormContainer` padrão (header fixo
// 44px + X, body scrollável, footer fixo). O footer 3-partes (Voltar · Etapa ·
// Próximo/Salvar) entra no slot `footer`; o stepper + step atual entram como
// children (sem `<Form>` próprio da casca — o wizard traz o seu).

import { ReactNode } from 'react';

import { Box, Flex, Text } from '@chakra-ui/react';

import { FormContainer } from '@/components/Layout/FormContainer';

interface FarmFormShellProps {
  title: string;
  /** Contador de etapa (ex.: "Etapa 2 de 6"), centralizado no rodapé. */
  stepLabel?: string;
  /** Botão de navegar para trás (canto esquerdo do rodapé). */
  backAction?: ReactNode;
  /** Botão Próximo/Salvar (canto direito do rodapé). */
  nextAction?: ReactNode;
  children: ReactNode;
}

export function FarmFormShell({
  title,
  stepLabel,
  backAction,
  nextAction,
  children,
}: FarmFormShellProps) {
  return (
    <FormContainer
      title={title}
      footer={
        <Box
          width="full"
          display="grid"
          gridTemplateColumns="1fr auto 1fr"
          alignItems="center"
          gap={4}
        >
          <Flex justify="flex-start">{backAction}</Flex>
          <Text fontSize="sm" color="fg.muted" textAlign="center">
            {stepLabel}
          </Text>
          <Flex justify="flex-end">{nextAction}</Flex>
        </Box>
      }
    >
      {children}
    </FormContainer>
  );
}
