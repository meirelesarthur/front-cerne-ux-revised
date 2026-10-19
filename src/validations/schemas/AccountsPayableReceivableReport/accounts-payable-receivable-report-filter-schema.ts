// src/validations/schemas/AccountsPayableReceivableReport/accounts-payable-receivable-report-filter-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do filtro do relatório F-214 "Consolidado
// Pagar/Receber" (esteira 97-Esteiras/052, TASK-052-214-FE-01). Mirror
// direto de `cost-center-report-filter-schema.ts` (par de data OBRIGATÓRIO
// com `.test()` de `fim >= início`) + `expense-report-filter-schema.ts`
// (2º par de data OPCIONAL com o mesmo `.test()`) — DEC-225/§7.2: as datas
// de EMISSÃO são `required` (fecha o defeito legado que só validava no
// HTML); as datas de BAIXA continuam OPCIONAIS (fiel ao legado).
//
// `provider`/`client`/`center`/`account`/`category` são `Option<string>`
// nullable (SINGLE-select, diferente do multi-select `providers[]`/
// `categories[]` de `ContasAPagar`) — nenhum é obrigatório nem restringe
// outro (contrato de tela). `status[]` é array de número, catálogo LOCAL.
// `format` usa `fieldValidationSchema(languageGB).option<T>()` (mirror
// `order`/`order_direction`/`format` de `expense-report-filter-schema.ts`).
//
// Nenhuma string literal em mensagem de validação.
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import fieldValidationSchema from '@/validations/field-validation-schema';

import type { LanguageDate } from '@/@types/language';
import type {
  AccountsPayableReceivableReportFormat,
  AccountsPayableReceivableStatus,
} from '@/@types/v2/AccountsPayableReceivableReport';

const optionSchema = yup
  .object({ value: yup.mixed(), label: yup.string() })
  .nullable()
  .default(null);

export const accountsPayableReceivableReportFilterSchema = (languageGB: LanguageDate) => {
  const v = fieldValidationSchema(languageGB);
  const messages = languageGB.accountsPayableReceivableReport.report.validation;

  return yup.object({
    start_emission_date: yup.string().trim().nullable().required(messages.emissionRequired),
    end_emission_date: yup
      .string()
      .trim()
      .nullable()
      .required(messages.emissionRequired)
      .test(
        'end-emission-date-after-start-emission-date',
        messages.invalidEmissionDateRange,
        (value, context) => {
          const parent = context.parent as { start_emission_date?: string | null };
          if (!value || !parent.start_emission_date) return true;
          return value >= parent.start_emission_date;
        }
      ),
    start_write_off_date: yup.string().trim().nullable().default(null),
    end_write_off_date: yup
      .string()
      .trim()
      .nullable()
      .default(null)
      .test(
        'end-write-off-date-after-start-write-off-date',
        messages.invalidWriteOffDateRange,
        (value, context) => {
          const parent = context.parent as { start_write_off_date?: string | null };
          if (!value || !parent.start_write_off_date) return true;
          return value >= parent.start_write_off_date;
        }
      ),
    provider: optionSchema,
    client: optionSchema,
    center: optionSchema,
    account: optionSchema,
    category: optionSchema,
    status: yup.array(yup.mixed<AccountsPayableReceivableStatus>().required()).default([]),
    format: v.option<AccountsPayableReceivableReportFormat>(),
  });
};

export const accountsPayableReceivableReportFilterSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(accountsPayableReceivableReportFilterSchema(languageGB)) as any;

export default accountsPayableReceivableReportFilterSchemaResolver;
