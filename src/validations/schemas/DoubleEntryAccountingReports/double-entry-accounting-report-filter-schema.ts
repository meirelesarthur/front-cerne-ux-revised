// src/validations/schemas/DoubleEntryAccountingReports/double-entry-accounting-report-filter-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do filtro do relatório de Partida Dobrada
// (F-257, TASK-PDR-FE-01, esteira 069). Mirror direto de
// `account-reconciliation-report-filter-schema.ts` (2 datas SEMPRE
// obrigatórias EM PAR + `order_by` restrito ao enum fechado 'asc'/'desc').
//
// `plan_account_uuid` é OPCIONAL, mas `prohibited_if:report_type,
// balance_sheet` no servidor (`DoubleEntryAccountingReportRequest::rules()`)
// — o `.test()` abaixo é a 2ª camada de defesa (a 1ª é o disable+clear de UI
// em `TASK-PDR-FE-04`), evitando que um estado inconsistente de render
// submeta um valor que o servidor rejeitaria com 422.
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import type { LanguageDate } from '@/@types/language';

const optionSchema = yup
  .object({ value: yup.mixed(), label: yup.string() })
  .nullable()
  .default(null);

const REPORT_TYPES = ['journal', 'general_ledger', 'trial_balance', 'balance_sheet'] as const;

export const doubleEntryAccountingReportFilterSchema = (languageGB: LanguageDate) => {
  const messages = languageGB.accountingEntries.accountingEntry.report;

  return yup.object({
    report_type: yup
      .mixed<(typeof REPORT_TYPES)[number]>()
      .oneOf([...REPORT_TYPES])
      .required(messages.validation.reportTypeRequired),
    plan_account_uuid: optionSchema.test(
      'prohibited-on-balance-sheet',
      messages.validation.planAccountProhibited,
      (value, context) => {
        const parent = context.parent as { report_type?: string };
        if (parent.report_type !== 'balance_sheet') return true;
        return value === null || value === undefined;
      }
    ),
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
    order_by: yup.mixed<'asc' | 'desc'>().oneOf(['asc', 'desc']).required().default('desc'),
  });
};

export const doubleEntryAccountingReportFilterSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(doubleEntryAccountingReportFilterSchema(languageGB)) as any;

export default doubleEntryAccountingReportFilterSchemaResolver;
