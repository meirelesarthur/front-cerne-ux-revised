// src/components/Form/ViewField.tsx
// -----------------------------------------------------------------------------
// Variante de VISUALIZAÇÃO (tela de detalhe) — adaptação do design system
// `cerne` para Chakra UI v3 + tokens desta SPA. Referência:
// `GB.Cerne.UX/src/components/ui/FormField.tsx:311-485` (variante `ViewField`)
// + `GB.Cerne.UX/src/components/ui/DetailGrid.tsx`. Contrato visual
// reproduzido: caixa com fundo sutil + borda sutil, rótulo em UPPERCASE `xs`
// dentro da caixa, valor abaixo, `—` para valor vazio.
//
// Divergência deliberada da Referência UX (adaptação, não cópia — esteira
// 061, decisão do dono): SEM o botão "copiar" no hover. As duas telas que
// consomem este componente (Centro de Custo, Saldo Inicial) foram reprovadas
// em DESIGN sem esse pedido; escopo da correção não inclui esse recurso.
//
// Tokens: `bg.muted` + `border.subtle` — não `bg.subtle` + `border.subtle`
// (par literal da Referência UX). No tema Chakra default desta SPA
// (`src/theme.ts`), `bg.subtle` e `border.subtle` resolvem para o MESMO
// valor (`gray.50` claro / `gray.950` escuro), o que tornaria a borda
// invisível. O par `bg.muted` + `border.subtle` já é usado neste mesmo
// repositório (`DetalheCentroCusto.tsx`, painel `DetailPanel`, anterior a
// esta tarefa) e preserva o efeito pretendido — caixa sutil com contorno
// perceptível — nos dois temas.
//
// Diferente de `InputReadOnly` (campo DERIVADO dentro de um formulário
// editável, aparência "desabilitado", usa `Field`/`Skeleton`/`register`):
// este componente é para telas de DETALHE somente-leitura, sem `useForm`.
// -----------------------------------------------------------------------------
import type { ReactNode } from 'react';

import { Box, Text } from '@chakra-ui/react';

export interface ViewFieldProps {
  /** Rótulo do campo — renderizado em uppercase, `xs`, dentro da caixa. */
  label?: string;
  /** Valor a exibir. `undefined`/`null`/`''` viram `—` automaticamente. */
  value?: ReactNode;
}

function hasValue(value: ReactNode): boolean {
  return value !== undefined && value !== null && value !== '';
}

export function ViewField({ label, value }: ViewFieldProps) {
  return (
    <Box
      bg="bg.muted"
      border="1px solid"
      borderColor="border.subtle"
      borderRadius="md"
      px={4}
      py={3}
    >
      {label && (
        <Text
          fontSize="xs"
          fontWeight="semibold"
          color="fg.subtle"
          textTransform="uppercase"
          letterSpacing="wide"
          mb={1}
        >
          {label}
        </Text>
      )}
      <Text fontSize="sm" color="fg.default">
        {hasValue(value) ? value : '—'}
      </Text>
    </Box>
  );
}
