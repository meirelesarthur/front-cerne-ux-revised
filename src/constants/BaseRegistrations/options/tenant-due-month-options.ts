// src/constants/BaseRegistrations/options/tenant-due-month-options.ts
// -----------------------------------------------------------------------------
// Options factory do MÊS DE VENCIMENTO do filtro de Contratantes
// (TASK-072-FE-07, I10) — param `due_month` (1–12) do `GET /tenants`,
// equivalente ao `due_date2` do legado (`Tenant::opMonth()`). Mesmo padrão
// `getLabel`/`getOption`/`options` das fábricas vizinhas
// (`tenant-signature-options.ts`), rótulos em `tenant.filter.months.*`.
// -----------------------------------------------------------------------------

import type { LanguageDate } from '@/@types/language';
import type { Option } from '@/@types/option';
import type { TenantDueMonth } from '@/@types/v2/BaseRegistrations/tenant';

const labels = (languageGB: LanguageDate) => {
  const text = languageGB.baseRegistrations.tenant.filter.months;
  return new Map<TenantDueMonth, string>([
    [1, text.january],
    [2, text.february],
    [3, text.march],
    [4, text.april],
    [5, text.may],
    [6, text.june],
    [7, text.july],
    [8, text.august],
    [9, text.september],
    [10, text.october],
    [11, text.november],
    [12, text.december],
  ]);
};

const getLabel = (month: TenantDueMonth, languageGB: LanguageDate): string =>
  labels(languageGB).get(month)!;

const getOption = (month: TenantDueMonth, languageGB: LanguageDate): Option<TenantDueMonth> => ({
  label: getLabel(month, languageGB),
  value: month,
});

const options = (languageGB: LanguageDate): Option<TenantDueMonth>[] =>
  Array.from(labels(languageGB)).map(([key, value]) => ({
    label: value,
    value: key,
  }));

export const tenantDueMonthOptions = {
  getLabel,
  getOption,
  options,
};
