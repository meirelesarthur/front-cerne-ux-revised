// src/pages/CadastrosBase/Pessoas/steps/parts.tsx
// -----------------------------------------------------------------------------
// Partes reutilizadas pelos 7 Steps do wizard de Pessoa — props comuns
// (mirror do `StepProps` da Referência UX, adaptado a React Hook Form real:
// `control`/`register`/`errors` em vez de `form`/`set`/`setRole`) + pequenos
// helpers visuais (`StepHeading`/`SectionLabel`) que o catálogo real do
// projeto não tem como primitiva própria (não existe `StepHeader`/
// `FormSection` em `@/components`) — compostos aqui com `Heading`/`Text`
// (Chakra) já usados em todo o projeto, não uma reimplementação de
// primitiva de catálogo (Regra A do design system aplicada ao protótipo não
// se aplica 1:1 aqui — este projeto real não tem essas primitivas ainda).
// -----------------------------------------------------------------------------

import type { ReactNode } from 'react';

import { Text } from '@chakra-ui/react';

import type { PessoaFormValues } from '../pessoa.types';
import type { Control, FieldErrors, UseFormRegister } from 'react-hook-form';

export interface StepProps {
  control: Control<PessoaFormValues>;
  register: UseFormRegister<PessoaFormValues>;
  errors: FieldErrors<PessoaFormValues>;
  disabled?: boolean;
}

// Cabeçalho de etapa: componente do kit (DS StepHeader) — sem cópia local.
export { StepHeader as StepHeading } from '@/components/ui/StepHeader';

export function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <Text
      fontSize="xs"
      fontWeight="bold"
      color="fg.muted"
      textTransform="uppercase"
      letterSpacing="0.06em"
      mb={2}
    >
      {children}
    </Text>
  );
}
