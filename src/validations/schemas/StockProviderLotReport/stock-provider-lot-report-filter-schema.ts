// src/validations/schemas/StockProviderLotReport/stock-provider-lot-report-filter-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do filtro do relatório "Lote/Fornecedor" (F-324,
// esteira 97-Esteiras/052, TASK-052-324-FE-01). Mirror ESTRUTURAL de
// `stock-movement-report-filter-schema.ts` (campo obrigatório via
// `fieldValidationSchema(languageGB).option<T>()`, mirror
// `expense-report-filter-schema.ts::order/order_direction/format`) — aqui é
// `provider_uuid` que é `.required()` (fidelidade adjudicada DEC-225,
// `StockProviderLotReportRequest`), com mensagem GENÉRICA
// (`defaltStrings.validations.requiredField`, sem string própria).
// `start_date`/`end_date` ficam `nullable()` SEM `.required()` — DECORATIVOS
// (CLM-010/DIV-001), mas `end_date >= start_date` continua validado via
// `.test()` quando ambas preenchidas (contrato de tela). `format` é
// `.required()` também (sempre tem valor default `pdf` pré-selecionado no
// form, `noClearable` no Select — mirror `expense-report-filter-schema.ts`).
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import fieldValidationSchema from '@/validations/field-validation-schema';

import type { LanguageDate } from '@/@types/language';
import type { ReportFormat } from '@/@types/v2/AccountsReports';

export const stockProviderLotReportFilterSchema = (languageGB: LanguageDate) => {
  const v = fieldValidationSchema(languageGB);
  const messages = languageGB.stockProviderLotReport.report;

  return yup.object({
    provider_uuid: v.option<string>(),
    start_date: yup.string().trim().nullable().default(null),
    end_date: yup
      .string()
      .trim()
      .nullable()
      .default(null)
      .test(
        'end-date-after-start-date',
        messages.validation.endDateBeforeStartDate,
        (value, context) => {
          const parent = context.parent as { start_date?: string | null };
          const startDate = parent.start_date;
          if (!value || !startDate) return true; // ambas opcionais — só valida quando as 2 existem
          return value >= startDate;
        }
      ),
    format: v.option<ReportFormat>(),
  });
};

export const stockProviderLotReportFilterSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(stockProviderLotReportFilterSchema(languageGB)) as any;

export default stockProviderLotReportFilterSchemaResolver;
