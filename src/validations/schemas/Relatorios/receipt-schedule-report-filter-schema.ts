// src/validations/schemas/Relatorios/receipt-schedule-report-filter-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do filtro do relatório "Agenda/Recebimentos"
// (F-304, TASK-055-F304-FE-01, esteira 97-Esteiras/055). Mirror ESTRUTURAL
// de `receipts-report-filter-schema.ts` (par `start_date`/`end_date`,
// `end_date >= start_date` via `.test()`), MAS as datas são OPCIONAIS
// (fiel ao legado — CF304-05, roteiro §2.1/§4.3), divergindo do irmão
// F-305 (datas SEMPRE `required`).
//
// `clients`/`farm`/`proprietary_id`/`categories`/`center_id` são
// OPCIONAIS, SEM validação de forma — a autoridade final é o 422 do
// backend (`Rule::exists` por campo, roteiro §2.1/§3). `format` é o único
// campo sempre obrigatório (default `pdf`, seletor `noClearable`).
//
// O schema valida a FORMA INTERNA do form (Option-based, react-select), NÃO
// o payload final do service (`ReceiptScheduleReportParams`):
//   clients: string[]
//   farm: Option<string> | null
//   start_date: string | null
//   end_date: string | null
//   proprietary_id: Option<string> | null
//   center_id: Option<string> | null
//   categories: string[]
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

export const receiptScheduleReportFilterSchema = (languageGB: LanguageDate) => {
  const v = fieldValidationSchema(languageGB);
  const messages = languageGB.receiptScheduleReport.report;

  return yup.object({
    clients: yup.array(yup.string().required()).default([]),
    farm: optionSchema,
    start_date: yup.string().trim().nullable().default(null),
    end_date: yup
      .string()
      .trim()
      .nullable()
      .default(null)
      .test('end-date-after-start-date', messages.validation.periodOrder, (value, context) => {
        const parent = context.parent as { start_date?: string | null };
        if (!value || !parent.start_date) return true;
        return value >= parent.start_date;
      }),
    proprietary_id: optionSchema,
    center_id: optionSchema,
    categories: yup.array(yup.string().required()).default([]),
    format: v.option<ReportFormat>(),
  });
};

export const receiptScheduleReportFilterSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(receiptScheduleReportFilterSchema(languageGB)) as any;

export default receiptScheduleReportFilterSchemaResolver;
