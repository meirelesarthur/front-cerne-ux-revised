// src/validations/schemas/Dashboards/rainfallDashboard-filter-schema.ts
// Schema do filtro de Pluviometria (execução 048, TASK-01-FE) — `period`
// sempre carrega valor (default `12m`, mirror `months` de Ativos); `area` é
// opcional (`CONTRATO-API-048-01 §2`, sem área = histórico da fazenda
// inteira). Derivado de `fieldValidationSchema` (SEVERIDADE inviolável).

import * as yup from 'yup';

import fieldValidationSchema from '@/validations/field-validation-schema';

import type { LanguageDate } from '@/@types/language';

export const rainfallDashboardFilterSchema = (languageGB: LanguageDate) => {
  const fv = fieldValidationSchema(languageGB);

  return yup.object({
    period: fv.option(),
    area: yup.object().nullable().default(null),
  });
};
