// src/validations/schemas/BreedingMating/pregnant-cows-report-filter-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do filtro do relatório de Vacas Prenhas (Tarefa 46,
// frontend-contract-vacas-prenhas.md §5). Mirror EXATO
// `Sanitaries/sanitaries-batch-report-filter-schema.ts` (mesmo caso de uso —
// export via blob, `start_date`/`end_date` sempre obrigatórios,
// `end_date >= start_date`). Demais filtros (`insemination_type`/
// `batch_uuid`/`animal_uuid`/`diagnosis_pregnancy_uuid`) são OPCIONAIS —
// autoridade final é o 422 do backend (`PregnantCowsReportRequest::rules()`).
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import type { LanguageDate } from '@/@types/language';

export const pregnantCowsReportFilterSchema = (languageGB: LanguageDate) => {
  const messages = languageGB.breedingMatings.pregnancyDiagnosis.report.hint;

  return yup.object().shape({
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
 * @return {Function} Resolver ligado ao schema de filtro do relatório de Vacas Prenhas.
 */
export const pregnantCowsReportFilterSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(pregnantCowsReportFilterSchema(languageGB)) as any;

export default pregnantCowsReportFilterSchemaResolver;
