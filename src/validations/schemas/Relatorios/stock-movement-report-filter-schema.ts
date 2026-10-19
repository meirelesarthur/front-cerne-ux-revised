// src/validations/schemas/Relatorios/stock-movement-report-filter-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do filtro do relatório "Movimentação de Estoque"
// (F-1f1d23e3, TASK-MOV-FE-01, esteira 074). Mirror ESTRUTURAL de
// `cost-calculation-report-filter-schema.ts`/`paid-interest-report-filter-schema.ts`,
// DIVERGINDO no campo obrigatório: aqui é `warehouse` que é `.required()`
// (mirror do contrato API `PASSO 3`) — `start_date`/`end_date` ficam
// `nullable()` SEM `.required()`, diferente dos siblings `JurosPagos`/
// `ApuracaoCusto`/`EvolucaoRebanho`, que exigem o par de datas.
//
// O schema valida a FORMA INTERNA do form (Option-based, react-select), NÃO o
// payload final do service (`StockMovementReportParams`):
//   warehouse: Option<string> | null    (obrigatório)
//   start_date: string | null           (opcional)
//   end_date: string | null             (opcional; >= start_date só quando ambas preenchidas)
//   products: Option<string>[] | null   (opcional)
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import type { LanguageDate } from '@/@types/language';

const optionSchema = yup
  .object({ value: yup.mixed(), label: yup.string() })
  .nullable()
  .default(null);

const optionListSchema = yup.array().of(optionSchema).nullable().default(null);

export const stockMovementReportFilterSchema = (languageGB: LanguageDate) => {
  const messages = languageGB.stockMovementReport.report;

  return yup.object({
    warehouse: optionSchema.required(messages.validation.warehouseRequired),
    start_date: yup.string().trim().nullable(),
    end_date: yup
      .string()
      .trim()
      .nullable()
      .test(
        'end-date-after-start-date',
        messages.validation.endDateAfterStartDate,
        (value, context) => {
          const parent = context.parent as { start_date?: string | null };
          const startDate = parent.start_date;
          if (!value || !startDate) return true; // ambas opcionais — só valida quando as 2 existem
          return value >= startDate;
        }
      ),
    products: optionListSchema,
  });
};

export const stockMovementReportFilterSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(stockMovementReportFilterSchema(languageGB)) as any;

export default stockMovementReportFilterSchemaResolver;
