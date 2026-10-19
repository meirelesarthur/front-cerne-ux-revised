// src/components/ClassificationBadge.tsx
// -----------------------------------------------------------------------------
// Badge de CLASSIFICAÇÃO/TAXONOMIA de domínio (categoria nomeada — ex.: evento
// de manifestação SEFAZ da Dfe), NUNCA resultado de ação (isso é
// `feedBack.*`/`colorPalette` de sucesso-erro-aviso). Primeiro consumidor:
// `Fiscal/Dfe/index.tsx` (TASK-DFE-FE-05, `dfeManifestEventColor` →
// `ClassificationSlot`).
//
// Gap fechado (`src/constants/Fiscal/dfe/dfe-manifest-event.ts`, LACUNA
// REGISTRADA): os tokens `classification.slot1..slot8`/`neutral`
// (`src/styles/theme/semantic/{light,dark}.ts`) e este componente NÃO
// existiam até esta Tarefa — nenhum módulo anterior precisou de badge de
// categoria. Criado seguindo o MESMO padrão de cor semântica já em uso
// (`statCard.*`/`permissionActive.*`: par bg/fg + borda opcional, tema
// light+dark), adaptação do design system `cerne`, não invenção de paleta.
// -----------------------------------------------------------------------------

import type { ReactNode } from 'react';

import { Badge, type BadgeProps } from '@chakra-ui/react';

import type { ClassificationSlot } from '@/constants/Fiscal/dfe/dfe-manifest-event';

export interface ClassificationBadgeProps extends Omit<BadgeProps, 'bg' | 'color' | 'children'> {
  slot: ClassificationSlot;
  children: ReactNode;
}

export function ClassificationBadge({ slot, children, ...rest }: ClassificationBadgeProps) {
  return (
    <Badge
      bg={`classification.${slot}.bg`}
      color={`classification.${slot}.fg`}
      borderWidth="1px"
      borderColor={`classification.${slot}.border`}
      borderRadius="full"
      px={3}
      py={1}
      fontWeight="medium"
      {...rest}
    >
      {children}
    </Badge>
  );
}
