// src/constants/BaseRegistrations/headband-type.ts
// -----------------------------------------------------------------------------
// Enum de negócio `type` da Testeira (Headband) — TASK-HB-FE-03. Mirror de
// `src/constants/Marker/marker-type.ts`. Espelha `HeadbandTypeSlug` ('c'|'p',
// `@/@types/v2/BaseRegistrations/headband`) — enviado/lido sempre como o
// SLUG cru definido pelo backend (`HeadbandTypeEnum`), nunca um índice
// numérico re-inventado no front.
// -----------------------------------------------------------------------------

import type { HeadbandTypeSlug } from '@/@types/v2/BaseRegistrations/headband';

export const headbandType = { central: 'c', partnerLogo: 'p' } as const satisfies Record<
  string,
  HeadbandTypeSlug
>;

export type HeadbandType = (typeof headbandType)[keyof typeof headbandType];
