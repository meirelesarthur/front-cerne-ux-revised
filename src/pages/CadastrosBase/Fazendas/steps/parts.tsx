// src/pages/CadastrosBase/Fazendas/steps/parts.tsx
// -----------------------------------------------------------------------------
// Partes reutilizadas pelos 5 Steps do wizard de Fazenda — mirror de
// `Pessoas/steps/parts.tsx` (`StepProps`/`StepHeading`), adaptado ao form de
// Fazenda (`FarmFormType`, sem os blocos dinâmicos de papel de Pessoa).
//
// `StepHeading` agora é o `StepHeader` do kit (`@/components/ui/StepHeader`, fiel ao DS).
// -----------------------------------------------------------------------------

import type { FarmFormType } from '@/@types/v2/Farms/farm-admin';

import type { Control, FieldErrors, UseFormRegister } from 'react-hook-form';

export interface StepProps {
  control: Control<FarmFormType>;
  register: UseFormRegister<FarmFormType>;
  errors: FieldErrors<FarmFormType>;
  disabled?: boolean;
  loading?: boolean;
}

// Cabeçalho de etapa: componente do kit (DS StepHeader) — sem cópia local.
export { StepHeader as StepHeading } from '@/components/ui/StepHeader';
