// src/validations/schemas/OfxImport/account-reconciliation-report-filter-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do filtro do Relatório de Conciliação de Contas
// Consolidadas (SURF-033/034, TASK-MES-FE-11 — CONDICIONAL, desbloqueado por
// DEC-177). Mirror `evolution-report-filter-schema.ts` (2 datas SEMPRE
// obrigatórias EM PAR — FLD-074/075, "consulta só ocorre quando presente
// junto com end_date") + `order_by` restrito ao enum FECHADO 'asc'/'desc'
// (FLD-079/FIL-015 — front nunca expõe texto livre).
//
// `account_uuid`/`provider_uuid`/`client_uuid` são OPCIONAIS (FLD-073/077/
// 078, default "todas"/"todos") — sem `.required()`.
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import type { LanguageDate } from '@/@types/language';

const optionSchema = yup
  .object({ value: yup.mixed(), label: yup.string() })
  .nullable()
  .default(null);

export const accountReconciliationReportFilterSchema = (languageGB: LanguageDate) => {
  const messages = languageGB.financial.ofxImport.consolidatedReport;

  return yup.object({
    account_uuid: optionSchema,
    start_date: yup.string().trim().nullable().required(messages.periodRequiredHint),
    end_date: yup
      .string()
      .trim()
      .nullable()
      .required(messages.periodRequiredHint)
      .test('end-date-after-start-date', messages.periodRequiredHint, (value, context) => {
        const parent = context.parent as { start_date?: string | null };
        const startDate = parent.start_date;
        if (!value || !startDate) return true;
        return value >= startDate;
      }),
    condition: yup.mixed<0 | 1>().oneOf([0, 1]).default(0),
    provider_uuid: optionSchema,
    client_uuid: optionSchema,
    order_by: yup.mixed<'asc' | 'desc'>().oneOf(['asc', 'desc']).required().default('desc'),
  });
};

export const accountReconciliationReportFilterSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(accountReconciliationReportFilterSchema(languageGB)) as any;

export default accountReconciliationReportFilterSchemaResolver;
