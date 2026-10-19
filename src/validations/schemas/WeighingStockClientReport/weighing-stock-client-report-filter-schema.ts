// src/validations/schemas/WeighingStockClientReport/weighing-stock-client-report-filter-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do filtro do relatório "Pesagem/Armazém/Cliente"
// (F-337, esteira 060, DEC-267, ROTEIRO-F337-FRONT.md §3.E). Mirror
// ESTRUTURAL de `stock-abc-report-filter-schema.ts`, mas SEM
// `start_date`/`end_date` — o contrato de API
// (`WeighingStockClientReportRequest::rules()`) não tem filtro de período.
//
// `product`/`client`/`warehouse` são OPCIONAIS (DEC-267 — vazio = relatório
// completo), `optionSchema` SEM `.required()` — mirror EXATO de
// `client`/`warehouse` em `weighing-in-out-report-filter-schema.ts`, mas os
// 3 aqui são opcionais (F-336 tem `product` obrigatório; aqui nenhum é).
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import fieldValidationSchema from '@/validations/field-validation-schema';

import type { LanguageDate } from '@/@types/language';
import type { WeighingStockClientReportFormat } from '@/@types/v2/WeighingStockClientReport';

const optionSchema = yup
  .object({ value: yup.mixed(), label: yup.string() })
  .nullable()
  .default(null);

export const weighingStockClientReportFilterSchema = (languageGB: LanguageDate) => {
  const v = fieldValidationSchema(languageGB);

  return yup.object({
    product: optionSchema, // opcional — DEC-267
    client: optionSchema, // opcional — DEC-267
    warehouse: optionSchema, // opcional — DEC-267
    format: v.option<WeighingStockClientReportFormat>(),
  });
};

export const weighingStockClientReportFilterSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(weighingStockClientReportFilterSchema(languageGB)) as any;

export default weighingStockClientReportFilterSchemaResolver;
