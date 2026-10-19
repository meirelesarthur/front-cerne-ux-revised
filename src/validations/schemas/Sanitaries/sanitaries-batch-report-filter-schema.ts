// src/validations/schemas/Sanitaries/sanitaries-batch-report-filter-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do filtro do relatório por lote de Sanitário
// (`san-screen-report`). Mirror `Evolutions/evolution-report-filter-schema.ts`
// (mesmo caso de uso — export síncrono via blob, `start_date`/`end_date`
// sempre obrigatórios, `end_date >= start_date`).
//
// RE-ALINHAMENTO F-318 (esteira 078, F-318-plano-frontend.md, TASK-F318-F02)
// — restaura os 4 selects opcionais (`category`/`feedlotCorral`/`animal`/
// `product`) que a API RE-MIGRADA trouxe de volta, mirror `optionSchema` de
// `feedlot-weighing-performance-report-filter-schema.ts`. `start_date`/
// `end_date` continuam `required` — confirmado por leitura direta do Form
// Request real (`SanitaryBatchReportRequest::rules()`, worktree irmão
// `GB.Cerne.Api`): só essas 2 chaves são `required`; as demais são
// `sometimes`. Client-side não valida além disso — a autoridade final é o
// 422 do backend.
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import type { LanguageDate } from '@/@types/language';

const optionSchema = yup
  .object({ value: yup.mixed(), label: yup.string() })
  .nullable()
  .default(null);

export const sanitariesBatchReportFilterSchema = (languageGB: LanguageDate) => {
  const messages = languageGB.sanitary.sanitary.report.hint;

  return yup.object().shape({
    category: optionSchema,
    feedlotCorral: optionSchema,
    batch: optionSchema,
    animal: optionSchema,
    product: optionSchema,
    start_date: yup.string().nullable().required(messages.datesRequired),
    end_date: yup
      .string()
      .nullable()
      .required(messages.datesRequired)
      .test('end-date-after-start-date', messages.datesRequired, (value, context) => {
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
 * @return {Function} Resolver ligado ao schema de filtro do relatório de Sanitário por Lote.
 */
export const sanitariesBatchReportFilterSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(sanitariesBatchReportFilterSchema(languageGB)) as any;

export default sanitariesBatchReportFilterSchemaResolver;
