// src/validations/schemas/BreedingMating/reproductive-history-report-filter-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do filtro do relatório de Histórico Reprodutivo
// (execução 074, historico-reprodutivo-contrato-front.md §4). Mirror EXATO
// `pregnant-cows-report-filter-schema.ts` — `start_date`/`end_date` sempre
// obrigatórios, `end_date >= start_date`. Demais filtros (`batch_uuid`/
// `reproductive_status`/`type`) são OPCIONAIS — autoridade final é o 422 do
// backend (`ReproductiveHistoryReportRequest::rules()`).
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import type { LanguageDate } from '@/@types/language';

export const reproductiveHistoryReportFilterSchema = (languageGB: LanguageDate) => {
  const messages = languageGB.breedingMatings.reproductiveHistoryReport.hint;

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
 * @return {Function} Resolver ligado ao schema de filtro do relatório de Histórico Reprodutivo.
 */
export const reproductiveHistoryReportFilterSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(reproductiveHistoryReportFilterSchema(languageGB)) as any;

export default reproductiveHistoryReportFilterSchemaResolver;
