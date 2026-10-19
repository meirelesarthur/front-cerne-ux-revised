// src/constants/Financial/FinancialFreeze/options/financial-freeze-month-options.ts
// Fábrica de opções de MÊS (Janeiro..Dezembro) do módulo Congelamentos
// Financeiros — padrão canônico `(languageGB) => Map` + `getLabel`/
// `getOption`/`options` (get_pwa_constants_and_mappers_pattern §3.2), mirror
// LITERAL de `src/constants/Depreciations/options/depreciation-month-options.ts`.
//
// NÃO reaproveita `src/constants/options/months.ts` (array estático em
// português, sem `languageGB`, sem fábrica — desvio pré-existente, outro
// consumidor não relacionado depende dele; contrato de tela §1/§9 é
// explícito: fábrica NOVA e LOCAL, isolada em `src/constants/Financial/`,
// mirror `Depreciations`).
//
// Consumida pela grid (Tarefa 31, coluna Mês — `month_label` do servidor NÃO
// é usado) e pelo filtro (`FilterSideCongelamentos.tsx`); a Tarefa 32 reusa
// no formulário (`Select` de `month`).

import type { LanguageDate } from '@/@types/language';
import { Option } from '@/@types/option';

const labels = (languageGB: LanguageDate): Map<number, string> =>
  new Map([
    [1, languageGB.financial.financialFreeze.months.january],
    [2, languageGB.financial.financialFreeze.months.february],
    [3, languageGB.financial.financialFreeze.months.march],
    [4, languageGB.financial.financialFreeze.months.april],
    [5, languageGB.financial.financialFreeze.months.may],
    [6, languageGB.financial.financialFreeze.months.june],
    [7, languageGB.financial.financialFreeze.months.july],
    [8, languageGB.financial.financialFreeze.months.august],
    [9, languageGB.financial.financialFreeze.months.september],
    [10, languageGB.financial.financialFreeze.months.october],
    [11, languageGB.financial.financialFreeze.months.november],
    [12, languageGB.financial.financialFreeze.months.december],
  ]);

const getLabel = (value: number, languageGB: LanguageDate): string =>
  labels(languageGB).get(value)!;

const getOption = (value: number, languageGB: LanguageDate): Option<number> => ({
  label: getLabel(value, languageGB),
  value,
});

const options = (languageGB: LanguageDate): Option<number>[] =>
  Array.from(labels(languageGB)).map(([value, label]) => ({ label, value }));

export const financialFreezeMonthOptions = { getLabel, getOption, options };
