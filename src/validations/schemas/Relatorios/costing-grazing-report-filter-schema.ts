// src/validations/schemas/Relatorios/costing-grazing-report-filter-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do filtro do relatório "Custeio/Módulo" (F-250,
// TASK-CM-FE-01, esteira 080). Mirror EXATO de
// `Relatorios/costing-batch-report-filter-schema.ts`: `start_date`/
// `end_date` `required`, teste `end_date >= start_date`. `grazings` SEM
// validação de schema — autoridade final é o 422 do backend (`Rule::exists`,
// contrato de tela §4/§7).
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import type { LanguageDate } from '@/@types/language';

export const costingGrazingReportFilterSchema = (languageGB: LanguageDate) => {
  const messages = languageGB.costingGrazingReport.report;

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
 * @return {Function} Resolver ligado ao schema de filtro do relatório de Custeio/Módulo.
 */
export const costingGrazingReportFilterSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(costingGrazingReportFilterSchema(languageGB)) as any;

export default costingGrazingReportFilterSchemaResolver;
