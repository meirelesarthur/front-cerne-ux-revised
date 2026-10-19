// src/constants/marcacao/marking/options/marking-color-options.ts
// -----------------------------------------------------------------------------
// Fábrica de opções do catálogo de 16 cores de Marcação — mirror
// `marking-status-options.ts` (get_pwa_constants_and_mappers_pattern §3.2):
// `(languageGB) => Map<hex, label>` + `getLabel/getOption/options`. `value`
// do `Option<string>` é o HEX (nunca o `labelKey`) — é o que
// `MarkingRequest::rules()` espera em `color`.
// -----------------------------------------------------------------------------

import type { LanguageDate } from '@/@types/language';
import type { Option } from '@/@types/option';

import { markingColorCatalog } from '../marking-color';

const markingColorLabels = (languageGB: LanguageDate): Map<string, string> =>
  new Map(
    markingColorCatalog.map(({ hex, labelKey }) => [
      hex,
      languageGB.marcacao.marking.colors[labelKey],
    ])
  );

function getLabel(hex: string, languageGB: LanguageDate): string {
  return markingColorLabels(languageGB).get(hex) ?? hex;
}

function getOption(hex: string, languageGB: LanguageDate): Option<string> {
  return { label: getLabel(hex, languageGB), value: hex };
}

function options(languageGB: LanguageDate): Option<string>[] {
  return Array.from(markingColorLabels(languageGB), ([hex, label]) => ({ label, value: hex }));
}

export const markingColorOptions = { getLabel, getOption, options };
