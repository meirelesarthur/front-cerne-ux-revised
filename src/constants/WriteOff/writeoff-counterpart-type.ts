// src/constants/WriteOff/writeoff-counterpart-type.ts
// -----------------------------------------------------------------------------
// Universo de `writeoff_type` (contrapartida da baixa INDIVIDUAL) POR
// SEGMENTO — mirror 1:1 `App\Enums\WriteOffCounterpartType::availableForExpenses()`/
// `availableForIncomes()` (TASK-036-GB-07/08, HANDSHAKE-front-baixa-tipos-completo.md
// §2). Fonte de verdade ÚNICA — consumida tanto pela fábrica de opções
// (`options/writeoff-counterpart-type-options.ts`, rótulos i18n) quanto pelo
// schema Yup (`writeoff-schema.ts`, `oneOf` por segmento) — nunca duplicar o
// array em outro lugar.
//
// `D`/`I`/`C` só em `expenses` (CaP); `E` só em `incomes` (CaR); `M`/`B` nos
// 2 segmentos. NÃO confundir com `WriteoffType` do LOTE (`'M'` Separado/`'U'`
// Único, campo `writeoff_type` DIFERENTE do `WriteOffBatchForm`).
// -----------------------------------------------------------------------------

import type { WriteOffCounterpartType, WriteOffSegment } from '@/@types/v2/WriteOff';

export const WRITEOFF_COUNTERPART_TYPES_BY_SEGMENT: Record<
  WriteOffSegment,
  WriteOffCounterpartType[]
> = {
  expenses: ['M', 'B', 'D', 'I', 'C'],
  incomes: ['M', 'B', 'E'],
};
