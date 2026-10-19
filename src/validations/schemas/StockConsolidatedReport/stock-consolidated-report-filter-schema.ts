// src/validations/schemas/StockConsolidatedReport/stock-consolidated-report-filter-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do filtro do relatório "Estoque Consolidado"
// (F-323, feature_id e70b8cad, esteira 97-Esteiras/079). Mirror ESTRUTURAL de
// `stock-movement-report-filter-schema.ts` (campo `Option`-based obrigatório
// via `.required()` + demais opcionais) + `separation-schema.ts` (array
// `.min(1)` do multiselect).
//
// Valida a FORMA INTERNA do form (Option-based, react-select), NÃO o payload
// final do service (`StockConsolidatedReportParams`):
//   warehouses: Option<string>[]                        (obrigatório, min 1)
//   group/category/kind/product: Option<string> | null  (opcionais)
//   search: string | null                                (opcional)
//   date: string | null                                  (opcional, 'yyyy-MM-dd')
//   format: Option<StockConsolidatedReportFormat> | null (obrigatório — tem
//     default 'pdf' pré-selecionado, nunca fica null na prática, `v.option()`)
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import fieldValidationSchema from '@/validations/field-validation-schema';

import type { LanguageDate } from '@/@types/language';
import type { StockConsolidatedReportFormat } from '@/@types/v2/StockConsolidatedReport';

const optionSchema = yup
  .object({ value: yup.mixed(), label: yup.string() })
  .nullable()
  .default(null);

export const stockConsolidatedReportFilterSchema = (languageGB: LanguageDate) => {
  const v = fieldValidationSchema(languageGB);
  const messages = languageGB.stockConsolidatedReport.report.validation;

  return yup.object({
    warehouses: yup
      .array()
      .required(messages.warehousesRequired)
      .min(1, messages.warehousesRequired),
    group: optionSchema,
    category: optionSchema,
    kind: optionSchema,
    search: yup.string().trim().nullable(),
    product: optionSchema,
    date: yup.string().trim().nullable(),
    format: v.option<StockConsolidatedReportFormat>(),
  });
};

export const stockConsolidatedReportFilterSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(stockConsolidatedReportFilterSchema(languageGB)) as any;

export default stockConsolidatedReportFilterSchemaResolver;
