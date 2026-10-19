// src/validations/schemas/Dre/dre-report-filter-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do filtro do relatório de DRE (F-259, TASK-DRE-FE-01,
// esteira 049). Mirror direto de
// `double-entry-accounting-report-filter-schema.ts` (par `start_date`/
// `end_date` SEMPRE obrigatório, `end_date >= start_date` via `.test()`).
//
// `center_id` é OPCIONAL e SEM `.test()` de proibição condicional — diferente
// da tela irmã de Partida Dobrada (`plan_account_uuid`), aqui o Centro de
// Custo é sempre livre, nenhum outro campo o restringe (contrato-tela-dre-fe.md
// §3, TASK-DRE-FE-01).
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import type { LanguageDate } from '@/@types/language';

const optionSchema = yup
  .object({ value: yup.mixed(), label: yup.string() })
  .nullable()
  .default(null);

const TYPE_REPORTS = [1, 2] as const;

export const dreReportFilterSchema = (languageGB: LanguageDate) => {
  const messages = languageGB.dre.report;

  return yup.object({
    type_report: yup
      .mixed<(typeof TYPE_REPORTS)[number]>()
      .oneOf([...TYPE_REPORTS])
      .required(messages.validation.typeReportRequired),
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
    center_id: optionSchema,
  });
};

export const dreReportFilterSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(dreReportFilterSchema(languageGB)) as any;

export default dreReportFilterSchemaResolver;
