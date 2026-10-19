// src/validations/schemas/IdentificationAnimalSisbovReport/identification-animal-sisbov-report-filter-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do filtro do relatório de Identificação/SISBOV
// (F-270, esteira 97-Esteiras/078, TASK-F270-F02,
// CONTRATOS/F-270-contrato-legado.md). `start_date`/`end_date` são AMBAS
// OBRIGATÓRIAS (`.required(messages.validation.periodRequired)`) — mirror
// da estrutura de `DeathAnimalReport/death-animal-report-filter-schema.ts`
// / `requisitions-report-filter-schema.ts` (datas required), NÃO o schema
// nullable do irmão SISBOV `BirthAnimalSisbovReport` (F-235, DEC-225 §7.3 —
// datas opcionais). `end_date >= start_date` continua validado via `.test()`.
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import type { LanguageDate } from '@/@types/language';

export const identificationAnimalSisbovReportFilterSchema = (languageGB: LanguageDate) => {
  const messages = languageGB.identificationAnimalSisbovReport.report;

  return yup.object({
    start_date: yup.string().trim().nullable().required(messages.validation.periodRequired),
    end_date: yup
      .string()
      .trim()
      .nullable()
      .required(messages.validation.periodRequired)
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

export const identificationAnimalSisbovReportFilterSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(identificationAnimalSisbovReportFilterSchema(languageGB)) as any;

export default identificationAnimalSisbovReportFilterSchemaResolver;
