// src/validations/schemas/Relatorios/financings-report-filter-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do filtro do relatório "Financiamentos" (F-265,
// execução 97-Esteiras/078, TASK-F265-F02). Mirror ESTRUTURAL de
// `products-exit-cost-center-report-filter-schema.ts` — `start_date`/
// `end_date` OBRIGATÓRIOS (fidelidade ao legado, RN-04) com
// `end_date >= start_date` (FRONT-03b, melhoria não-bloqueante). SEM campos
// de select (diferente do F-301).
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import type { LanguageDate } from '@/@types/language';

export const financingsReportFilterSchema = (languageGB: LanguageDate) => {
  const messages = languageGB.financingsReport.report;

  return yup.object({
    start_date: yup.string().trim().nullable().required(messages.validation.periodRequired),
    end_date: yup
      .string()
      .trim()
      .nullable()
      .required(messages.validation.periodRequired)
      .test(
        'end-date-after-start-date',
        messages.validation.endDateAfterStartDate,
        (value, context) => {
          const parent = context.parent as { start_date?: string | null };
          const startDate = parent.start_date;
          if (!value || !startDate) return true;
          return value >= startDate;
        }
      ),
  });
};

export const financingsReportFilterSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(financingsReportFilterSchema(languageGB)) as any;

export default financingsReportFilterSchemaResolver;
