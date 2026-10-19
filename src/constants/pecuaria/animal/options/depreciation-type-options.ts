// src/constants/pecuaria/animal/options/depreciation-type-options.ts
// -----------------------------------------------------------------------------
// Options factory do enum `depreciation_type` (Animal — Bloco Depreciação,
// TASK-FE-885) — mesmo padrão de `reproductive-status-options.ts`/
// `type-options.ts` (`getLabel`/`getOption`/`options`, mensagens derivadas de
// `languageGB`, nunca hardcoded).
//
// Mapeamento CONFIRMADO por leitura direta do legado
// (`agro365/resources/views/animals/_forms.blade.php:127-131` +
// `lang/pt-BR/trad.php:1936-1937`): `1 => 'C/Vl. Residual'`, `0 => 'S/Vl.
// Residual'` — MESMA convenção já usada por `FamilyEquipmentDepreciationType`
// (`COM_RESIDUAL = 1`, `SEM_RESIDUAL = 0`). `residual` só é obrigatório
// client-side quando `depreciation_type === 1` (`animal-schema.ts`, fiel ao
// `$('#inp-residual').attr('required', depreciationType == 1)` do legado).
// -----------------------------------------------------------------------------

import type { LanguageDate } from '@/@types/language';
import type { Option } from '@/@types/option';
import type { AnimalDepreciationType } from '@/@types/v2/Animals';

const labels = (languageGB: LanguageDate) => {
  const text = languageGB.animals.animal.depreciationTypeOptions;
  return new Map<AnimalDepreciationType, string>([
    [1, text.withResidual],
    [0, text.withoutResidual],
  ]);
};

const getLabel = (type: AnimalDepreciationType, languageGB: LanguageDate): string =>
  labels(languageGB).get(type)!;

const getOption = (
  type: AnimalDepreciationType,
  languageGB: LanguageDate
): Option<AnimalDepreciationType> => ({
  label: getLabel(type, languageGB),
  value: type,
});

const options = (languageGB: LanguageDate): Option<AnimalDepreciationType>[] =>
  Array.from(labels(languageGB)).map(([key, value]) => ({
    label: value,
    value: key,
  }));

export const depreciationTypeOptions = {
  getLabel,
  getOption,
  options,
};
