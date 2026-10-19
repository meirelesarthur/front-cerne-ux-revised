// src/validations/schemas/Relatorios/payment-schedule-report-filter-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do filtro do relatório "Agenda/Pagamentos" (F-294,
// CONTRATO-F294-agenda-pagamentos.md, esteira 97-Esteiras/059). Mirror
// ESTRUTURAL de `receipt-schedule-report-filter-schema.ts` (F-304, sibling
// mais próximo — par `start_date`/`end_date`, `end_date >= start_date` via
// `.test()`, datas OPCIONAIS fiel ao legado/DEC-265).
//
// `number`/`farm`/`proprietary_id`/`status`/`categories`/`center_id` são
// OPCIONAIS, SEM validação de forma — a autoridade final é o 422 do backend
// (`Rule::exists`/`Rule::in` por campo, `PaymentScheduleReportRequest::
// rules()`). `format` é o único campo sempre obrigatório (default `pdf`,
// seletor `noClearable`).
//
// O schema valida a FORMA INTERNA do form (Option-based, react-select), NÃO
// o payload final do service (`PaymentScheduleReportParams`):
//   number: string | null
//   farm: Option<string> | null
//   start_date: string | null
//   end_date: string | null
//   proprietary_id: Option<string> | null
//   status: Option<PaymentScheduleReportStatus> | null
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

export const paymentScheduleReportFilterSchema = (languageGB: LanguageDate) => {
  const v = fieldValidationSchema(languageGB);
  const messages = languageGB.paymentScheduleReport.report;

  return yup.object({
    number: yup.string().trim().nullable().default(null),
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
    status: optionSchema,
    center_id: optionSchema,
    categories: yup.array(yup.string().required()).default([]),
    format: v.option<ReportFormat>(),
  });
};

export const paymentScheduleReportFilterSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(paymentScheduleReportFilterSchema(languageGB)) as any;

export default paymentScheduleReportFilterSchemaResolver;
