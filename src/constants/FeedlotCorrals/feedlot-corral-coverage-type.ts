// src/constants/FeedlotCorrals/feedlot-corral-coverage-type.ts
// Enum `coverage` do Curral — mirror `App\Enums\CoverageType` (GB.Cerne.Api).
// A fábrica de opções fica em
// `options/feedlot-corral-coverage-type-options.ts`.

export const feedlotCorralCoverageType = {
  open: 'AB',
  partiallyCovered: 'CT',
  fullyCovered: 'CP',
  metalShed: 'GM',
  insulatedShed: 'GI',
  thermoacousticRoof: 'GT',
  fiberCementRoof: 'FI',
  clayTileRoof: 'CE',
  tensionedFabricRoof: 'LT',
  shadeNet: 'SO',
} as const;

export type FeedlotCorralCoverageTypeValue =
  (typeof feedlotCorralCoverageType)[keyof typeof feedlotCorralCoverageType];
