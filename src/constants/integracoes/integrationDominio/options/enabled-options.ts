// src/constants/integracoes/integrationDominio/options/enabled-options.ts
// Fábrica de opções do campo `is_enabled` ("Ativo" — Software Domínio,
// IntegrationDominio, F-121). Governa o `Select` estático do form (§8-B do
// contrato de tela: `Select {Sim/Não}` via fábrica, NUNCA `ToggleSwitch`,
// severidade INVIOLÁVEL). Mirror `eligible-options.ts`. Ordem Sim→Não;
// default create = `getOption(true)`.

import { integrationDominioEnabled } from '@/constants/integracoes/integrationDominio/enums';

import type { LanguageDate } from '@/@types/language';
import type { Option } from '@/@types/option';

const labels = (languageGB: LanguageDate): Map<boolean, string> => {
  const text = languageGB.integrationDominios.form.enabled;
  return new Map([
    [integrationDominioEnabled.sim, text.sim],
    [integrationDominioEnabled.nao, text.nao],
  ]);
};

const getLabel = (value: boolean, languageGB: LanguageDate): string =>
  labels(languageGB).get(value)!;

const getOption = (value: boolean, languageGB: LanguageDate): Option<boolean> => ({
  label: getLabel(value, languageGB),
  value,
});

const options = (languageGB: LanguageDate): Option<boolean>[] =>
  Array.from(labels(languageGB)).map(([value, label]) => ({ value, label }));

export const integrationDominioEnabledOptions = { getLabel, getOption, options };
