// src/constants/BaseRegistrations/options/tenant-signature-options.ts
// -----------------------------------------------------------------------------
// Options factory da ASSINATURA (periodicidade do plano) de Contratante
// (Tenant) — mesmo padrão canônico `getLabel`/`getOption`/`options`
// (get_pwa_constants_and_mappers_pattern §3.2), mensagens derivadas de
// `languageGB`, nunca hardcoded. Consumida pelo formulário
// (`TASK-TN-FE-03/04`, campo `signature`) — sem tela nesta leva
// (TASK-TN-FE-01/02), fundação de dados.
//
// Enum `TenantSignature` backed (DA-T04, Tenant-contrato.md): 1=TRIAL,
// 2=MONTHLY, 3=QUARTERLY, 4=SEMIANNUAL, 5=ANNUAL, 6=BIANNUAL,
// 99=UNDETERMINED.
// -----------------------------------------------------------------------------

import type { LanguageDate } from '@/@types/language';
import type { Option } from '@/@types/option';
import type { TenantSignature } from '@/@types/v2/BaseRegistrations/tenant';

const labels = (languageGB: LanguageDate) => {
  const text = languageGB.baseRegistrations.tenant.signature;
  return new Map<TenantSignature, string>([
    [1, text.trial],
    [2, text.monthly],
    [3, text.quarterly],
    [4, text.semiannual],
    [5, text.annual],
    [6, text.biannual],
    [99, text.undetermined],
  ]);
};

const getLabel = (signature: TenantSignature, languageGB: LanguageDate): string =>
  labels(languageGB).get(signature)!;

const getOption = (
  signature: TenantSignature,
  languageGB: LanguageDate
): Option<TenantSignature> => ({
  label: getLabel(signature, languageGB),
  value: signature,
});

const options = (languageGB: LanguageDate): Option<TenantSignature>[] =>
  Array.from(labels(languageGB)).map(([key, value]) => ({
    label: value,
    value: key,
  }));

export const tenantSignatureOptions = {
  getLabel,
  getOption,
  options,
};
