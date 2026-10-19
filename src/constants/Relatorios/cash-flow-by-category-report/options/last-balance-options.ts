// src/constants/relatorios/cash-flow-by-category-report/options/last-balance-options.ts
// -----------------------------------------------------------------------------
// Fábrica de opções do campo `last_balance` (Saldo Anterior — Sim/Não),
// relatório "Fluxo de Caixa Mensal" (F-240, esteira 97-Esteiras/053). Catálogo
// LOCAL, 2 valores fixos (`true`/`false`), mirror ESTRUTURAL de
// `regime-options.ts`/`report-periodicity-options.ts`. Default de UX
// declarado no roteiro selado (`_DECISOES-FIDELIDADE-053.md`): `false`
// ("Não") — sem fonte legada de default explícito (FM-05), editável pelo
// usuário antes de gerar.
// -----------------------------------------------------------------------------

import type { LanguageDate } from '@/@types/language';
import { Option } from '@/@types/option';

const labels = (languageGB: LanguageDate): Map<boolean, string> => {
  const dictionary = languageGB.cashFlowByCategoryReport.report.lastBalanceOptions;
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

export const cashFlowByCategoryReportLastBalanceOptions = { getLabel, getOption, options };
