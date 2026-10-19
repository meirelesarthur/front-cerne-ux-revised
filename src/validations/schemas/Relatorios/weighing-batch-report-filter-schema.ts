// src/validations/schemas/Relatorios/weighing-batch-report-filter-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do filtro do relatório "Pesagem/Animal" (feature
// F-334, `CONTRATO-F334-pesagem-animal.md` TASK-334-API-01). Mirror
// ESTRUTURAL de `accumulated-weighing-batch-report-filter-schema.ts` (irmão
// "Pesagem/Lote") para `start_date`/`end_date` SEMPRE obrigatórios no
// CLIENTE + `.test('end-date-after-start-date', ...)`; `format` via
// `fieldValidationSchema(languageGB).option<ReportFormat>()` (sempre tem
// valor default `pdf` pré-selecionado no form, `noClearable` no Select).
//
// `batch_id`/`category_id`/`animal_id` são OPCIONAIS, SEM `.test()`
// condicional entre eles — 3 filtros independentes, mirror
// `WeighingBatchReportRequest::rules()` (`sometimes` nos 3).
//
// O schema valida a FORMA INTERNA do form (Option-based, react-select), NÃO
// o payload final do service (`WeighingBatchReportParams`).
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

export const weighingBatchReportFilterSchema = (languageGB: LanguageDate) => {
  const v = fieldValidationSchema(languageGB);
  const messages = languageGB.weighingBatchReport.report;

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
    batch_id: optionSchema,
    category_id: optionSchema,
    animal_id: optionSchema,
    format: v.option<ReportFormat>(),
  });
};

export const weighingBatchReportFilterSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(weighingBatchReportFilterSchema(languageGB)) as any;

export default weighingBatchReportFilterSchemaResolver;
