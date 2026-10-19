// src/validations/schemas/RecentActivities/recent-activities-filter-schema.ts
// -----------------------------------------------------------------------------
// Schema Yup do FILTRO de Atividades Recentes (UT-000690 / F-349), espelhando
// `RecentActivityIndexRequest` (ARQ-API §4.1): `start_date`/`end_date` opcionais
// (`Y-m-d`), `end_date >= start_date`. A mensagem vem da tradução. O 422 do
// servidor continua sendo a autoridade final.
//
// Vive em `src/validations/schemas/RecentActivities/` (NÃO em `pages/`).
// Datas como STRING 'yyyy-MM-dd' via `.matches()` — nunca `yup.date()`.
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import type { LanguageDate } from '@/@types/language';

const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export const recentActivitiesFilterSchema = (languageGB: LanguageDate) => {
  const messages = languageGB.recentActivities.recentActivity.validation;

  return yup.object({
    types: yup.array().of(yup.string().required()).nullable(),
    start_date: yup.string().nullable().matches(ISO_DATE_REGEX, {
      message: languageGB.defaltStrings.validations.invalidValue,
      excludeEmptyString: true,
    }),
    end_date: yup
      .string()
      .nullable()
      .matches(ISO_DATE_REGEX, {
        message: languageGB.defaltStrings.validations.invalidValue,
        excludeEmptyString: true,
      })
      .test('end-after-start', messages.endBeforeStart, (value, context) => {
        const start = context.parent.start_date as string | null | undefined;
        if (!value || !start) return true;
        // Comparação lexicográfica válida para strings ISO `yyyy-MM-dd`.
        return value >= start;
      }),
  });
};

export const recentActivitiesFilterSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(recentActivitiesFilterSchema(languageGB));

export default recentActivitiesFilterSchemaResolver;
