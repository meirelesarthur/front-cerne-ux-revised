// src/constants/FeedlotCorrals/options/feedlot-corral-coverage-type-options.ts
// Fábrica de opções do campo `coverage` — padrão canônico `(languageGB) => Map`
// (get_pwa_constants_and_mappers_pattern §3.2).

import { feedlotCorralCoverageType } from '@/constants/FeedlotCorrals/feedlot-corral-coverage-type';

import type { LanguageDate } from '@/@types/language';
import type { Option } from '@/@types/option';

const labels = (languageGB: LanguageDate): Map<string, string> => {
  const text = languageGB.feedlotCorrals.feedlotCorral.enums.coverage;
  return new Map([
    [feedlotCorralCoverageType.open, text.open],
    [feedlotCorralCoverageType.partiallyCovered, text.partiallyCovered],
    [feedlotCorralCoverageType.fullyCovered, text.fullyCovered],
    [feedlotCorralCoverageType.metalShed, text.metalShed],
    [feedlotCorralCoverageType.insulatedShed, text.insulatedShed],
    [feedlotCorralCoverageType.thermoacousticRoof, text.thermoacousticRoof],
    [feedlotCorralCoverageType.fiberCementRoof, text.fiberCementRoof],
    [feedlotCorralCoverageType.clayTileRoof, text.clayTileRoof],
    [feedlotCorralCoverageType.tensionedFabricRoof, text.tensionedFabricRoof],
    [feedlotCorralCoverageType.shadeNet, text.shadeNet],
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

export const feedlotCorralCoverageTypeOptions = { getLabel, getOption, options };
