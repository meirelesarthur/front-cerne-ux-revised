// src/constants/cadastrosBase/provider/options/enabled-options.ts
// Fábrica de opções Sim/Não do campo "Ativo" do formulário de Fornecedor
// (UT-000773) — padrão canônico `(languageGB) => Map` + `getLabel`/`getOption`/
// `options` (get_pwa_constants_and_mappers_pattern §3.2). Distinto de
// `filter.enabledOptions` (Ativo/Inativo, semântica de filtro).

import type { LanguageDate } from '@/@types/language';
import { Option } from '@/@types/option';

const labels = (languageGB: LanguageDate): Map<boolean, string> =>
  new Map([
    [true, languageGB.providers.provider.form.enabledOptions.yes],
    [false, languageGB.providers.provider.form.enabledOptions.no],
  ]);

const getLabel = (value: boolean, languageGB: LanguageDate): string =>
  labels(languageGB).get(value)!;

const getOption = (value: boolean, languageGB: LanguageDate): Option<boolean> => ({
  label: getLabel(value, languageGB),
  value,
});

const options = (languageGB: LanguageDate): Option<boolean>[] =>
  Array.from(labels(languageGB)).map(([value, label]) => ({ label, value }));

export const enabledOptions = { getLabel, getOption, options };
