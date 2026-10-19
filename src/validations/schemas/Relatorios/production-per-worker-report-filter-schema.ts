// src/validations/schemas/Relatorios/production-per-worker-report-filter-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do filtro do relatório "Prod./Colaborador" (F-300,
// lote 079, F-300-plano-frontend.md TASK-300-FE-01). Mirror ESTRUTURAL de
// `production-costing-area-report-filter-schema.ts` (F-298): par
// `start_date`/`end_date` SEMPRE obrigatório no CLIENTE (mirror server —
// `ProductionPerWorkerReportRequest::rules()` também exige `required` nos
// dois) + `.test('end-date-after-start-date', ...)`.
//
// `teams`/`production_cycle`/`areas`/`employees` são OPCIONAIS — nenhum
// deles é obrigatório no servidor (`sometimes` em todos). A cascata
// `production_cycle`→`areas`+datas é UX de conveniência (IG-01/IG-02), não
// regra de validação.
//
// O schema valida a FORMA INTERNA do form (Option-based), NÃO o payload
// final do service (`ProductionPerWorkerReportParams`):
//   teams: Option<string>[] | null
//   production_cycle: Option<string> | null
//   areas: Option<string>[] | null
//   start_date: string | null
//   end_date: string | null
//   employees: Option<string>[] | null
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import type { LanguageDate } from '@/@types/language';

const optionSchema = yup
  .object({ value: yup.mixed(), label: yup.string() })
  .nullable()
  .default(null);

export const productionPerWorkerReportFilterSchema = (languageGB: LanguageDate) => {
  const messages = languageGB.productionPerWorkerReport.report;

  return yup.object({
    teams: yup.array().of(optionSchema).nullable().default(null),
    production_cycle: optionSchema,
    areas: yup.array().of(optionSchema).nullable().default(null),
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
    employees: yup.array().of(optionSchema).nullable().default(null),
  });
};

export const productionPerWorkerReportFilterSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(productionPerWorkerReportFilterSchema(languageGB)) as any;

export default productionPerWorkerReportFilterSchemaResolver;
