// src/constants/integracoes/exportEarningsDominio/options/exportEarningsDominio-month-options.ts
// Fábrica de opções do campo `month` da tela "Exportação Folha Salarial →
// Domínio" (F-117, Integrações) — padrão canônico `(languageGB) => Map`
// (get_pwa_constants_and_mappers_pattern §3.2). Valores 1..12 (contrato de
// tela §2.1/§4). Labels 100% derivados da tradução — PROIBIDO usar
// `src/constants/options/months.ts` cru (é string-literal PT-BR hardcoded,
// desvio; severidade INVIOLÁVEL).

import type { LanguageDate } from '@/@types/language';
import type { Option } from '@/@types/option';

const labels = (languageGB: LanguageDate): Map<number, string> => {
  const dictionary = languageGB.integrations.exportEarningsDominio.form.months;
  return new Map([
    [1, dictionary.jan],
    [2, dictionary.feb],
    [3, dictionary.mar],
    [4, dictionary.apr],
    [5, dictionary.may],
    [6, dictionary.jun],
    [7, dictionary.jul],
    [8, dictionary.aug],
    [9, dictionary.sep],
    [10, dictionary.oct],
    [11, dictionary.nov],
    [12, dictionary.dec],
  ]);
};

const getLabel = (value: number, languageGB: LanguageDate): string =>
  labels(languageGB).get(value) ?? String(value);

const getOption = (value: number, languageGB: LanguageDate): Option<number> => ({
  label: getLabel(value, languageGB),
  value,
});

const options = (languageGB: LanguageDate): Option<number>[] =>
  Array.from(labels(languageGB)).map(([value, label]) => ({ label, value }));

export const exportEarningsDominioMonthOptions = { getLabel, getOption, options };
