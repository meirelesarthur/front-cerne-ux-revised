// src/constants/BaseRegistrations/options/tenant-status-options.ts
// -----------------------------------------------------------------------------
// Options factory do STATUS de Contratante (Tenant) — mesmo padrão de
// `constants/afiliados/partner/options/partner-status-options.ts`
// (`getLabel`/`getOption`/`options`, mensagens derivadas de `languageGB`,
// nunca hardcoded). Mapa de cor do Badge (`tenantStatusBadgeVariant`)
// CO-LOCADO aqui (Lei 6 — nunca cor inline em componente).
//
// Enum `TenantStatus` backed (DA-T04, Tenant-contrato.md): 1=ACTIVE,
// 2=DEFAULTING, 3=SUSPENDED, 4=CANCELLED. Usado pela grid (`TASK-TN-FE-02`,
// coluna Status) e pelo filtro (Select estático, sem chamada de rede) — e
// depois pelo formulário (`TASK-TN-FE-03/04`).
// -----------------------------------------------------------------------------

import type { LanguageDate } from '@/@types/language';
import type { Option } from '@/@types/option';
import type { TenantStatus } from '@/@types/v2/BaseRegistrations/tenant';

const labels = (languageGB: LanguageDate) => {
  const text = languageGB.baseRegistrations.tenant.status;
  return new Map<TenantStatus, string>([
    [1, text.active],
    [2, text.defaulting],
    [3, text.suspended],
    [4, text.cancelled],
  ]);
};

const getLabel = (status: TenantStatus, languageGB: LanguageDate): string =>
  labels(languageGB).get(status)!;

const getOption = (status: TenantStatus, languageGB: LanguageDate): Option<TenantStatus> => ({
  label: getLabel(status, languageGB),
  value: status,
});

const options = (languageGB: LanguageDate): Option<TenantStatus>[] =>
  Array.from(labels(languageGB)).map(([key, value]) => ({
    label: value,
    value: key,
  }));

export const tenantStatusOptions = {
  getLabel,
  getOption,
  options,
};

/** Mapa de `colorPalette` do Badge da coluna Status (mirror Chakra `colorPalette`). */
export const tenantStatusBadgeVariant: Record<TenantStatus, string> = {
  1: 'green',
  2: 'yellow',
  3: 'orange',
  4: 'red',
};
