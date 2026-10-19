// src/constants/BaseRegistrations/parameter-type.ts
// -----------------------------------------------------------------------------
// Enum de negócio `type` de Parâmetro (Parameter) — execução 031,
// TASK-FE-031-40. Mirror de `headband-type.ts`: espelha `ParameterTypeValue`
// (1|2|3, `@/@types/v2/BaseRegistrations/Parameters`) — enviado/lido sempre
// como o INT cru definido pelo backend (`ParameterTypeEnum` PHP, contrato de
// API §4), nunca um slug/string re-inventado no front.
// -----------------------------------------------------------------------------

import type { ParameterTypeValue } from '@/@types/v2/BaseRegistrations/Parameters';

export const parameterType = {
  alphanumeric: 1,
  numeric: 2,
  logical: 3,
} as const satisfies Record<string, ParameterTypeValue>;

export type ParameterType = (typeof parameterType)[keyof typeof parameterType];
