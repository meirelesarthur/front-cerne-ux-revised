// src/validations/schemas/Relatorios/agriculture-application-management-report-filter-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do filtro do relatório "Aplicação/Manejo Talhões"
// (F-220, execução 059). Mirror ESTRUTURAL de
// `production-costing-area-report-filter-schema.ts` (`start_date`/`end_date`
// SEMPRE obrigatórios no CLIENTE + `.test('end-date-after-start-date', ...)`,
// `production_cycle`/`area_uuids` OPCIONAIS sem `.test()` condicional entre
// eles — a cascata IG-01/IG-02 é UX de conveniência, não regra de validação).
//
// `report_type`/`group_uuid`/`category_uuid`/`kind_uuid` também OPCIONAIS
// (mirror `AgricultureApplicationManagementReportRequest::rules()` —
// `nullable`). `format` é o único select OBRIGATÓRIO (`v.option()`,
// default 'pdf' pré-selecionado no componente, mirror
// `stock-abc-report-filter-schema.ts`).
//
// O schema valida a FORMA INTERNA do form (Option-based, react-select), NÃO
// o payload final do service (`AgricultureApplicationManagementReportParams`):
//   production_cycle: Option<string> | null (CLIENT-SIDE puro, nunca enviado)
//   area_uuids: Option<string>[] | null
//   start_date: string | null
//   end_date: string | null
//   report_type / group_uuid / category_uuid / kind_uuid: Option<string> | null
//   format: Option<AgricultureApplicationManagementReportFormat> | null
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import fieldValidationSchema from '@/validations/field-validation-schema';

import type { LanguageDate } from '@/@types/language';
import type { AgricultureApplicationManagementReportFormat } from '@/@types/v2/Relatorios/agriculture-application-management-report';

const optionSchema = yup
  .object({ value: yup.mixed(), label: yup.string() })
  .nullable()
  .default(null);

export const agricultureApplicationManagementReportFilterSchema = (languageGB: LanguageDate) => {
  const v = fieldValidationSchema(languageGB);
  const messages = languageGB.agricultureApplicationManagementReport.report;

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
        if (!value || !startDate) return true; // ambas required — guarda contra estado transitório
        return value >= startDate;
      }),
    production_cycle: optionSchema,
    area_uuids: yup.array().of(optionSchema).nullable().default(null),
    report_type: optionSchema,
    group_uuid: optionSchema,
    category_uuid: optionSchema,
    kind_uuid: optionSchema,
    format: v.option<AgricultureApplicationManagementReportFormat>(),
  });
};

export const agricultureApplicationManagementReportFilterSchemaResolver = (
  languageGB: LanguageDate
) => yupResolver(agricultureApplicationManagementReportFilterSchema(languageGB)) as any;

export default agricultureApplicationManagementReportFilterSchemaResolver;
