// src/constants/FeedlotCorrals/options/feedlot-corral-floor-type-options.ts
// Fábrica de opções do campo `floor` — padrão canônico `(languageGB) => Map`
// (get_pwa_constants_and_mappers_pattern §3.2).

import { feedlotCorralFloorType } from '@/constants/FeedlotCorrals/feedlot-corral-floor-type';

import type { LanguageDate } from '@/@types/language';
import type { Option } from '@/@types/option';

const labels = (languageGB: LanguageDate): Map<string, string> => {
  const text = languageGB.feedlotCorrals.feedlotCorral.enums.floor;
  return new Map([
    [feedlotCorralFloorType.compactedDirt, text.compactedDirt],
    [feedlotCorralFloorType.concreteFloor, text.concreteFloor],
    [feedlotCorralFloorType.groovedConcrete, text.groovedConcrete],
    [feedlotCorralFloorType.gravelFloor, text.gravelFloor],
    [feedlotCorralFloorType.stoneFloor, text.stoneFloor],
    [feedlotCorralFloorType.sandFloor, text.sandFloor],
    [feedlotCorralFloorType.rubberFlooring, text.rubberFlooring],
    [feedlotCorralFloorType.deepBedding, text.deepBedding],
    [feedlotCorralFloorType.slattedFloor, text.slattedFloor],
  ]);
};

const getLabel = (value: string, languageGB: LanguageDate): string =>
  labels(languageGB).get(value) ?? value;

const getOption = (value: string, languageGB: LanguageDate): Option<string> => ({
  label: getLabel(value, languageGB),
  value,
});

const options = (languageGB: LanguageDate): Option<string>[] =>
  Array.from(labels(languageGB)).map(([value, label]) => ({ label, value }));

export const feedlotCorralFloorTypeOptions = { getLabel, getOption, options };
