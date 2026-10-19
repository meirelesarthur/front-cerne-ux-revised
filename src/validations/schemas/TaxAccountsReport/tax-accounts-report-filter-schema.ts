// src/validations/schemas/TaxAccountsReport/tax-accounts-report-filter-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do filtro do relatório "Contas Tributárias"
// (F-327, esteira 060, ROTEIRO-F327-FRONT.md §3.E). Período espelha
// EXATAMENTE `start_date`/`end_date` de
// `AccountsReports/paid-expense-report-filter-schema.ts` (mirror direto de
// `TransferDifferenceReport/transfer-difference-report-filter-schema.ts`,
// mesma forma: datas OBRIGATÓRIAS com `.test()` de `fim >= início` —
// `after_or_equal` real é validado server-side, este teste só evita a
// chamada com 422 previsível).
//
// `is_taxation`/`cost_center`/`provider` são OPCIONAIS — `optionSchema`
// SEM `.required()` (vazio = "Todas"/sem filtro). `format` obrigatório via
// `fieldValidationSchema(languageGB).option<T>()`. Zero string literal —
// mensagens sempre de `languageGB.taxAccountsReport.report.validation.*`.
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import fieldValidationSchema from '@/validations/field-validation-schema';

import type { LanguageDate } from '@/@types/language';
import type { TaxAccountsReportFormat } from '@/@types/v2/TaxAccountsReport';

const optionSchema = yup
  .object({ value: yup.mixed(), label: yup.string() })
  .nullable()
  .default(null);

export const taxAccountsReportFilterSchema = (languageGB: LanguageDate) => {
  const v = fieldValidationSchema(languageGB);
  const messages = languageGB.taxAccountsReport.report.validation;

  return yup.object({
    start_date: yup.string().trim().nullable().required(messages.datesRequired),
    end_date: yup
      .string()
      .trim()
      .nullable()
      .required(messages.datesRequired)
      .test('end-date-after-start-date', messages.invalidDateRange, (value, context) => {
        const parent = context.parent as { start_date?: string | null };
        if (!value || !parent.start_date) return true;
        return value >= parent.start_date;
      }),
    is_taxation: optionSchema, // opcional — "Todas" (vazio) omite o param
    cost_center: optionSchema, // opcional — value = uuid
    provider: optionSchema, // opcional — value = uuid
    format: v.option<TaxAccountsReportFormat>(),
  });
};

export const taxAccountsReportFilterSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(taxAccountsReportFilterSchema(languageGB)) as any;

export default taxAccountsReportFilterSchemaResolver;
