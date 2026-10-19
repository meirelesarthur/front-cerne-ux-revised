// src/validations/schemas/Relatorios/sale-client-report-filter-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do filtro do relatório "Cliente/Produto" (F-313,
// esteira 054). Mirror ESTRUTURAL de `sale-product-report-filter-schema.ts`
// (F-315): `start_date`/`end_date` SEMPRE obrigatórios no CLIENTE +
// `.test('end-date-after-start-date', ...)`.
//
// `client_uuid`/`product_uuid` são OPCIONAIS, SEM `.test()` condicional — a
// dimensão "cascatas" é `NAO_APLICAVEL` (roteiro-front-F313 §3 FID-G3F):
// nenhum campo restringe o outro. `type` é validado como domínio fechado
// `0 | 1` (Select estático de 2 opções, sem digitação livre — mirror
// `sale-product-report-filter-schema.ts → type`).
//
// O schema valida a FORMA INTERNA do form (Option-based, react-select), NÃO
// o payload final do service (`SaleClientReportParams`):
//   start_date: string | null
//   end_date: string | null
//   client_uuid: Option<string> | null
//   product_uuid: Option<string> | null
//   type: 0 | 1
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import type { LanguageDate } from '@/@types/language';

const optionSchema = yup
  .object({ value: yup.mixed(), label: yup.string() })
  .nullable()
  .default(null);

const REPORT_TYPES = [0, 1] as const;

export const saleClientReportFilterSchema = (languageGB: LanguageDate) => {
  const messages = languageGB.saleClientReport.report;

  return yup.object({
    start_date: yup.string().trim().nullable().required(messages.validation.startDateRequired),
    end_date: yup
      .string()
      .trim()
      .nullable()
      .required(messages.validation.endDateRequired)
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
    client_uuid: optionSchema,
    product_uuid: optionSchema,
    type: yup
      .mixed<(typeof REPORT_TYPES)[number]>()
      .oneOf([...REPORT_TYPES])
      .required(),
  });
};

export const saleClientReportFilterSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(saleClientReportFilterSchema(languageGB)) as any;

export default saleClientReportFilterSchemaResolver;
