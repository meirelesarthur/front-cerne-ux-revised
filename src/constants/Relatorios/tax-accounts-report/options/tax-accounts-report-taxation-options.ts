// src/constants/relatorios/tax-accounts-report/options/tax-accounts-report-taxation-options.ts
// -----------------------------------------------------------------------------
// Fábrica de opções do campo `is_taxation` da tela "Contas Tributárias"
// (F-327, esteira 060, ROTEIRO-F327-FRONT.md §3.G) — 2 opções Sim (`true`)
// / Não (`false`). O Select deste campo é CLEARABLE: vazio = "Todas" (omite
// o param `is_taxation` do payload — landmine §3.F, NÃO confundir com o
// valor `false`, que é enviado).
// -----------------------------------------------------------------------------

import type { LanguageDate } from '@/@types/language';
import { Option } from '@/@types/option';

const labels = (languageGB: LanguageDate): Map<boolean, string> => {
  const dictionary = languageGB.taxAccountsReport.report.taxationOptions;
  return new Map([
    [true, dictionary.yes],
    [false, dictionary.no],
  ]);
};

const getLabel = (value: boolean, languageGB: LanguageDate): string =>
  labels(languageGB).get(value)!;

const getOption = (value: boolean, languageGB: LanguageDate): Option<boolean> => ({
  label: getLabel(value, languageGB),
  value,
});

const options = (languageGB: LanguageDate): Option<boolean>[] =>
  Array.from(labels(languageGB)).map(([value, label]) => ({ label, value }));

export const taxAccountsReportTaxationOptions = { getLabel, getOption, options };
