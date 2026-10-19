// src/validations/schemas/Relatorios/ans-report-filter-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do filtro do relatório "ANS" (F-229, lote 076).
// Mirror ESTRUTURAL de `costing-animal-report-filter-schema.ts`: par
// `start_date`/`end_date` SEMPRE obrigatório, `end_date >= start_date` via
// `.test()`. Sem nenhum outro campo — `AnsReportRequest::rules()` (API real,
// lida diretamente) só valida `start_date`/`end_date`/`report_type`, e
// `report_type` é decidido pelo BOTÃO clicado, não por campo do form (mirror
// `CusteioAnimalReportFilterForm`/`FiscalDifferenceReportFilterForm`).
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import type { LanguageDate } from '@/@types/language';

export const ansReportFilterSchema = (languageGB: LanguageDate) => {
  const messages = languageGB.ansReport.report;

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
 * @return {Function} Resolver ligado ao schema de filtro do relatório ANS.
 */
export const ansReportFilterSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(ansReportFilterSchema(languageGB)) as any;

export default ansReportFilterSchemaResolver;
