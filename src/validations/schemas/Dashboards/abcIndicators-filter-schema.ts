// src/validations/schemas/Dashboards/abcIndicators-filter-schema.ts
// Schema do filtro do Programa ABC Corte (execução 046, TASK-ABC-FE-04) —
// `ABC-FILTER-02` (Pasto/Módulo obrigatório) + `ABC-VALID-01` (datas válidas,
// faixa 1900-12-31..2100-12-31, fim >= início). Derivado de
// `fieldValidationSchema` (SEVERIDADE inviolável).

import * as yup from 'yup';

import fieldValidationSchema from '@/validations/field-validation-schema';

import type { LanguageDate } from '@/@types/language';

const MIN_DATE = '1900-12-31';
const MAX_DATE = '2100-12-31';

export const abcIndicatorsFilterSchema = (languageGB: LanguageDate) => {
  const fv = fieldValidationSchema(languageGB);
  const text = languageGB.dashboards.abcIndicators.filter.validation;

  const dateInRange = fv
    .date()
    .test(
      'date-range',
      text.dateRange,
      (value) => !value || (value >= MIN_DATE && value <= MAX_DATE)
    );

  return yup.object({
    harvest: yup.object().nullable().default(null),
    grazing: fv.option(),
    startDate: dateInRange,
    endDate: dateInRange.test(
      'end-after-start',
      text.endDateBeforeStartDate,
      (value, ctx) => !value || !ctx.parent.startDate || value >= ctx.parent.startDate
    ),
  });
};
