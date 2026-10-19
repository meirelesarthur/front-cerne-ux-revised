// src/validations/schemas/Relatorios/costing-livestock-area-report-filter-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do filtro do relatório "Custeio/Área Pecuária"
// (F-251, CusteioAreaPecuaria-contrato-api.md §3/§7, lote 076). Mirror
// ESTRUTURAL de `production-costing-area-report-filter-schema.ts` (F-298,
// par `start_date`/`end_date` SEMPRE obrigatório no CLIENTE +
// `.test('end-date-after-start-date', ...)`), acrescido do campo `grazings`
// (opcional, sem `.test()` condicional — mesmo racional de `areas`).
//
// `production_cycle`/`areas`/`grazings` são OPCIONAIS — o contrato do
// backend (`CostingLivestockAreaReportRequest::rules()`) só exige
// `start_date`/`end_date`; a cascata IG-01 é UX de conveniência, não regra
// de validação de servidor.
//
// O schema valida a FORMA INTERNA do form (Option-based, react-select), NÃO
// o payload final do service (`CostingLivestockAreaReportParams`):
//   production_cycle: Option<string> | null
//   areas: Option<string>[] | null
//   grazings: Option<string>[] | null
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

export const costingLivestockAreaReportFilterSchema = (languageGB: LanguageDate) => {
  const messages = languageGB.costingLivestockAreaReport.report;

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
    grazings: yup.array().of(optionSchema).nullable().default(null),
  });
};

export const costingLivestockAreaReportFilterSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(costingLivestockAreaReportFilterSchema(languageGB)) as any;

export default costingLivestockAreaReportFilterSchemaResolver;
