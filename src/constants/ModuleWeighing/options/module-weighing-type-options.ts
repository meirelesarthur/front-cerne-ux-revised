// src/constants/ModuleWeighing/options/module-weighing-type-options.ts
// Fábrica de opções do enum `type` (ModuleWeighingType) — padrão canônico
// `(languageGB) => Map` + `getLabel`/`getOption`/`options`
// (get_pwa_constants_and_mappers_pattern §3.2). Usada na coluna LM-007
// (`getLabel`) e reaproveitada pelas condicionais de tipo do form/wizard
// (Tarefas 03/05/07).

import type { LanguageDate } from '@/@types/language';
import type { Option } from '@/@types/option';
import type { ModuleWeighingType } from '@/@types/v2/ModuleWeighing/module-weighing';

import { moduleWeighingType } from '../module-weighing-type';

const labels = (languageGB: LanguageDate): Map<ModuleWeighingType, string> => {
  const text = languageGB.moduleWeighing.moduleWeighing.common.type;
  return new Map([
    [moduleWeighingType.vendaSaida, text.vendaSaida],
    [moduleWeighingType.compraEntrada, text.compraEntrada],
    [moduleWeighingType.avulsa, text.avulsa],
    [moduleWeighingType.entradaColheita, text.entradaColheita],
    [moduleWeighingType.entradaTerceiros, text.entradaTerceiros],
  ]);
};

const getLabel = (value: ModuleWeighingType, languageGB: LanguageDate): string =>
  labels(languageGB).get(value)!;

const getOption = (
  value: ModuleWeighingType,
  languageGB: LanguageDate
): Option<ModuleWeighingType> => ({
  label: getLabel(value, languageGB),
  value,
});

const options = (languageGB: LanguageDate): Option<ModuleWeighingType>[] =>
  Array.from(labels(languageGB)).map(([value, label]) => ({ label, value }));

export const moduleWeighingTypeOptions = { getLabel, getOption, options };
