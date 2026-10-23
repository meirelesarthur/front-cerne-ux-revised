// src/components/ui/FormSurface.tsx
// Superfície de formulário que pode ser MODAL (`dialog`, o `CustomDialog` de sempre) ou PAINEL
// inline (`panel`): mesmo conteúdo e mesmo rodapé de ações, só muda o continente. Permite
// migrar fluxos de modal para o painel mestre–detalhe sem duplicar a lógica do formulário.
// No painel, o rodapé fica fixo na base da área rolável (sticky) e a ação "cancelar" do
// chamador volta ao estado anterior do painel.

import type { ComponentProps, ReactNode } from 'react';

import { Box, Flex } from '@chakra-ui/react';

import { CustomDialog } from '@/components/CustomDialog';

export type FormSurfaceVariant = 'dialog' | 'panel';

export interface FormSurfaceProps extends Omit<ComponentProps<typeof CustomDialog>, 'children' | 'footer'> {
  variant?: FormSurfaceVariant;
  footer?: ReactNode;
  children: ReactNode;
}

export function FormSurface({ variant = 'dialog', footer, children, ...dialogProps }: FormSurfaceProps) {
  if (variant === 'dialog') {
    return (
      <CustomDialog {...dialogProps} footer={footer}>
        {children}
      </CustomDialog>
    );
  }

  if (!dialogProps.isOpen) return null;

  return (
    <Flex direction="column" minH={0}>
      <Box>
        {children}
      </Box>
      {footer && (
        <Flex
          position="sticky"
          bottom={0}
          zIndex={1}
          justify="flex-end"
          align="center"
          gap="8px"
          py="12px"
          bg="cardBG"
          borderTopWidth="1px"
          borderColor="border.muted"
        >
          {footer}
        </Flex>
      )}
    </Flex>
  );
}

export default FormSurface;
