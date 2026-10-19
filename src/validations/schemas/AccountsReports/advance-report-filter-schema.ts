// src/validations/schemas/AccountsReports/advance-report-filter-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do filtro do relatório F-219 Adiantamento
// (esteira 97-Esteiras/055, TASK-055-FE-01). Mirror EXATO de
// `pag-prev-real-report-filter-schema.ts` (par de datas SEMPRE
// `.required()`, `fim >= início` via `.test()`) — aqui os 5 lookups são
// SINGLE-select (`optionSchema` nullable) e há o campo novo `number`
// (texto livre, LIKE server-side).
//
// Nenhuma string literal em mensagem de validação.
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

export const advanceReportFilterSchema = (languageGB: LanguageDate) => {
  const v = fieldValidationSchema(languageGB);
  const messages = languageGB.accountsReports.shared.validation;

  return yup.object({
    start_date: yup.string().trim().nullable().required(messages.invalidDateRange),
    end_date: yup
      .string()
      .trim()
      .nullable()
      .required(messages.invalidDateRange)
      .test('end-date-after-start-date', messages.invalidDateRange, (value, context) => {
        const parent = context.parent as { start_date?: string | null };
        if (!value || !parent.start_date) return true;
        return value >= parent.start_date;
      }),
    number: yup.string().trim().nullable().default(null),
    farm_id: optionSchema,
    provider_id: optionSchema,
    client_id: optionSchema,
    proprietary_id: optionSchema,
    center_id: optionSchema,
    format: v.option<ReportFormat>(),
  });
};

export const advanceReportFilterSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(advanceReportFilterSchema(languageGB)) as any;

export default advanceReportFilterSchemaResolver;
