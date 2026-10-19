// src/validations/schemas/Relatorios/costing-animal-report-filter-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do filtro do relatório "Custeio/Animal" (F-248,
// TASK-CA-FE-01, esteira 075). `start_date`/`end_date` mirror EXATO de
// `costing-batch-report-filter-schema.ts`: `required`, teste
// `end_date >= start_date`. Diferente do irmão: `animal` AQUI TEM validação
// de schema (`fieldValidationSchema(languageGB).option()`, catálogo Yup
// canônico de campos `Option<T>`) porque o campo é obrigatório nesta tela
// (no irmão, `batches` é opcional e não entra no schema) — a autoridade
// final do 422 (`uuid`+`exists`) continua no backend como defesa em
// profundidade, não como substituto da validação client-side.
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import fieldValidationSchema from '@/validations/field-validation-schema';

import type { LanguageDate } from '@/@types/language';

export const costingAnimalReportFilterSchema = (languageGB: LanguageDate) => {
  const v = fieldValidationSchema(languageGB);
  const messages = languageGB.costingAnimalReport.report;

  return yup.object().shape({
    animal: v.option().required(messages.validation.animalRequired),
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
 * @return {Function} Resolver ligado ao schema de filtro do relatório de Custeio/Animal.
 */
export const costingAnimalReportFilterSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(costingAnimalReportFilterSchema(languageGB)) as any;

export default costingAnimalReportFilterSchemaResolver;
