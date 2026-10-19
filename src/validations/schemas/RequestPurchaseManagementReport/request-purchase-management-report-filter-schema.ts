// src/validations/schemas/RequestPurchaseManagementReport/request-purchase-management-report-filter-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do filtro do relatório "Gerencial de Solicitações"
// (F-310, esteira 97-Esteiras/053, TASK-053-F310-FE-01). Mirror ESTRUTURAL de
// `cost-center-report-filter-schema.ts` (par `start_date`/`end_date` SEMPRE
// obrigatório, `end_date >= start_date` via `.test()`) +
// `accounts-payable-receivable-report-filter-schema.ts` (mensagens
// SEPARADAS para "obrigatório" vs. "intervalo inválido").
//
// `farm_id`/`type_request`/`status` são OPCIONAIS (`Option` nullable, SEM
// `.test()` de proibição condicional entre si — contrato de tela, dimensão
// cascatas = NAO_APLICAVEL, roteiro §3 item 1).
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import type { LanguageDate } from '@/@types/language';

const optionSchema = yup
  .object({ value: yup.mixed(), label: yup.string() })
  .nullable()
  .default(null);

export const requestPurchaseManagementReportFilterSchema = (languageGB: LanguageDate) => {
  const messages = languageGB.requestPurchaseManagementReport.report.validation;

  return yup.object({
    start_date: yup.string().trim().nullable().required(messages.periodRequired),
    end_date: yup
      .string()
      .trim()
      .nullable()
      .required(messages.periodRequired)
      .test('end-date-after-start-date', messages.invalidDateRange, (value, context) => {
        const parent = context.parent as { start_date?: string | null };
        if (!value || !parent.start_date) return true;
        return value >= parent.start_date;
      }),
    farm_id: optionSchema,
    type_request: optionSchema,
    status: optionSchema,
  });
};

export const requestPurchaseManagementReportFilterSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(requestPurchaseManagementReportFilterSchema(languageGB)) as any;

export default requestPurchaseManagementReportFilterSchemaResolver;
