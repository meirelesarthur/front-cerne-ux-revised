// src/validations/schemas/Relatorios/sale-product-report-filter-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do filtro do relatório "Vendas/Produto" (F-315,
// esteira 051, TASK-315-FE-01). Mirror ESTRUTURAL de
// `dre-report-filter-schema.ts`/`management-batch-report-filter-schema.ts`:
// `start_date`/`end_date` SEMPRE obrigatórios no CLIENTE (mirror da regra de
// servidor `required|date` + `after_or_equal:start_date`,
// `SaleReportRequest.php:58-59`) + `.test('end-date-after-start-date', ...)`.
//
// `product_uuid` é OPCIONAL, SEM `.test()` condicional — o contrato legado
// confirma a dimensão "cascatas" = `NAO_APLICAVEL` (nenhum outro campo
// restringe o produto). `type` é validado como domínio fechado `0 | 1`
// (Select estático de 2 opções, sem digitação livre — mirror
// `dre-report-filter-schema.ts → type_report`).
//
// 3 mensagens de validação DEDICADAS (`startDateRequired`/`endDateRequired`/
// `endDateAfterStartDate`) — divergência intencional do molde `Dre`/
// `ManejoLote` (que reusam 1 única `periodRequired` para as 2 datas + o
// `.test()`), decisão explícita do roteiro-front-F315 §"Desenho da fatia".
//
// O schema valida a FORMA INTERNA do form (Option-based, react-select), NÃO
// o payload final do service (`SaleProductReportParams`):
//   start_date: string | null
//   end_date: string | null
//   product_uuid: Option<string> | null
//   type: 0 | 1
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import type { LanguageDate } from '@/@types/language';

const optionSchema = yup
  .object({ value: yup.mixed(), label: yup.string() })
  .nullable()
  .default(null);

const REPORT_TYPES = [0, 1] as const;

export const saleProductReportFilterSchema = (languageGB: LanguageDate) => {
  const messages = languageGB.saleProductReport.report;

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
    product_uuid: optionSchema,
    type: yup
      .mixed<(typeof REPORT_TYPES)[number]>()
      .oneOf([...REPORT_TYPES])
      .required(),
  });
};

export const saleProductReportFilterSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(saleProductReportFilterSchema(languageGB)) as any;

export default saleProductReportFilterSchemaResolver;
