// src/validations/schemas/Relatorios/birth-report-filter-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do filtro do relatório "Nascimentos" GENÉRICO
// (F-236, esteira CORE_WORKSPACE/97-Esteiras/053, TASK-053-236-FE-01).
// Mirror ESTRUTURAL de `management-batch-report-filter-schema.ts`:
// `start_date`/`end_date` SEMPRE obrigatórios no CLIENTE (mirror
// `BirthReportRequest::rules()`, ambos `required` no servidor) +
// `.test('end-date-after-start-date', ...)`.
//
// `category_uuid` é OPCIONAL (mirror `nullable` no servidor). `format` é
// obrigatório NA TELA (Select `noClearable`, default `pdf`) mesmo sendo
// `nullable` no servidor — comportamento mais determinístico, mesmo padrão
// já usado em `expense-report-filter-schema.ts` (`v.option<ReportFormat>()`).
//
// O schema valida a FORMA INTERNA do form (Option-based, react-select), NÃO
// o payload final do service (`BirthReportParams`):
//   start_date: string | null
//   end_date: string | null
//   category_uuid: Option<string> | null
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

export const birthReportFilterSchema = (languageGB: LanguageDate) => {
  const v = fieldValidationSchema(languageGB);
  const messages = languageGB.birthReport.report;

  return yup.object({
    start_date: yup.string().trim().nullable().required(messages.validation.periodRequired),
    end_date: yup
      .string()
      .trim()
      .nullable()
      .required(messages.validation.periodRequired)
      .test('end-date-after-start-date', messages.validation.periodRequired, (value, context) => {
        const parent = context.parent as { start_date?: string | null };
        const startDate = parent.start_date;
        if (!value || !startDate) return true;
        return value >= startDate;
      }),
    category_uuid: optionSchema,
    format: v.option<ReportFormat>(),
  });
};

export const birthReportFilterSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(birthReportFilterSchema(languageGB)) as any;

export default birthReportFilterSchemaResolver;
