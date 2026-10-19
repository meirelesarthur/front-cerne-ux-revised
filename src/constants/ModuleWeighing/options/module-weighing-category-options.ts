// src/constants/ModuleWeighing/options/module-weighing-category-options.ts
// Fábrica de opções do enum `category` (ModuleWeighingCategory) — padrão
// canônico `(languageGB) => Map` + `getLabel`/`getOption`/`options`
// (get_pwa_constants_and_mappers_pattern §3.2). Usada na coluna LM-008
// (`getLabel`) e reaproveitada pela condicional `client_uuid` obrigatório
// (`category=Externa`, form/schema da Tarefa 03).

import type { LanguageDate } from '@/@types/language';
import type { Option } from '@/@types/option';
import type { ModuleWeighingCategory } from '@/@types/v2/ModuleWeighing/module-weighing';

import { moduleWeighingCategory } from '../module-weighing-category';

const labels = (languageGB: LanguageDate): Map<ModuleWeighingCategory, string> => {
  const text = languageGB.moduleWeighing.moduleWeighing.common.category;
  return new Map([
    [moduleWeighingCategory.externa, text.externa],
    [moduleWeighingCategory.interna, text.interna],
  ]);
};

const getLabel = (value: ModuleWeighingCategory, languageGB: LanguageDate): string =>
  labels(languageGB).get(value)!;

const getOption = (
  value: ModuleWeighingCategory,
  languageGB: LanguageDate
): Option<ModuleWeighingCategory> => ({
  label: getLabel(value, languageGB),
  value,
});

const options = (languageGB: LanguageDate): Option<ModuleWeighingCategory>[] =>
  Array.from(labels(languageGB)).map(([value, label]) => ({ label, value }));

export const moduleWeighingCategoryOptions = { getLabel, getOption, options };
