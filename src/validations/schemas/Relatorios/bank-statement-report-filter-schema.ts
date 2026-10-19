// src/validations/schemas/Relatorios/bank-statement-report-filter-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do filtro do relatório "Extrato Financeiro"
// (`bankEstatement.report`, F-233, execução 97-Esteiras/079,
// TASK-F233-FE-02). Mirror ESTRUTURAL de
// `payment-cashflow-report-filter-schema.ts` (F-293) — `start_date`/
// `end_date` OBRIGATÓRIOS (fidelidade ao legado, `required` HTML) com
// `end_date >= start_date` (mirror `after_or_equal` server-side de
// `BankStatementReportRequest`); `categories` opcional
// (`array().notRequired()`); `proprietary`/`center_id`/`farm_id` opcionais
// (`optionSchema.notRequired()`).
//
// DIVERGÊNCIA do mirror (fidelidade ao contrato de F-233, FRONT-02): `account`
// é OBRIGATÓRIO (`optionSchema.required(...)`) — em F-293 o campo equivalente
// (`accounts[]`) é opcional/múltiplo. `condition` sempre tem valor via
// `defaultValues` da tela (`Select` `noClearable`), por isso não precisa de
// `.required()` no schema.
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import type { LanguageDate } from '@/@types/language';

const optionSchema = yup
  .object({ value: yup.mixed(), label: yup.string() })
  .nullable()
  .default(null);

export const bankStatementReportFilterSchema = (languageGB: LanguageDate) => {
  const messages = languageGB.bankStatementReport.report;

  return yup.object({
    account: optionSchema.required(messages.validation.accountRequired),
    proprietary: optionSchema.notRequired(),
    center_id: optionSchema.notRequired(),
    categories: yup.array().of(yup.string().required()).notRequired(),
    farm_id: optionSchema.notRequired(),
    condition: optionSchema.notRequired(),
    start_date: yup.string().trim().nullable().required(messages.validation.periodRequired),
    end_date: yup
      .string()
      .trim()
      .nullable()
      .required(messages.validation.periodRequired)
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
  });
};

export const bankStatementReportFilterSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(bankStatementReportFilterSchema(languageGB)) as any;

export default bankStatementReportFilterSchemaResolver;
