// src/validations/schemas/Dashboards/depreciationDashboard-filter-schema.ts
// Schema do filtro de Depreciações (execução 048, TASK-02-FE) — `year` e
// `assetType` sempre carregam valor (default ano corrente / `all`, mirror
// `months` de Ativos). Derivado de `fieldValidationSchema` (SEVERIDADE
// inviolável).

import * as yup from 'yup';

import fieldValidationSchema from '@/validations/field-validation-schema';

import type { LanguageDate } from '@/@types/language';

export const depreciationDashboardFilterSchema = (languageGB: LanguageDate) => {
  const fv = fieldValidationSchema(languageGB);

  return yup.object({
    year: fv.option(),
    assetType: fv.option(),
  });
};
