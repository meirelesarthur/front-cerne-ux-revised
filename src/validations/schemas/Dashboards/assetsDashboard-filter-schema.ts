// src/validations/schemas/Dashboards/assetsDashboard-filter-schema.ts
// Schema do filtro de Ativos (execução 046, TASK-AT-FE-04) — os 4 campos são
// opcionais no contrato de tela (`AT-FILTER-*`, todos com default do servidor
// quando ausentes); só `months` sempre carrega valor (default 12), validado
// como select obrigatório para nunca submeter vazio. Derivado de
// `fieldValidationSchema` (SEVERIDADE inviolável).

import * as yup from 'yup';

import fieldValidationSchema from '@/validations/field-validation-schema';

import type { LanguageDate } from '@/@types/language';

export const assetsDashboardFilterSchema = (languageGB: LanguageDate) => {
  const fv = fieldValidationSchema(languageGB);

  return yup.object({
    months: fv.option(),
    families: yup.array().of(yup.object().required()).default([]),
    status: yup.object().nullable().default(null),
    proprietary: yup.object().nullable().default(null),
  });
};
