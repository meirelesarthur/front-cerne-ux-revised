// src/constants/Depreciations/options/depreciation-month-options.ts
// Fábrica de opções de MÊS (Janeiro..Dezembro) do módulo de Depreciação —
// padrão canônico `(languageGB) => Map` + `getLabel`/`getOption`/`options`
// (get_pwa_constants_and_mappers_pattern §3.2), mirror
// `markerTypeOptions`/`languageGB.depreciations.filter.months.*`.
//
// NÃO reaproveita `src/constants/options/months.ts` (array estático em
// português, sem `languageGB`, sem fábrica — desvio pré-existente, outro
// consumidor não relacionado depende dele; contrato de tela §8.3 é
// explícito: fábrica NOVA e LOCAL, isolada em `src/constants/Depreciations/`).
//
// Consumida pelo filtro (`FilterSideDepreciacao.tsx`, TASK-FE-844) e pelo
// modal "Gerar" (`GerarDepreciacaoModal`, TASK-FE-846).

import type { LanguageDate } from '@/@types/language';
import { Option } from '@/@types/option';

const labels = (languageGB: LanguageDate): Map<number, string> =>
  new Map([
    [1, languageGB.depreciations.filter.months.january],
    [2, languageGB.depreciations.filter.months.february],
    [3, languageGB.depreciations.filter.months.march],
    [4, languageGB.depreciations.filter.months.april],
    [5, languageGB.depreciations.filter.months.may],
    [6, languageGB.depreciations.filter.months.june],
    [7, languageGB.depreciations.filter.months.july],
    [8, languageGB.depreciations.filter.months.august],
    [9, languageGB.depreciations.filter.months.september],
    [10, languageGB.depreciations.filter.months.october],
    [11, languageGB.depreciations.filter.months.november],
    [12, languageGB.depreciations.filter.months.december],
  ]);

const getLabel = (value: number, languageGB: LanguageDate): string =>
  labels(languageGB).get(value)!;

const getOption = (value: number, languageGB: LanguageDate): Option<number> => ({
  label: getLabel(value, languageGB),
  value,
});

const options = (languageGB: LanguageDate): Option<number>[] =>
  Array.from(labels(languageGB)).map(([value, label]) => ({ label, value }));

export const depreciationMonthOptions = { getLabel, getOption, options };
