// src/validations/schemas/Relatorios/sale-employee-report-filter-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do filtro do relatório "Vendas/Funcionário" (F-314,
// esteira 079). Mirror ESTRUTURAL de `sale-product-report-filter-schema.ts`
// (F-315): `start_date`/`end_date` SEMPRE obrigatórios no CLIENTE (mirror da
// regra de servidor `required|date` + `after_or_equal:start_date`,
// `SaleReportRequest.php`) + `.test('end-date-after-start-date', ...)`.
//
// `user_uuid` é OPCIONAL, SEM `.test()` condicional — o contrato legado
// confirma a dimensão "cascatas" = `NAO_APLICAVEL` (nenhum outro campo
// restringe o funcionário). `type` é validado como domínio fechado `0 | 1`
// (Select estático de 2 opções, sem digitação livre — mirror
// `sale-product-report-filter-schema.ts → type`).
//
// O schema valida a FORMA INTERNA do form (Option-based, react-select), NÃO
// o payload final do service (`SaleEmployeeReportParams`):
//   start_date: string | null
//   end_date: string | null
//   user_uuid: Option<string> | null
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

export const saleEmployeeReportFilterSchema = (languageGB: LanguageDate) => {
  const messages = languageGB.saleEmployeeReport.report;

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
    user_uuid: optionSchema,
    type: yup
      .mixed<(typeof REPORT_TYPES)[number]>()
      .oneOf([...REPORT_TYPES])
      .required(),
  });
};

export const saleEmployeeReportFilterSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(saleEmployeeReportFilterSchema(languageGB)) as any;

export default saleEmployeeReportFilterSchemaResolver;
