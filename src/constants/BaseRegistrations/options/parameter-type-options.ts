// src/constants/BaseRegistrations/options/parameter-type-options.ts
// -----------------------------------------------------------------------------
// Fábrica de opções do enum `type` (ParameterType) — execução 031,
// TASK-FE-031-40. Mirror exato de `headband-type-options.ts`: padrão canônico
// `(languageGB) => Map` + `getLabel`/`getOption`/`options`
// (get_pwa_constants_and_mappers_pattern §3.2) — NUNCA um array
// `Option<number>[]` inline no componente. As 3 opções são ESTÁTICAS (enum
// fechado do contrato de API §4) — sem chamada de rede, usadas no `Select` do
// formulário de criação/edição (TASK-FE-031-42). A coluna "Tipo" da grid usa
// `type_label`, já traduzido pela API (mirror do comentário de topo de
// `Headbands/index.tsx`).
// -----------------------------------------------------------------------------

import type { LanguageDate } from '@/@types/language';
import { Option } from '@/@types/option';

import { parameterType, ParameterType } from '../parameter-type';

const labels = (languageGB: LanguageDate): Map<ParameterType, string> =>
  new Map([
    [parameterType.alphanumeric, languageGB.parameters.parameter.type.alphanumeric],
    [parameterType.numeric, languageGB.parameters.parameter.type.numeric],
    [parameterType.logical, languageGB.parameters.parameter.type.logical],
  ]);

const getLabel = (value: ParameterType, languageGB: LanguageDate): string =>
  labels(languageGB).get(value)!;

const getOption = (value: ParameterType, languageGB: LanguageDate): Option<ParameterType> => ({
  label: getLabel(value, languageGB),
  value,
});

const options = (languageGB: LanguageDate): Option<ParameterType>[] =>
  Array.from(labels(languageGB)).map(([value, label]) => ({ label, value }));

export const parameterTypeOptions = { getLabel, getOption, options };
