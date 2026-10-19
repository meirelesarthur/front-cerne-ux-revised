// src/validations/schemas/Relatorios/ledger-category-report-filter-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do filtro do relatório "Razão Categoria" (F-273,
// execução 059, `CONTRATO-F273-razao-categoria.md`, TASK-273-FE-01). Mirror
// ESTRUTURAL de `received-interest-report-filter-schema.ts`/
// `cash-flow-by-category-report-filter-schema.ts` (par `start_date`/
// `end_date` SEMPRE obrigatório, `end_date >= start_date` via `.test()`).
//
// `farm_id`/`proprietary_id`/`center_id`/`categories[]` são OPCIONAIS, SEM
// validação de forma — a autoridade final é o 422 do backend (`Rule::exists`
// por campo, `LedgerCategoryReportRequest::rules()`). `format` é o único
// campo sempre obrigatório (default `pdf`, seletor `noClearable`, mirror dos
// irmãos de relatório).
//
// O schema valida a FORMA INTERNA do form (Option-based, react-select), NÃO
// o payload final do service (`LedgerCategoryReportParams`):
//   start_date: string | null
//   end_date: string | null
//   farm_id: Option<string> | null
//   proprietary_id: Option<string> | null
//   center_id: Option<string> | null
//   categories: string[]
//   format: Option<ReportFormat> | null
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import fieldValidationSchema from '@/validations/field-validation-schema';

import type { LanguageDate } from '@/@types/language';
import type { ReportFormat } from '@/@types/v2/AccountsReports';

const optionSchema = yup
  .object({ value: yup.mixed(), label: yup.string() })
  .nullable()
  .default(null);

export const ledgerCategoryReportFilterSchema = (languageGB: LanguageDate) => {
  const v = fieldValidationSchema(languageGB);
  const messages = languageGB.ledgerCategoryReport.report;

  return yup.object({
    start_date: yup.string().trim().nullable().required(messages.validation.periodRequired),
    end_date: yup
      .string()
      .trim()
      .nullable()
      .required(messages.validation.periodRequired)
      .test('end-date-after-start-date', messages.validation.periodOrder, (value, context) => {
        const parent = context.parent as { start_date?: string | null };
        const startDate = parent.start_date;
        if (!value || !startDate) return true;
        return value >= startDate;
      }),
    farm_id: optionSchema,
    proprietary_id: optionSchema,
    center_id: optionSchema,
    categories: yup.array(yup.string().required()).default([]),
    format: v.option<ReportFormat>(),
  });
};

export const ledgerCategoryReportFilterSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(ledgerCategoryReportFilterSchema(languageGB)) as any;

export default ledgerCategoryReportFilterSchemaResolver;
