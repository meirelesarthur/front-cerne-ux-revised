// src/constants/breedingMating/options/resync-options.ts
// Fábrica de opções do campo `resync` de Diagnóstico de Gestação
// ("Ressincronização" — `pregnancy_diagnosis_animals.resync`, boolean). Só
// existe quando `launch_type != 2` (`batch_fill_enabled.resync`, K5 do
// manifesto FID-G3F) e é mutuamente exclusivo com `batch` (Transferir Lote).
// Mirror `eligible-options.ts`.

import type { LanguageDate } from '@/@types/language';
import type { Option } from '@/@types/option';

const labels = (languageGB: LanguageDate): Map<boolean, string> => {
  const text = languageGB.breedingMatings.breedingMating.options.resync;
  return new Map([
    [true, text.yes],
    [false, text.no],
  ]);
};

const getLabel = (value: boolean, languageGB: LanguageDate): string =>
  labels(languageGB).get(value)!;

const getOption = (value: boolean, languageGB: LanguageDate): Option<boolean> => ({
  label: getLabel(value, languageGB),
  value,
});

const options = (languageGB: LanguageDate): Option<boolean>[] =>
  Array.from(labels(languageGB)).map(([value, label]) => ({ value, label }));

export const resyncOptions = { getLabel, getOption, options };
