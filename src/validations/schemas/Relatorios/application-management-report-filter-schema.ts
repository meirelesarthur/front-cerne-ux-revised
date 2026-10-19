// src/validations/schemas/Relatorios/application-management-report-filter-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do filtro do relatório "Aplicação/Manejo" (F-230,
// esteira 97-Esteiras/077, F-230-plano-front.md §4). Mirror ESTRUTURAL de
// `costing-livestock-area-report-filter-schema.ts` (F-251), REMOVENDO o
// campo `grazings`.
//
// `production_cycle`/`areas` são OPCIONAIS — o contrato do backend
// (`F-230-plano-api.md §PASSO 3`) só exige `start_date`/`end_date`; a
// cascata IG-01 é UX de conveniência, não regra de validação de servidor.
//
// O schema valida a FORMA INTERNA do form (Option-based, react-select), NÃO
// o payload final do service (`ApplicationManagementReportParams`):
//   production_cycle: Option<string> | null
//   areas: Option<string>[] | null
//   start_date: string | null
//   end_date: string | null
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import type { LanguageDate } from '@/@types/language';

const optionSchema = yup
  .object({ value: yup.mixed(), label: yup.string() })
  .nullable()
  .default(null);

export const applicationManagementReportFilterSchema = (languageGB: LanguageDate) => {
  const messages = languageGB.applicationManagementReport.report;

  return yup.object({
    start_date: yup.string().trim().nullable().required(messages.validation.periodRequired),
    end_date: yup
      .string()
      .trim()
      .nullable()
      .required(messages.validation.periodRequired)
      .test('end-date-after-start-date', messages.validation.periodRequired, (value, context) => {
        const parent = context.parent as { start_date?: string | null };
        const startDate = parent.start_date;
        if (!value || !startDate) return true;
        return value >= startDate;
      }),
    production_cycle: optionSchema,
    areas: yup.array().of(optionSchema).nullable().default(null),
  });
};

export const applicationManagementReportFilterSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(applicationManagementReportFilterSchema(languageGB)) as any;

export default applicationManagementReportFilterSchemaResolver;
