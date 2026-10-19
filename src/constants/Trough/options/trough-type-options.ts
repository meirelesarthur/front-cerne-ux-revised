// src/constants/Trough/options/trough-type-options.ts
// -----------------------------------------------------------------------------
// Options factory do campo `type` (Trough) — enum backed `A`/`B` no backend
// (`App\Enums\TroughTypeEnum`, contrato de API §4), rótulos "Coberto"/
// "Descoberto" (contrato de tela §3). Mirror do padrão `getLabel`/`getOption`/
// `options` de `@/constants/Grazing/options/control-productivity-options.ts`
// — mensagens derivadas de `languageGB`, nunca hardcoded.
//
// `TROUGH_TYPE_VALUES` é consumido também pelo schema Yup
// (`troughs-schema.ts`, `oneOf`) — mesma fonte única de verdade dos 2 valores
// válidos, sem duplicar a lista.
// -----------------------------------------------------------------------------

import type { LanguageDate } from '@/@types/language';
import type { Option } from '@/@types/option';
import type { TroughType } from '@/@types/v2/BaseRegistrations/troughs';

export const TROUGH_TYPE_VALUES = ['A', 'B'] as const;

const labels = (languageGB: LanguageDate) => {
  const text = languageGB.baseRegistrations.trough.typeOptions;
  return new Map<TroughType, string>([
    ['A', text.covered],
    ['B', text.uncovered],
  ]);
};

const getLabel = (type: TroughType, languageGB: LanguageDate): string =>
  labels(languageGB).get(type)!;

const getOption = (type: TroughType, languageGB: LanguageDate): Option<TroughType> => ({
  label: getLabel(type, languageGB),
  value: type,
});

const options = (languageGB: LanguageDate): Option<TroughType>[] =>
  Array.from(labels(languageGB)).map(([key, value]) => ({
    label: value,
    value: key,
  }));

export const troughTypeOptions = {
  getLabel,
  getOption,
  options,
};
