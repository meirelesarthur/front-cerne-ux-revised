// src/constants/afiliados/partner/options/partner-status-options.ts
// -----------------------------------------------------------------------------
// Options factory do STATUS de Afiliado (Partner) — mesmo padrão de
// `constants/options/statusOptions.ts` (`getLabel`/`getOption`/`options`,
// mensagens derivadas de `languageGB`, nunca hardcoded). Mapa de cor do Badge
// (`partnerStatusBadgeVariant`) CO-LOCADO aqui (Lei 6 — nunca cor inline em
// componente).
//
// Enum `PartnerStatus` (contrato backend §5): 1=Habilitado, 2=Bloqueado,
// 3=Cancelado.
// -----------------------------------------------------------------------------

import type { LanguageDate } from '@/@types/language';
import type { Option } from '@/@types/option';
import type { PartnerStatusValue } from '@/@types/v2/Afiliados';

const labels = (languageGB: LanguageDate) => {
  const text = languageGB.afiliados.partner.status;
  return new Map<PartnerStatusValue, string>([
    [1, text.enabled],
    [2, text.blocked],
    [3, text.cancelled],
  ]);
};

const getLabel = (status: PartnerStatusValue, languageGB: LanguageDate): string =>
  labels(languageGB).get(status)!;

const getOption = (
  status: PartnerStatusValue,
  languageGB: LanguageDate
): Option<PartnerStatusValue> => ({
  label: getLabel(status, languageGB),
  value: status,
});

const options = (languageGB: LanguageDate): Option<PartnerStatusValue>[] =>
  Array.from(labels(languageGB)).map(([key, value]) => ({
    label: value,
    value: key,
  }));

export const partnerStatusOptions = {
  getLabel,
  getOption,
  options,
};

/** Mapa de `colorPalette` do Badge da coluna Status (mirror Chakra `colorPalette`). */
export const partnerStatusBadgeVariant: Record<PartnerStatusValue, string> = {
  1: 'green',
  2: 'orange',
  3: 'red',
};
