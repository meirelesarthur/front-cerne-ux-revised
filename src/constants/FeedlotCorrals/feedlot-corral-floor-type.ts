// src/constants/FeedlotCorrals/feedlot-corral-floor-type.ts
// Enum `floor` do Curral — mirror `App\Enums\FloorType` (GB.Cerne.Api). A
// fábrica de opções fica em `options/feedlot-corral-floor-type-options.ts`.

export const feedlotCorralFloorType = {
  compactedDirt: 'TB',
  concreteFloor: 'CO',
  groovedConcrete: 'CR',
  gravelFloor: 'CB',
  stoneFloor: 'PE',
  sandFloor: 'AR',
  rubberFlooring: 'BO',
  deepBedding: 'CS',
  slattedFloor: 'PR',
} as const;

export type FeedlotCorralFloorTypeValue =
  (typeof feedlotCorralFloorType)[keyof typeof feedlotCorralFloorType];
