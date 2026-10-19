// src/validations/schemas/Dashboards/feedlotDashboard-filter-schema.ts
// Schema do filtro de Lotação de Currais (execução 046, TASK-LC-FE-04) —
// `LC-VALID-01`: "selecione um pátio e pelo menos um setor" (SweetAlert no
// legado, adaptado para validação inline derivada da tradução).

import * as yup from 'yup';

import fieldValidationSchema from '@/validations/field-validation-schema';

import type { LanguageDate } from '@/@types/language';

export const feedlotDashboardFilterSchema = (languageGB: LanguageDate) => {
  const fv = fieldValidationSchema(languageGB);
  const text = languageGB.dashboards.feedlotDashboard.filter.validation;

  return yup.object({
    yard: fv.option(),
    sectors: yup
      .array()
      .of(yup.object().required())
      .min(1, text.sectorsRequired)
      .required(text.sectorsRequired),
  });
};
