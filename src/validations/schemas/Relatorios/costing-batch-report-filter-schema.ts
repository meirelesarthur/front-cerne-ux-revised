// src/validations/schemas/Relatorios/costing-batch-report-filter-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do filtro do relatório "Custeio/Lote" (F-20c552f0,
// TASK-CL-FE-01, esteira 074). Mirror EXATO de
// `Sanitaries/sanitaries-batch-report-filter-schema.ts`/
// `Relatorios/paid-interest-report-filter-schema.ts`: `start_date`/
// `end_date` `required`, teste `end_date >= start_date`. `batches` SEM
// validação de schema — autoridade final é o 422 do backend (`batches.*`
// valida `uuid`+`exists` server-side, contrato front §4).
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import type { LanguageDate } from '@/@types/language';

export const costingBatchReportFilterSchema = (languageGB: LanguageDate) => {
  const messages = languageGB.costingBatchReport.report;

  return yup.object().shape({
    start_date: yup.string().nullable().required(messages.validation.periodRequired),
    end_date: yup
      .string()
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

/**
 * Resolver pronto para o `useForm({ resolver })`.
 * @param {LanguageDate} languageGB - Pacote de idioma ativo (mensagens de validação i18n).
 * @return {Function} Resolver ligado ao schema de filtro do relatório de Custeio/Lote.
 */
export const costingBatchReportFilterSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(costingBatchReportFilterSchema(languageGB)) as any;

export default costingBatchReportFilterSchemaResolver;
