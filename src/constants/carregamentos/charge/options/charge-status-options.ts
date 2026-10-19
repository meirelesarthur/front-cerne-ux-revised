// src/constants/carregamentos/charge/options/charge-status-options.ts
// -----------------------------------------------------------------------------
// Status do Carregamento — `pendente`/`finalizada` (`ChargeStatusEnum`).
// Fábrica canônica `(languageGB) => Map` + `getLabel`/`options`, mirror
// `transferStatusOptions`.
//
// A cor vem de `ChargeStatusEnum::color()` (`#e74a3b` pendente / `#4e73df`
// finalizada) — mapeada aqui para os `colorPalette` semânticos do Chakra v3
// (Lei 6: NUNCA hex fixo no componente).
// -----------------------------------------------------------------------------

import type { LanguageDate } from '@/@types/language';
import { Option } from '@/@types/option';
import type { ChargeStatus } from '@/@types/v2/Carregamentos';

const chargeStatusLabels = (languageGB: LanguageDate): Map<ChargeStatus, string> => {
  const dictionary = languageGB.carregamentos.charge.statusOptions;
  return new Map([
    ['pendente', dictionary.pendente],
    ['finalizada', dictionary.finalizada],
  ]);
};

const getChargeStatusLabel = (value: ChargeStatus, languageGB: LanguageDate): string =>
  chargeStatusLabels(languageGB).get(value) ?? String(value);

const chargeStatusOptionsList = (languageGB: LanguageDate): Option<ChargeStatus>[] =>
  Array.from(chargeStatusLabels(languageGB)).map(([value, label]) => ({ label, value }));

// Mapa `ChargeStatusEnum::color()` (`#e74a3b`/`#4e73df`) → `colorPalette`
// semântico do Chakra v3 — nunca hex fixo no componente (Lei 6).
export const chargeStatusColorPalette: Record<ChargeStatus, string> = {
  pendente: 'red',
  finalizada: 'blue',
};

export const chargeStatusOptions = {
  getLabel: getChargeStatusLabel,
  options: chargeStatusOptionsList,
};
