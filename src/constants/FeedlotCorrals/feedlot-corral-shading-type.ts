// src/constants/FeedlotCorrals/feedlot-corral-shading-type.ts
// Enum `shading` do Curral — mirror `App\Enums\ShadingType` (GB.Cerne.Api).
// A fábrica de opções fica em
// `options/feedlot-corral-shading-type-options.ts`.

export const feedlotCorralShadingType = {
  natural: 'NA',
  artificial: 'AR',
  none: 'NP',
} as const;

export type FeedlotCorralShadingTypeValue =
  (typeof feedlotCorralShadingType)[keyof typeof feedlotCorralShadingType];
