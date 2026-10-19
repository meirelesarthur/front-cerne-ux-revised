// src/validations/schemas/AccountsReports/rec-prev-real-report-filter-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do filtro do relatório F-297 Rec. Prev. X Real
// (esteira 97-Esteiras/079, TASK-079-297-FE-01). Mirror EXATO de
// `pag-prev-real-report-filter-schema.ts` (par de datas SEMPRE `.required()`,
// `fim >= início` via `.test()`) — troca `providers`→`clients`.
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

export const recPrevRealReportFilterSchema = (languageGB: LanguageDate) => {
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
    clients: yup.array(yup.string().required()).default([]),
    proprietary_id: optionSchema,
    center_id: optionSchema,
    categories: yup.array(yup.string().required()).default([]),
    farm_id: optionSchema,
    condition: optionSchema,
    format: v.option<ReportFormat>(),
  });
};

export const recPrevRealReportFilterSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(recPrevRealReportFilterSchema(languageGB)) as any;

export default recPrevRealReportFilterSchemaResolver;
