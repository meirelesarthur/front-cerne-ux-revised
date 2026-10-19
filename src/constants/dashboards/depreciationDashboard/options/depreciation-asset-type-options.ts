// src/constants/dashboards/depreciationDashboard/options/depreciation-asset-type-options.ts
// Fábrica de opções do filtro Tipo de ativo (`CONTRATO-API-048-02 §2`) —
// mirror do padrão canônico `assetsOpStatusOptions`.

import type { LanguageDate } from '@/@types/language';
import type { Option } from '@/@types/option';
import type { DepreciationAssetType } from '@/@types/v2/Dashboards/depreciationDashboard';

const labels = (languageGB: LanguageDate): Map<DepreciationAssetType, string> => {
  const text = languageGB.dashboards.depreciationDashboard.filter.assetTypeOptions;
  return new Map([
    ['all', text.all],
    ['equipment', text.equipment],
    ['animal', text.animal],
  ]);
};

const getLabel = (value: DepreciationAssetType, languageGB: LanguageDate): string =>
  labels(languageGB).get(value) ?? value;

const getOption = (
  value: DepreciationAssetType,
  languageGB: LanguageDate
): Option<DepreciationAssetType> => ({
  label: getLabel(value, languageGB),
  value,
});

const options = (languageGB: LanguageDate): Option<DepreciationAssetType>[] =>
  Array.from(labels(languageGB)).map(([value, label]) => ({ label, value }));

export const depreciationAssetTypeOptions = { getLabel, getOption, options };
