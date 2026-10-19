// src/constants/Users/options/tenant-status-options.ts
// Fábrica de opções do filtro `tenant_status` de User (contrato §1.5/§3.5,
// exclusivo da visão `Gestor_Plataf`) — mesmos 4 valores do enum
// `App\Enums\TenantStatus` (api_root): ACTIVE=1, DEFAULTING=2, SUSPENDED=3,
// CANCELLED=4. NÃO inventar um 5º valor nem reordenar (mandato explícito da
// Tarefa). Mirror do padrão canônico `(languageGB) => Map` +
// `getLabel`/`getOption`/`options` de `markerTypeOptions`.

import type { LanguageDate } from '@/@types/language';
import { Option } from '@/@types/option';

import { tenantStatus, TenantStatus } from '../tenant-status';

const labels = (languageGB: LanguageDate): Map<TenantStatus, string> => {
  const text = languageGB.users.user.filter.tenantStatusOptions;
  return new Map([
    [tenantStatus.active, text.active],
    [tenantStatus.defaulting, text.defaulting],
    [tenantStatus.suspended, text.suspended],
    [tenantStatus.cancelled, text.cancelled],
  ]);
};

const getLabel = (value: TenantStatus, languageGB: LanguageDate): string =>
  labels(languageGB).get(value)!;

const getOption = (value: TenantStatus, languageGB: LanguageDate): Option<TenantStatus> => ({
  label: getLabel(value, languageGB),
  value,
});

const options = (languageGB: LanguageDate): Option<TenantStatus>[] =>
  Array.from(labels(languageGB)).map(([value, label]) => ({ label, value }));

export const tenantStatusOptions = { getLabel, getOption, options };
