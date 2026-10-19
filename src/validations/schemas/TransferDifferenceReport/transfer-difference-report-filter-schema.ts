// src/validations/schemas/TransferDifferenceReport/transfer-difference-report-filter-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do filtro do relatório "Romaneio/Diferença"
// (Tarefa 49, esteira 97-Esteiras/014). Mirror direto de
// `accounts-payable-receivable-report-filter-schema.ts` (par de data
// OBRIGATÓRIO com `.test()` de `fim >= início`) — `start_date`/`end_date`
// obrigatórios (fecha 422 do servidor antes da chamada), `client`
// `optionSchema` nullable (SINGLE-select, não array), `format` via
// `fieldValidationSchema().option<T>()`.
//
// Nenhuma string literal em mensagem de validação.
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import fieldValidationSchema from '@/validations/field-validation-schema';

import type { LanguageDate } from '@/@types/language';
import type { TransferDifferenceReportFormat } from '@/@types/v2/TransferDifferenceReport';

const optionSchema = yup
  .object({ value: yup.mixed(), label: yup.string() })
  .nullable()
  .default(null);

export const transferDifferenceReportFilterSchema = (languageGB: LanguageDate) => {
  const v = fieldValidationSchema(languageGB);
  const messages = languageGB.transferDifferenceReport.report.validation;

  return yup.object({
    client: optionSchema,
    start_date: yup.string().trim().nullable().required(messages.datesRequired),
    end_date: yup
      .string()
      .trim()
      .nullable()
      .required(messages.datesRequired)
      .test('end-date-after-start-date', messages.invalidDateRange, (value, context) => {
        const parent = context.parent as { start_date?: string | null };
        if (!value || !parent.start_date) return true;
        return value >= parent.start_date;
      }),
    format: v.option<TransferDifferenceReportFormat>(),
  });
};

export const transferDifferenceReportFilterSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(transferDifferenceReportFilterSchema(languageGB)) as any;

export default transferDifferenceReportFilterSchemaResolver;
