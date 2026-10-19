// src/constants/financial/movement/movement-status.ts
// Enums client-side dos campos `type`/`type_category` de Movimento
// Caixa/Bancário (Movement — Financeiro, TASK-MV-FE-01). Mirror PARCIAL do
// backend `App\Enums\MovementType`/`MovementTypeCategory`
// (Movement-contrato.md §2, campos #3/#4) — esta tela expõe SOMENTE o
// subconjunto aceito pelo formulário create/edit/rateio (Decisão #4 do
// contrato de API §8, mirror do form legado que faz `array_slice` no enum
// completo do backend):
//   - `type`: só `E`(ntrada)/`S`(aída) — `A`/`M`/`T`/`F` do enum completo do
//     backend não fazem sentido neste campo especificamente.
//   - `type_category`: só `E`/`S`/`T`(ransferência)/`F`(inanciamento) — `I`
//     (Saldo Inicial) é tratado por outro endpoint dedicado
//     (`OpenMovementController`, fatia "Saldo Inicial") e nunca aceito aqui.
// Mirror estrutural de `cadastrosBase/account/account-status.ts` (co-loca
// enum + fábrica de opções + mapa de cor no mesmo arquivo).

export type MovementTypeCode = 'E' | 'S';
export const MOVEMENT_TYPES: MovementTypeCode[] = ['E', 'S'];

export type MovementTypeCategoryCode = 'E' | 'S' | 'T' | 'F';
export const MOVEMENT_TYPE_CATEGORIES: MovementTypeCategoryCode[] = ['E', 'S', 'T', 'F'];

// Badge de Tipo na grid — estética, sem regra de negócio (sugestão do dev,
// revisável sem gate, mirror `accountTypeColor`).
export const movementTypeColor: Record<MovementTypeCode, string> = {
  E: 'green',
  S: 'red',
};

export const movementTypeCategoryColor: Record<MovementTypeCategoryCode, string> = {
  E: 'green',
  S: 'red',
  T: 'blue',
  F: 'purple',
};
