// src/validations/schemas/Relatorios/total-cost-of-reproduction-report-filter-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do filtro do relatório "Custo Total de Reprodução"
// (F-328, esteira 008, TASK-FE-CTR-01). Mirror ESTRUTURAL de
// `reproductive-history-report-filter-schema.ts:16-31`: `start_date`/
// `end_date` SEMPRE obrigatórios no CLIENTE + `.test('end-date-after-start-
// date', ...)` — espelha `TotalCostOfReproductionReportRequest::rules()`
// (`after_or_equal:start_date`).
//
// `format` é `.required()` via `fieldValidationSchema(...).option<ReportFormat>()`
// (sempre tem valor default `pdf` pré-selecionado no form, `noClearable` no
// Select — mirror `nutrition-consumption-report-filter-schema.ts`, reusando
// o tipo GLOBAL `ReportFormat` de `@/@types/v2/AccountsReports`).
//
// O schema é ESPELHO do `rules()` da API, não fonte independente — o legado
// tinha ZERO validação server-side (`CL-06`); a autoridade final é o 422 do
// servidor, exibido via `parseBlobError` no `catch` da tela.
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import fieldValidationSchema from '@/validations/field-validation-schema';

import type { LanguageDate } from '@/@types/language';
import type { ReportFormat } from '@/@types/v2/AccountsReports';

export const totalCostOfReproductionReportFilterSchema = (languageGB: LanguageDate) => {
  const v = fieldValidationSchema(languageGB);
  const messages = languageGB.totalCostOfReproductionReport.report.hint;

  return yup.object({
    start_date: yup.string().trim().nullable().required(messages.datesRequired),
    end_date: yup
      .string()
      .trim()
      .nullable()
      .required(messages.datesRequired)
      .test('end-date-after-start-date', messages.datesRequired, (value, context) => {
        const parent = context.parent as { start_date?: string | null };
        const startDate = parent.start_date;
        if (!value || !startDate) return true;
        return value >= startDate;
      }),
    format: v.option<ReportFormat>(),
  });
};

export const totalCostOfReproductionReportFilterSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(totalCostOfReproductionReportFilterSchema(languageGB)) as any;

export default totalCostOfReproductionReportFilterSchemaResolver;
