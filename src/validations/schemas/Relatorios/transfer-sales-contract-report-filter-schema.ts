// src/validations/schemas/Relatorios/transfer-sales-contract-report-filter-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do filtro do relatório "Romaneio/Vendas/Contrato"
// (F-331, esteira 97-Esteiras/008, TASK-RVC-FE-01). Mirror ESTRUTURAL de
// `sale-client-report-filter-schema.ts`: `start_date`/`end_date` SEMPRE
// obrigatórios + `.test('end-date-after-start-date', ...)` — preserva o
// bloqueio client-side que o legado tinha no datepicker global (C-10/E37).
//
// `client`/`type`/`product`/`contract` são OPCIONAIS, SEM `.test()`
// condicional — cascatas e condicionais são `NAO_APLICAVEL` (FID-G3F
// §13/§14): nenhum filtro restringe outro.
//
// O schema valida a FORMA INTERNA do form (Option-based, react-select), NÃO
// o payload final do service (`TransferSalesContractReportParams`).
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import type { LanguageDate } from '@/@types/language';

const optionSchema = yup
  .object({ value: yup.mixed(), label: yup.string() })
  .nullable()
  .default(null);

const REPORT_FORMATS = ['pdf', 'xlsx'] as const;

export const transferSalesContractReportFilterSchema = (languageGB: LanguageDate) => {
  const messages = languageGB.transferSalesContractReport.report;

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
    client: optionSchema,
    type: optionSchema,
    product: optionSchema,
    contract: optionSchema,
    format: yup
      .object({
        value: yup.mixed<(typeof REPORT_FORMATS)[number]>().oneOf([...REPORT_FORMATS]),
        label: yup.string(),
      })
      .nullable()
      .required(),
  });
};

export const transferSalesContractReportFilterSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(transferSalesContractReportFilterSchema(languageGB)) as any;

export default transferSalesContractReportFilterSchemaResolver;
