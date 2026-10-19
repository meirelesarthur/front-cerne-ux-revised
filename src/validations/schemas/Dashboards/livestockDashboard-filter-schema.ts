// src/validations/schemas/Dashboards/livestockDashboard-filter-schema.ts
// Schema do filtro de Pecuária de Corte (execução 048, TASK-05-FE) — todos
// os campos são OPCIONAIS no contrato de API (`RTE-001`); diferente do
// Programa ABC Corte, aqui não há obrigatoriedade de safra/pasto — mirror
// estrutural de `abcIndicatorsFilterSchema` (validação de faixa de data),
// sem o `.required()` de `grazing`.

import * as yup from 'yup';

import fieldValidationSchema from '@/validations/field-validation-schema';

import type { LanguageDate } from '@/@types/language';

const MIN_DATE = '1900-12-31';
const MAX_DATE = '2100-12-31';

export const livestockDashboardFilterSchema = (languageGB: LanguageDate) => {
  const fv = fieldValidationSchema(languageGB);
  const text = languageGB.dashboards.livestockDashboard.filter.validation;

  const dateInRange = fv
    .date()
    .nullable()
    .notRequired()
    .test(
      'date-range',
      text.dateRange,
      (value) => !value || (value >= MIN_DATE && value <= MAX_DATE)
    );

  return yup.object({
    harvest: yup.object().nullable().default(null),
    breed: yup.object().nullable().default(null),
    category: yup.object().nullable().default(null),
    startDate: dateInRange,
    endDate: dateInRange.test(
      'end-after-start',
      text.endDateBeforeStartDate,
      (value, ctx) => !value || !ctx.parent.startDate || value >= ctx.parent.startDate
    ),
  });
};
