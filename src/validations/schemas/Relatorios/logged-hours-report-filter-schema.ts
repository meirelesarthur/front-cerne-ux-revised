// src/validations/schemas/Relatorios/logged-hours-report-filter-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do filtro do relatório "Horas Logadas" (F-275,
// esteira 97-Esteiras/012, Tarefa 47). Mirror ESTRUTURAL de
// `income-statement-report-filter-schema.ts` — só `start_date`/`end_date` são
// obrigatórios (`end_date >= start_date`); `tenant_uuid`/`farm_uuid` são
// condicionais (contrato de tela §4), não validados aqui (a poda real ocorre
// no `buildParams` da página, mirror `FilterSideUserAnalysis.tsx:96-97`).
//
// Valida a FORMA INTERNA do form (Option-based, react-select), NÃO o payload
// final do service (`LoggedHoursReportParams`).
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import type { LanguageDate } from '@/@types/language';

const optionSchema = yup
  .object({ value: yup.mixed(), label: yup.string() })
  .nullable()
  .default(null);

export const loggedHoursReportFilterSchema = (languageGB: LanguageDate) => {
  const messages = languageGB.loggedHoursReport.report;

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
          if (!value || !parent.start_date) return true;
          return value >= parent.start_date;
        }
      ),
    tenant_uuid: optionSchema,
    farm_uuid: optionSchema,
  });
};

export const loggedHoursReportFilterSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(loggedHoursReportFilterSchema(languageGB)) as any;

export default loggedHoursReportFilterSchemaResolver;
