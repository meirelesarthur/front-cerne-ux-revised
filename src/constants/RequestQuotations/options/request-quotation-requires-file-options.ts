// src/constants/RequestQuotations/options/request-quotation-requires-file-options.ts
// Fábrica de opções do campo booleano `requires_file` (FIELD-03, widget
// "select (Sim/Não)" — Dialog Criar/Editar Cotação, TASK-CQ-FE-04). Mesmo
// padrão canônico `(languageGB) => Map` + `getLabel`/`getOption`/`options`,
// valor nativo `boolean` (não `'true'|'string'`) — mirror `tenantBooleanOptions`
// (`src/constants/BaseRegistrations/options/tenant-boolean-options.ts`), único
// precedente real de campo booleano exposto como Select no fork.

import type { LanguageDate } from '@/@types/language';
import type { Option } from '@/@types/option';

const labels = (languageGB: LanguageDate): Map<boolean, string> => {
  const text = languageGB.requestQuotations.requestQuotation.form.requiresFileOptions;
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

export const requestQuotationRequiresFileOptions = { getLabel, getOption, options };
