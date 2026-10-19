// src/constants/BaseRegistrations/options/tenant-boolean-options.ts
// -----------------------------------------------------------------------------
// Fábrica de opções Sim/Não (Achado C/bloco Quotas/Flags, `TASK-TN-FE-04`) —
// mirror `headband-type-options.ts`/`parameter-type-options.ts`: padrão
// canônico `getLabel`/`getOption`/`options`
// (get_pwa_constants_and_mappers_pattern §3.2), mensagens derivadas de
// `languageGB` (nunca hardcoded no componente). Sem factory global de
// booleano no projeto (confirmado por busca — o precedente mais próximo,
// `tenantParameters.form.booleanOptions.yes/no`, é só texto, sem fábrica de
// `Option<boolean>[]`) — criada aqui, escopada ao módulo Tenant.
//
// Consumida pelos 6 campos booleanos do formulário (`list_all_farms`,
// `uses_cash_book`, `export_xls`, `use_fiscal`, `generate_financial`,
// `generate_ticket`), `TASK-TN-FE-04`/`05`.
// -----------------------------------------------------------------------------

import type { LanguageDate } from '@/@types/language';
import { Option } from '@/@types/option';

const labels = (languageGB: LanguageDate): Map<boolean, string> => {
  const text = languageGB.baseRegistrations.tenant.form.booleanOptions;
  return new Map([
    [true, text.yes],
    [false, text.no],
  ]);
};

const getLabel = (value: boolean, languageGB: LanguageDate): string =>
  labels(languageGB).get(value)!;

const getOption = (value: boolean, languageGB: LanguageDate): Option<boolean> => ({
  label: getLabel(value, languageGB),
  value,
});

const options = (languageGB: LanguageDate): Option<boolean>[] =>
  Array.from(labels(languageGB)).map(([value, label]) => ({ label, value }));

export const tenantBooleanOptions = { getLabel, getOption, options };
