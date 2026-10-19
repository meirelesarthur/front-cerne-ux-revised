// src/constants/cadastrosBase/provider/options/account-type-options.ts
// Fábrica de opções de `provider.account_type` (bloco bancário, aba
// "Conta") — STRING LIVRE no backend (`Rule::in(['C','P'])`,
// `ProviderRequest.php`, SEM enum PHP dedicado — mesma observação já
// registrada em `StepFuncionario.tsx::ACCOUNT_TYPE_OPTIONS` para
// `employee.account_type`). Mesmo padrão canônico de
// `provider-type-options.ts`/`pix-type-options.ts`
// (get_pwa_constants_and_mappers_pattern §3.2), TASK-PR-FE-04, mas sem
// arquivo de enum próprio (não há `App\Enums\...` a espelhar aqui).

import type { LanguageDate } from '@/@types/language';
import { Option } from '@/@types/option';

export type ProviderAccountType = 'C' | 'P';

const labels = (languageGB: LanguageDate): Map<ProviderAccountType, string> =>
  new Map([
    ['C', languageGB.providers.provider.accountTypeOptions.checking],
    ['P', languageGB.providers.provider.accountTypeOptions.savings],
  ]);

const getLabel = (value: ProviderAccountType, languageGB: LanguageDate): string =>
  labels(languageGB).get(value)!;

const getOption = (
  value: ProviderAccountType | null | undefined,
  languageGB: LanguageDate
): Option<ProviderAccountType> | null =>
  value == null ? null : { label: getLabel(value, languageGB), value };

const options = (languageGB: LanguageDate): Option<ProviderAccountType>[] =>
  Array.from(labels(languageGB)).map(([value, label]) => ({ label, value }));

export const accountTypeOptions = { getLabel, getOption, options };
