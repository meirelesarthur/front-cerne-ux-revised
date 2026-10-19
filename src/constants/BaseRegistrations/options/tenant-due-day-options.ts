// src/constants/BaseRegistrations/options/tenant-due-day-options.ts
// -----------------------------------------------------------------------------
// Options factory do DIA DE VENCIMENTO de Contratante (Tenant) — mesmo
// padrão canônico `getLabel`/`getOption`/`options`
// (get_pwa_constants_and_mappers_pattern §3.2). `TenantDueDay` é um enum
// FECHADO de 3 valores numéricos (5/10/15, mirror `Tenant::opDueDays()`
// legado) — o rótulo é o próprio número prefixado por uma palavra traduzida
// ("Dia 5"/"Day 5"/"Día 5"), NUNCA hardcoded no componente. Consumida pelo
// formulário (`TASK-TN-FE-03/04`, campo `due_day`) — sem tela nesta leva
// (TASK-TN-FE-01/02), fundação de dados.
// -----------------------------------------------------------------------------

import type { LanguageDate } from '@/@types/language';
import type { Option } from '@/@types/option';
import type { TenantDueDay } from '@/@types/v2/BaseRegistrations/tenant';

const VALUES: TenantDueDay[] = [5, 10, 15];

const getLabel = (dueDay: TenantDueDay, languageGB: LanguageDate): string =>
  `${languageGB.baseRegistrations.tenant.dueDay.dayPrefix} ${dueDay}`;

const getOption = (dueDay: TenantDueDay, languageGB: LanguageDate): Option<TenantDueDay> => ({
  label: getLabel(dueDay, languageGB),
  value: dueDay,
});

const options = (languageGB: LanguageDate): Option<TenantDueDay>[] =>
  VALUES.map((value) => getOption(value, languageGB));

export const tenantDueDayOptions = {
  getLabel,
  getOption,
  options,
};
