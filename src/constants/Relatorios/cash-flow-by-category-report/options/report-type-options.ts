// src/constants/relatorios/cash-flow-by-category-report/options/report-type-options.ts
// -----------------------------------------------------------------------------
// Fábrica de opções do campo `report_type` (Tipo de Relatório — 'A'
// Analítico / 'S' Sintético), relatório "Fluxo de Caixa Mensal" (F-240,
// esteira 97-Esteiras/053). Catálogo LOCAL (`CashFlowReportTypeEnum`
// reutilizado tal qual no backend, 2 valores fixos), mirror ESTRUTURAL de
// `regime-options.ts`. Default de UX declarado no roteiro selado
// (`_DECISOES-FIDELIDADE-053.md`): `'S'` (Sintético — mais leve) — sem fonte
// legada de default explícito (FM-09, refill inconsistente do legado
// CL-025, NÃO_APLICAVEL a esta SPA), editável pelo usuário antes de gerar.
// -----------------------------------------------------------------------------

import type { LanguageDate } from '@/@types/language';
import { Option } from '@/@types/option';
import type { CashFlowByCategoryReportType } from '@/@types/v2/CashFlowByCategoryReport';

const labels = (languageGB: LanguageDate): Map<CashFlowByCategoryReportType, string> => {
  const dictionary = languageGB.cashFlowByCategoryReport.report.reportTypeOptions;
  return new Map([
    ['A', dictionary.analytic],
    ['S', dictionary.synthetic],
  ]);
};

const getLabel = (value: CashFlowByCategoryReportType, languageGB: LanguageDate): string =>
  labels(languageGB).get(value)!;

const getOption = (
  value: CashFlowByCategoryReportType,
  languageGB: LanguageDate
): Option<CashFlowByCategoryReportType> => ({
  label: getLabel(value, languageGB),
  value,
});

const options = (languageGB: LanguageDate): Option<CashFlowByCategoryReportType>[] =>
  Array.from(labels(languageGB)).map(([value, label]) => ({ label, value }));

export const cashFlowByCategoryReportTypeOptions = { getLabel, getOption, options };
