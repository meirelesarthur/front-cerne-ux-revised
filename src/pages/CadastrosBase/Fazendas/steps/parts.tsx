// src/pages/CadastrosBase/Fazendas/steps/parts.tsx
// -----------------------------------------------------------------------------
// Partes reutilizadas pelos 5 Steps do wizard de Fazenda — mirror de
// `Pessoas/steps/parts.tsx` (`StepProps`/`StepHeading`), adaptado ao form de
// Fazenda (`FarmFormType`, sem os blocos dinâmicos de papel de Pessoa).
//
// `StepHeading` é uma cópia LOCAL (não o componente global `ui/steps.tsx`) —
// restilizada na execução 024 (`TASK-FE-406`) fiel ao `StepHeader.tsx` do
// `cerne`: hierarquia maior (`2xl`/bold), centralizada, com subtítulo também
// centralizado. Sem efeito colateral em Pessoas ou qualquer outra tela — cada
// módulo tem sua própria cópia deste componente.
// -----------------------------------------------------------------------------

import { Box, Heading, Text } from '@chakra-ui/react';

import type { FarmFormType } from '@/@types/v2/Farms/farm-admin';

import type { Control, FieldErrors, UseFormRegister } from 'react-hook-form';

export interface StepProps {
  control: Control<FarmFormType>;
  register: UseFormRegister<FarmFormType>;
  errors: FieldErrors<FarmFormType>;
  disabled?: boolean;
  loading?: boolean;
}

export function StepHeading({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <Box mb={8} textAlign="center">
      <Heading size="2xl" fontWeight="bold" color="fg.default" mb={subtitle ? 2 : 0}>
        {title}
      </Heading>
      {subtitle && (
        <Text fontSize="md" color="fg.muted">
          {subtitle}
        </Text>
      )}
    </Box>
  );
}
