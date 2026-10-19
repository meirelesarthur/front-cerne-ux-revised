// src/validations/schemas/Relatorios/management-batch-report-filter-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do filtro do relatório "Manejo/Lote" (F-279, esteira
// 051, TASK-279-FE-01). Mirror ESTRUTURAL de
// `production-costing-area-report-filter-schema.ts` (canário F-298 do mesmo
// fan-out): `start_date`/`end_date` SEMPRE obrigatórios no CLIENTE +
// `.test('end-date-after-start-date', ...)`.
//
// `category`/`batch` são OPCIONAIS, SEM `.test()` condicional entre eles — os
// 2 filtros são independentes (contrato legado §6 `filter_manifest`,
// FM-01/FM-02; dimensão "cascatas" = `NAO_APLICAVEL`, prova de ausência já
// fechada pelo Extrator). Diferente do canário F-298 (que tem cascata
// IG-01/IG-02), esta tela não deriva nenhum campo a partir de outro.
//
// O schema valida a FORMA INTERNA do form (Option-based, react-select), NÃO
// o payload final do service (`ManagementBatchReportParams`):
//   category: Option<string> | null
//   batch: Option<string> | null
//   start_date: string | null
//   end_date: string | null
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import type { LanguageDate } from '@/@types/language';

const optionSchema = yup
  .object({ value: yup.mixed(), label: yup.string() })
  .nullable()
  .default(null);

export const managementBatchReportFilterSchema = (languageGB: LanguageDate) => {
  const messages = languageGB.managementBatchReport.report;

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
    category: optionSchema,
    batch: optionSchema,
  });
};

export const managementBatchReportFilterSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(managementBatchReportFilterSchema(languageGB)) as any;

export default managementBatchReportFilterSchemaResolver;
