// src/validations/schemas/Relatorios/receipts-report-filter-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do filtro do relatório "Recebimentos" (F-305,
// TASK-RCB-FE-01, esteira 074). Mirror ESTRUTURAL de
// `food-beat-aggregate-report-filter-schema.ts` (par `start_date`/`end_date`
// SEMPRE obrigatório, `end_date >= start_date` via `.test()`).
//
// `product`/`center`/`category` são OPCIONAIS, SEM validação de schema — a
// autoridade final é o 422 do backend (`Rule::exists` por campo, contrato
// front §4/§3).
//
// O schema valida a FORMA INTERNA do form (Option-based, react-select), NÃO
// o payload final do service (`ReceiptsReportParams`):
//   product: Option<string> | null
//   center: Option<string> | null
//   category: Option<string> | null
//   start_date: string | null
//   end_date: string | null
//   type: Option<'pdf' | 'excel'>
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import type { LanguageDate } from '@/@types/language';

const optionSchema = yup
  .object({ value: yup.mixed(), label: yup.string() })
  .nullable()
  .default(null);

export const receiptsReportFilterSchema = (languageGB: LanguageDate) => {
  const messages = languageGB.receiptsReport.report;

  return yup.object({
    start_date: yup.string().trim().nullable().required(messages.validation.periodRequired),
    end_date: yup
      .string()
      .trim()
      .nullable()
      .required(messages.validation.periodRequired)
      .test('end-date-after-start-date', messages.validation.periodOrder, (value, context) => {
        const parent = context.parent as { start_date?: string | null };
        const startDate = parent.start_date;
        if (!value || !startDate) return true;
        return value >= startDate;
      }),
    product: optionSchema,
    center: optionSchema,
    category: optionSchema,
  });
};

export const receiptsReportFilterSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(receiptsReportFilterSchema(languageGB)) as any;

export default receiptsReportFilterSchemaResolver;
