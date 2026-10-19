// src/constants/relatorios/accumulated-income-statement-report/options/has-stock-options.ts
// -----------------------------------------------------------------------------
// Fábrica de opções do campo `has_stock` do relatório F-217 Custo de
// Produção Acumulado — mirror EXATO de `group-options.ts`, domínio fixo do
// legado: `0`=Não (default, plano §2.2), `1`=Sim (injeta variação de
// estoque na Receita Bruta, servidor).
// -----------------------------------------------------------------------------

import type { LanguageDate } from '@/@types/language';
import type { Option } from '@/@types/option';

const labels = (languageGB: LanguageDate): Map<0 | 1, string> => {
  const dictionary = languageGB.accumulatedIncomeStatementReport.report.hasStockOptions;
  return new Map([
    [0, dictionary.no],
    [1, dictionary.yes],
  ]);
};

const getLabel = (value: 0 | 1, languageGB: LanguageDate): string => labels(languageGB).get(value)!;

const getOption = (value: 0 | 1, languageGB: LanguageDate): Option<0 | 1> => ({
  label: getLabel(value, languageGB),
  value,
});

const options = (languageGB: LanguageDate): Option<0 | 1>[] =>
  Array.from(labels(languageGB)).map(([value, label]) => ({ label, value }));

export const hasStockOptions = { getLabel, getOption, options };
