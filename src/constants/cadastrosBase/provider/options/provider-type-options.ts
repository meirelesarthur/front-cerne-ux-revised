// src/constants/cadastrosBase/provider/options/provider-type-options.ts
// Fábrica de opções do enum `type` (ProviderTypeEnum) — padrão canônico
// `(languageGB) => Map` + `getLabel`/`getOption`/`options`
// (get_pwa_constants_and_mappers_pattern §3.2).

import type { LanguageDate } from '@/@types/language';
import { Option } from '@/@types/option';

import { providerType, ProviderType } from '../provider-type';

const labels = (languageGB: LanguageDate): Map<ProviderType, string> =>
  new Map([
    [providerType.fornecedor, languageGB.providers.provider.typeOptions.fornecedor],
    [providerType.funcionario, languageGB.providers.provider.typeOptions.funcionario],
    [providerType.terceirizado, languageGB.providers.provider.typeOptions.terceirizado],
    [providerType.transportador, languageGB.providers.provider.typeOptions.transportador],
    [providerType.comissionado, languageGB.providers.provider.typeOptions.comissionado],
    [providerType.inseminador, languageGB.providers.provider.typeOptions.inseminador],
  ]);

const getLabel = (value: ProviderType, languageGB: LanguageDate): string =>
  labels(languageGB).get(value)!;

const getOption = (value: ProviderType, languageGB: LanguageDate): Option<ProviderType> => ({
  label: getLabel(value, languageGB),
  value,
});

const options = (languageGB: LanguageDate): Option<ProviderType>[] =>
  Array.from(labels(languageGB)).map(([value, label]) => ({ label, value }));

export const providerTypeOptions = { getLabel, getOption, options };
