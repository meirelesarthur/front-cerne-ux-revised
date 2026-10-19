// src/validations/schemas/Dashboards/userAnalysis-filter-schema.ts
// Schema do filtro de Análise de Usuários (execução 046, TASK-UA-FE-03;
// atualizado por PLANO-ADMIN-USER-ANALYSIS §4) — `UA-FILTER-01`. Derivado de
// `fieldValidationSchema` (SEVERIDADE inviolável: validação nunca literal,
// nunca dentro de `src/pages/`).
//
// `tenant_uuid` NÃO usa `fv.option()` (sempre `.required()`) — o campo só
// existe/é obrigatório para `Gestor_Plataf`; para os demais papéis nem
// renderiza. Shape `Option` solto e opcional, mesmo precedente de
// `accountReconciliationReportFilterSchema` (`optionSchema` ad hoc).

import * as yup from 'yup';

import fieldValidationSchema from '@/validations/field-validation-schema';

import type { LanguageDate } from '@/@types/language';

const optionalOptionSchema = yup
  .object({ value: yup.mixed(), label: yup.string() })
  .nullable()
  .default(null);

export const userAnalysisFilterSchema = (languageGB: LanguageDate) => {
  const fv = fieldValidationSchema(languageGB);

  return yup.object({
    period: fv.option(),
    tenant_uuid: optionalOptionSchema,
  });
};
