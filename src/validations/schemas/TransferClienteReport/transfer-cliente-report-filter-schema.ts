// src/validations/schemas/TransferClienteReport/transfer-cliente-report-filter-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do filtro do relatório F-332 Romaneio Cliente
// (esteira 97-Esteiras/058, TASK-058-F332-FE-01). Mirror EXATO de
// `dre-report-filter-schema.ts`/`advance-report-filter-schema.ts` (par de
// datas SEMPRE `.required()`, `end_date >= start_date` via `.test()`) — aqui
// só há 1 lookup opcional (`clients`, SINGLE-select).
//
// Nenhuma string literal em mensagem de validação.
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import type { LanguageDate } from '@/@types/language';

const optionSchema = yup
  .object({ value: yup.mixed(), label: yup.string() })
  .nullable()
  .default(null);

export const transferClienteReportFilterSchema = (languageGB: LanguageDate) => {
  const messages = languageGB.transferClienteReport.report.validation;

  return yup.object({
    clients: optionSchema,
    start_date: yup.string().trim().nullable().required(messages.periodRequired),
    end_date: yup
      .string()
      .trim()
      .nullable()
      .required(messages.periodRequired)
      .test('end-date-after-start-date', messages.periodRequired, (value, context) => {
        const parent = context.parent as { start_date?: string | null };
        if (!value || !parent.start_date) return true;
        return value >= parent.start_date;
      }),
  });
};

export const transferClienteReportFilterSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(transferClienteReportFilterSchema(languageGB)) as any;

export default transferClienteReportFilterSchemaResolver;
