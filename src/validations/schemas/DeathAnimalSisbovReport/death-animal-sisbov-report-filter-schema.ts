// src/validations/schemas/DeathAnimalSisbovReport/death-animal-sisbov-report-filter-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do filtro do relatório de Mortes/SISBOV (F-253,
// esteira 97-Esteiras/054, TASK-054-253-FE-01). Mirror ESTRUTURAL EXATO de
// `BirthAnimalSisbovReport/birth-animal-sisbov-report-filter-schema.ts`
// (irmão F-235) — ambas as datas são OPCIONAIS, `end_date >= start_date`
// validado via `.test()` só quando AMBAS estão presentes.
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import type { LanguageDate } from '@/@types/language';

export const deathAnimalSisbovReportFilterSchema = (languageGB: LanguageDate) => {
  const messages = languageGB.deathAnimalSisbovReport.report;

  return yup.object({
    start_date: yup.string().trim().nullable().default(null),
    end_date: yup
      .string()
      .trim()
      .nullable()
      .default(null)
      .test(
        'end-date-after-start-date',
        messages.validation.endDateBeforeStartDate,
        (value, context) => {
          const parent = context.parent as { start_date?: string | null };
          const startDate = parent.start_date;
          if (!value || !startDate) return true;
          return value >= startDate;
        }
      ),
  });
};

export const deathAnimalSisbovReportFilterSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(deathAnimalSisbovReportFilterSchema(languageGB)) as any;

export default deathAnimalSisbovReportFilterSchemaResolver;
