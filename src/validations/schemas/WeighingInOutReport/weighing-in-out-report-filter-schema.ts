// src/validations/schemas/WeighingInOutReport/weighing-in-out-report-filter-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do filtro do relatório F-336 Pesagem Entrada/Saída
// (esteira 97-Esteiras/058, FRONT-F336-plano.md §3/§4). Mirror ESTRUTURAL de
// `weighing-harvest-report-filter-schema.ts`/`transfer-cliente-report-filter-
// schema.ts` para o par `start_date`/`end_date` (AMBAS obrigatórias,
// `end_date >= start_date` via `.test()`).
//
// `product` é OBRIGATÓRIO real no schema (CORRIGE C9/FID-13 do legado, plano
// §4) — `optionSchema.required(...)`, NÃO só uma dica visual.
// `client`/`warehouse` são OPCIONAIS — `nullable().default(null)`, SEM
// `.required()`. `format` usa `fieldValidationSchema(languageGB).option<...>()`
// (sempre tem valor default `pdf` pré-selecionado no form, `noClearable` no
// Select) — mirror EXATO `weighing-harvest-report-filter-schema.ts::format`.
//
// O schema valida a FORMA INTERNA do form (Option-based, react-select), NÃO o
// payload final do service (`WeighingInOutReportParams`).
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import fieldValidationSchema from '@/validations/field-validation-schema';

import type { LanguageDate } from '@/@types/language';
import type { WeighingInOutReportFormat } from '@/@types/v2/WeighingInOutReport';

const optionSchema = yup
  .object({ value: yup.mixed(), label: yup.string() })
  .nullable()
  .default(null);

export const weighingInOutReportFilterSchema = (languageGB: LanguageDate) => {
  const v = fieldValidationSchema(languageGB);
  const messages = languageGB.weighingInOutReport.report.validation;

  return yup.object({
    start_date: yup.string().trim().nullable().required(messages.periodRequired),
    end_date: yup
      .string()
      .trim()
      .nullable()
      .required(messages.periodRequired)
      .test('end-date-after-start-date', messages.periodRequired, (value, context) => {
        const parent = context.parent as { start_date?: string | null };
        const startDate = parent.start_date;
        if (!value || !startDate) return true; // ambas obrigatórias — a ausência já reprova acima
        return value >= startDate;
      }),
    product: optionSchema.required(messages.productRequired),
    client: optionSchema,
    warehouse: optionSchema,
    format: v.option<WeighingInOutReportFormat>(),
  });
};

export const weighingInOutReportFilterSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(weighingInOutReportFilterSchema(languageGB)) as any;

export default weighingInOutReportFilterSchemaResolver;
