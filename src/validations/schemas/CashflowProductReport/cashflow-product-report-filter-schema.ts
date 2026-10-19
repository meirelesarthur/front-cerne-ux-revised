// src/validations/schemas/CashflowProductReport/cashflow-product-report-filter-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do filtro do relatório "Estoque Financeiro" (F-241,
// TASK-013-241-FE-01, esteira 97-Esteiras/013). Mirror ESTRUTURAL de
// `cash-flow-by-category-report-filter-schema.ts` (par `start_date`/
// `end_date` SEMPRE obrigatório, `end_date >= start_date` via `.test()`,
// `DE-03` — default recomendado: incluir o guard client) REDUZIDO a 3 campos
// (`format` obrigatório via `v.option<ReportFormat>()`, mirror
// `expense-report-filter-schema.ts`).
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import fieldValidationSchema from '@/validations/field-validation-schema';

import type { LanguageDate } from '@/@types/language';
import type { ReportFormat } from '@/@types/v2/AccountsReports';

export const cashflowProductReportFilterSchema = (languageGB: LanguageDate) => {
  const v = fieldValidationSchema(languageGB);
  const messages = languageGB.cashflowProductReport.report;

  return yup.object({
    start_date: yup.string().trim().nullable().required(messages.validation.periodRequired),
    end_date: yup
      .string()
      .trim()
      .nullable()
      .required(messages.validation.periodRequired)
      .test('end-date-after-start-date', messages.validation.periodRequired, (value, context) => {
        const parent = context.parent as { start_date?: string | null };
        const startDate = parent.start_date;
        if (!value || !startDate) return true;
        return value >= startDate;
      }),
    format: v.option<ReportFormat>(),
  });
};

export const cashflowProductReportFilterSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(cashflowProductReportFilterSchema(languageGB)) as any;

export default cashflowProductReportFilterSchemaResolver;
