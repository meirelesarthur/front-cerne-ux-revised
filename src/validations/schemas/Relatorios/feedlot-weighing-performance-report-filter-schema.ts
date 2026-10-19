// src/validations/schemas/Relatorios/feedlot-weighing-performance-report-filter-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do filtro do relatório "Desempenho Pesagem
// Confinamento" (F-263, lote 076,
// `FeedlotWeighingPerformanceReport-contrato-api.md` §2). Mirror ESTRUTURAL
// de `costing-livestock-area-report-filter-schema.ts`/
// `costing-batch-report-filter-schema.ts` (par `start_date`/`end_date`
// SEMPRE obrigatório no CLIENTE + `.test('end-date-after-start-date', ...)`,
// mirror `after_or_equal:start_date` do Form Request).
//
// `corral`/`batch` são OPCIONAIS — o contrato do backend
// (`FeedlotWeighingPerformanceReportRequest::rules()`) só exige
// `start_date`/`end_date`; a autoridade final de `corral_uuid`/`batch_uuid`
// (`uuid`+`exists` tenant-scoped) é o 422 do backend.
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import type { LanguageDate } from '@/@types/language';

const optionSchema = yup
  .object({ value: yup.mixed(), label: yup.string() })
  .nullable()
  .default(null);

export const feedlotWeighingPerformanceReportFilterSchema = (languageGB: LanguageDate) => {
  const messages = languageGB.feedlotWeighingPerformanceReport.report;

  return yup.object({
    corral: optionSchema,
    batch: optionSchema,
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
  });
};

export const feedlotWeighingPerformanceReportFilterSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(feedlotWeighingPerformanceReportFilterSchema(languageGB)) as any;

export default feedlotWeighingPerformanceReportFilterSchemaResolver;
