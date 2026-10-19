// src/constants/marcacao/marking/marking-status.ts
// -----------------------------------------------------------------------------
// Enum espelho de `App\Enums\MarkingStatusEnum` (backend) — Marcado=1,
// Previsto=2, Realizado=3. Enum + `*Color` CO-LOCADOS neste arquivo (mirror
// `weaning-type.ts`, `get_pwa_constants_and_mappers_pattern §4`); a fábrica
// de opções (Map + getLabel/getOption/options) vive separada em
// `options/marking-status-options.ts`.
//
// `colorPalette` do Chakra v3 (nome de cor, ex.: "gray"/"yellow"/"green") —
// mirror EXATO do helper `MarkingStatusEnum::color()` do backend real
// (gray=Marcado, yellow=Previsto, green=Realizado).
// -----------------------------------------------------------------------------

export const markingStatus = {
  marcado: 1,
  previsto: 2,
  realizado: 3,
} as const;

export type MarkingStatusValue = (typeof markingStatus)[keyof typeof markingStatus];

// Badge de status na grid — mirror `MarkingStatusEnum::color()` real.
export const markingStatusColor: Record<MarkingStatusValue, string> = {
  [markingStatus.marcado]: 'gray',
  [markingStatus.previsto]: 'yellow',
  [markingStatus.realizado]: 'green',
};
