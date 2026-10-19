// src/validations/schemas/WeighingHarvestReport/weighing-harvest-report-filter-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do filtro do relatório "Pesagens/Colheita" (F-335,
// execução 053, roteiro-front-F335-pesagens-colheita.md §3/§6-TASK-01).
// Mirror ESTRUTURAL de `paid-interest-report-filter-schema.ts` para o par
// `start_date`/`end_date` — AMBAS obrigatórias (CORRIGE CL-09/DIV-01: o
// legado só re-renderizava o filtro em branco sem aviso), `end_date >=
// start_date` via `.test()`. Os demais 5 campos (`product_uuid`/
// `area_uuid`/`warehouse_uuid`/`client_uuid`/`type`) são OPCIONAIS —
// `nullable().default(null)`, SEM `.required()` — mirror
// `stock-movement-report-filter-schema.ts::products`. `format` usa
// `fieldValidationSchema(languageGB).option<ReportFormat>()` (sempre tem
// valor default `pdf` pré-selecionado no form, `noClearable` no Select) —
// mirror EXATO `stock-provider-lot-report-filter-schema.ts::format`.
//
// O schema valida a FORMA INTERNA do form (Option-based, react-select), NÃO o
// payload final do service (`WeighingHarvestReportParams`).
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import fieldValidationSchema from '@/validations/field-validation-schema';

import type { LanguageDate } from '@/@types/language';
import type { ReportFormat } from '@/@types/v2/AccountsReports';

const optionSchema = yup
  .object({ value: yup.mixed(), label: yup.string() })
  .nullable()
  .default(null);

export const weighingHarvestReportFilterSchema = (languageGB: LanguageDate) => {
  const v = fieldValidationSchema(languageGB);
  const messages = languageGB.weighingHarvestReport.report;

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
        if (!value || !startDate) return true; // ambas obrigatórias — a ausência já reprova acima
        return value >= startDate;
      }),
    product_uuid: optionSchema,
    area_uuid: optionSchema,
    warehouse_uuid: optionSchema,
    client_uuid: optionSchema,
    type: optionSchema,
    format: v.option<ReportFormat>(),
  });
};

export const weighingHarvestReportFilterSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(weighingHarvestReportFilterSchema(languageGB)) as any;

export default weighingHarvestReportFilterSchemaResolver;
