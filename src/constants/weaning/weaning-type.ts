// src/constants/weaning/weaning-type.ts
// -----------------------------------------------------------------------------
// Enum espelho de `App\Enums\WeaningTypeEnum` (backend) — Recria=1, Venda=2.
// Enum + `*Color` CO-LOCADOS neste arquivo (mirror `batch-status.ts`,
// `get_pwa_constants_and_mappers_pattern §4`); a fábrica de opções (Map +
// getLabel/getOption/options) vive separada em `options/weaning-type-options.ts`.
//
// `colorPalette` do Chakra v3 (nome de cor, ex.: "blue"/"green") — mirror
// real observado em `batch-status.ts`/`diet-columns.tsx`, NÃO o token
// `.500` genérico sugerido por tooling padrão.
// -----------------------------------------------------------------------------

export const weaningType = {
  recria: 1,
  venda: 2,
} as const;

export type WeaningTypeValue = (typeof weaningType)[keyof typeof weaningType];

// Badge de tipo na grid — estética, sem regra de negócio.
export const weaningTypeColor: Record<WeaningTypeValue, string> = {
  [weaningType.recria]: 'blue',
  [weaningType.venda]: 'green',
};
