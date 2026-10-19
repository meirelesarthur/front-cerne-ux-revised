// src/validations/schemas/Relatorios/sale-general-report-filter-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do filtro do relatório "Vendas/Cliente" (F-317,
// esteira 077, F-317-plano-front.md). Mirror ESTRUTURAL de
// `sale-client-report-filter-schema.ts` (F-313): `start_date`/`end_date`
// SEMPRE obrigatórios + `.test('end-date-after-start-date', ...)`.
//
// `client_uuid`/`product_uuid` são OPCIONAIS, SEM `.test()` condicional —
// nenhum campo restringe o outro (fiel ao legado). `report_type` é validado
// como domínio fechado `'pdf' | 'excel'` (Select estático de 2 opções, sem
// digitação livre) — NUNCA `0|1` (F-313).
//
// O schema valida a FORMA INTERNA do form (Option-based, react-select), NÃO
// o payload final do service (`SaleGeneralReportParams`):
//   start_date: string | null
//   end_date: string | null
//   client_uuid: Option<string> | null
//   product_uuid: Option<string> | null
//   report_type: 'pdf' | 'excel'
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import type { LanguageDate } from '@/@types/language';

const optionSchema = yup
  .object({ value: yup.mixed(), label: yup.string() })
  .nullable()
  .default(null);

const REPORT_FORMATS = ['pdf', 'excel'] as const;

export const saleGeneralReportFilterSchema = (languageGB: LanguageDate) => {
  const messages = languageGB.saleGeneralReport.report;

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
    report_type: yup
      .mixed<(typeof REPORT_FORMATS)[number]>()
      .oneOf([...REPORT_FORMATS])
      .required(),
  });
};

export const saleGeneralReportFilterSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(saleGeneralReportFilterSchema(languageGB)) as any;

export default saleGeneralReportFilterSchemaResolver;
