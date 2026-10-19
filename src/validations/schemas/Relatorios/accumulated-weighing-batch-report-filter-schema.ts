// src/validations/schemas/Relatorios/accumulated-weighing-batch-report-filter-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do filtro do relatório "Pesagem/Lote" (Tarefa 49,
// esteira CORE_WORKSPACE/97-Esteiras/014). Mirror ESTRUTURAL de
// `management-batch-report-filter-schema.ts` (F-279) para `start_date`/
// `end_date` SEMPRE obrigatórios no CLIENTE + `.test('end-date-after-start-
// date', ...)`; mirror `weighing-harvest-report-filter-schema.ts` para
// `format` via `fieldValidationSchema(languageGB).option<ReportFormat>()`
// (sempre tem valor default `pdf` pré-selecionado no form, `noClearable` no
// Select).
//
// `batch_id`/`category_id`/`only_active_batch` são OPCIONAIS, SEM `.test()`
// condicional entre eles — 3 filtros independentes (Gate FID-G3F, dimensão
// "cascatas" = `NAO_APLICAVEL`, prova de ausência já fechada pelo Extrator).
//
// O schema valida a FORMA INTERNA do form (Option-based, react-select), NÃO
// o payload final do service (`AccumulatedWeighingBatchReportParams`).
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

export const accumulatedWeighingBatchReportFilterSchema = (languageGB: LanguageDate) => {
  const v = fieldValidationSchema(languageGB);
  const messages = languageGB.accumulatedWeighingBatchReport.report;

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
    only_active_batch: optionSchema,
    format: v.option<ReportFormat>(),
  });
};

export const accumulatedWeighingBatchReportFilterSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(accumulatedWeighingBatchReportFilterSchema(languageGB)) as any;

export default accumulatedWeighingBatchReportFilterSchemaResolver;
