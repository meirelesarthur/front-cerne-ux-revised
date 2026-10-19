// src/validations/schemas/BirthAnimalSisbovReport/birth-animal-sisbov-report-filter-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do filtro do relatório de Nascimentos/SISBOV
// (F-235, esteira 97-Esteiras/052, TASK-052-235-FE-01). Mirror ESTRUTURAL de
// `Dre/dre-report-filter-schema.ts`, mas AMBAS as datas são OPCIONAIS —
// diferente do par sempre obrigatório da DRE/`pregnant-cows-report-filter-
// schema.ts`. Fidelidade adjudicada (DEC-225 §7.3): o legado só validava
// `required` no HTML, sem regra server-side; a API nova
// (`BirthAnimalSisbovReportRequest`) rejeita só entrada malformada/
// invertida, nunca a ausência. `end_date >= start_date` continua validado
// via `.test()`, mas só quando AMBAS as datas estão presentes.
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import type { LanguageDate } from '@/@types/language';

export const birthAnimalSisbovReportFilterSchema = (languageGB: LanguageDate) => {
  const messages = languageGB.birthAnimalSisbovReport.report;

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

export const birthAnimalSisbovReportFilterSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(birthAnimalSisbovReportFilterSchema(languageGB)) as any;

export default birthAnimalSisbovReportFilterSchemaResolver;
