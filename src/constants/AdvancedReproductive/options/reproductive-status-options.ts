// src/constants/AdvancedReproductive/options/reproductive-status-options.ts
// -----------------------------------------------------------------------------
// Options factory do enum `reproductive_status` (Gerenciamento Avançado —
// 1=Prenha, 2=Vazia, 3=Parida — `Animal::statusOptions`, fiel ao legado,
// decisoes-maestro-advanced-reproductive.md §"Fidelidade de campos/ordem").
// Mesmo padrão de `pecuaria/animal/options/reproductive-status-options.ts`
// (`getLabel`/`getOption`/`options`, mensagens derivadas de `languageGB`,
// nunca hardcoded) — módulo PRÓPRIO (`AdvancedReproductive`), não reexporta a
// fábrica de `pecuaria/animal` (contrato de API desta feature não reusa o
// tipo `AnimalReproductiveStatus`, roteiro §5). Consumido pelo campo de
// FILTRO `reproductive_status` (Select estático, TASK-AR-FE-02) — NUNCA para
// reformatar `reproductive_status_label` (já vem pronto do backend).
// -----------------------------------------------------------------------------

import type { LanguageDate } from '@/@types/language';
import type { Option } from '@/@types/option';
import type { ReproductiveStatus } from '@/@types/v2/AdvancedReproductive';

const labels = (languageGB: LanguageDate): Map<ReproductiveStatus, string> => {
  const text = languageGB.advancedReproductive.advancedReproductive.reproductiveStatusOptions;
  return new Map([
    [1, text.pregnant],
    [2, text.empty],
    [3, text.calved],
  ]);
};

const getLabel = (status: ReproductiveStatus, languageGB: LanguageDate): string =>
  labels(languageGB).get(status)!;

const getOption = (
  status: ReproductiveStatus,
  languageGB: LanguageDate
): Option<ReproductiveStatus> => ({
  label: getLabel(status, languageGB),
  value: status,
});

const options = (languageGB: LanguageDate): Option<ReproductiveStatus>[] =>
  Array.from(labels(languageGB)).map(([key, value]) => ({
    label: value,
    value: key,
  }));

export const reproductiveStatusOptions = {
  getLabel,
  getOption,
  options,
};
