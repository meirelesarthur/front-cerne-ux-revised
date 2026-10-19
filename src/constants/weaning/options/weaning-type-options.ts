// src/constants/weaning/options/weaning-type-options.ts
// -----------------------------------------------------------------------------
// Fábrica de opções do tipo de Desmama (Recria/Venda) — mirror
// `batch-status-options.ts`/`weaningTypeOptions` (get_pwa_constants_and_
// mappers_pattern §3.2): `(languageGB) => Map` + `getLabel/getOption/options`.
// -----------------------------------------------------------------------------

import type { LanguageDate } from '@/@types/language';
import type { Option } from '@/@types/option';

import { weaningType, type WeaningTypeValue } from '../weaning-type';

const weaningTypeLabels = (languageGB: LanguageDate): Map<WeaningTypeValue, string> =>
  new Map([
    [weaningType.recria, languageGB.weaning.weaning.type.recria],
    [weaningType.venda, languageGB.weaning.weaning.type.venda],
  ]);

function getLabel(value: WeaningTypeValue, languageGB: LanguageDate): string {
  return weaningTypeLabels(languageGB).get(value) ?? String(value);
}

function getOption(value: WeaningTypeValue, languageGB: LanguageDate): Option<WeaningTypeValue> {
  return { label: getLabel(value, languageGB), value };
}

function options(languageGB: LanguageDate): Option<WeaningTypeValue>[] {
  return Array.from(weaningTypeLabels(languageGB), ([value, label]) => ({ label, value }));
}

export const weaningTypeOptions = { getLabel, getOption, options };
