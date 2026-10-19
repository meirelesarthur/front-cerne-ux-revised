// src/validations/schemas/ReceiptCashflowReport/receipt-cashflow-report-filter-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do filtro do relatório "Fluxo Mensal de
// Recebimento" (F-303, esteira 97-Esteiras/059, TASK-303-API-03). Mirror
// ESTRUTURAL de `cash-flow-by-category-report-filter-schema.ts` (irmã
// direta, mesmo tipo de fluxo — par `start_date`/`end_date` SEMPRE
// obrigatório, `end_date >= start_date` via `.test()`), MENOS `group`/
// `last_balance`/`report_type` (F-303 não tem regime nem saldo anterior)
// MAIS `categories[]` (mirror `receipt-schedule-report-filter-schema.ts` —
// `yup.array(yup.string().required()).default([])`).
//
// `accounts`/`proprietary_id`/`center_id`/`categories`/`farm_id` são
// OPCIONAIS, SEM validação de forma — a autoridade final é o 422 do backend
// (`Rule::exists` por campo). `format` é o único campo sempre obrigatório
// (default `pdf`, seletor `noClearable`).
//
// O schema valida a FORMA INTERNA do form (Option-based, react-select), NÃO
// o payload final do service (`ReceiptCashflowReportParams`):
//   accounts: string[]
//   start_date: string | null
//   end_date: string | null
//   proprietary_id: Option<string> | null
//   center_id: Option<string> | null
//   categories: string[]
//   farm_id: Option<string> | null
//   format: Option<ReportFormat> | null
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import fieldValidationSchema from '@/validations/field-validation-schema';

import type { LanguageDate } from '@/@types/language';
import type { ReportFormat } from '@/@types/v2/AccountsReports';

const optionSchema = yup
  .object({ value: yup.mixed(), label: yup.string() })
  .nullable()
  .default(null);

export const receiptCashflowReportFilterSchema = (languageGB: LanguageDate) => {
  const v = fieldValidationSchema(languageGB);
  const messages = languageGB.receiptCashflowReport.report;

  return yup.object({
    accounts: yup.array(yup.string().required()).default([]),
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
    proprietary_id: optionSchema,
    center_id: optionSchema,
    categories: yup.array(yup.string().required()).default([]),
    farm_id: optionSchema,
    format: v.option<ReportFormat>(),
  });
};

export const receiptCashflowReportFilterSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(receiptCashflowReportFilterSchema(languageGB)) as any;

export default receiptCashflowReportFilterSchemaResolver;
