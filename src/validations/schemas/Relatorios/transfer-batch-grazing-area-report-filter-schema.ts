// src/validations/schemas/Relatorios/transfer-batch-grazing-area-report-filter-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do filtro do relatório "Transf/Lote/Módulo/Área"
// (F-329, esteira 077, F-329-plano-front.md). Mirror ESTRUTURAL de
// `management-batch-report-filter-schema.ts` (F-279) REMOVENDO `category`:
// `start_date`/`end_date` SEMPRE obrigatórios no CLIENTE +
// `.test('end-date-after-start-date', ...)`; `batch_id` é OPCIONAL, sem
// `.test()` condicional (filtro independente das datas, contrato legado §2).
//
// O schema valida a FORMA INTERNA do form (Option-based, react-select), NÃO
// o payload final do service (`TransferBatchGrazingAreaReportParams`).
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import type { LanguageDate } from '@/@types/language';

const optionSchema = yup
  .object({ value: yup.mixed(), label: yup.string() })
  .nullable()
  .default(null);

export const transferBatchGrazingAreaReportFilterSchema = (languageGB: LanguageDate) => {
  const messages = languageGB.transferBatchGrazingAreaReport.report;

  return yup.object({
    start_date: yup.string().trim().nullable().required(messages.validation.periodRequired),
    end_date: yup
      .string()
      .trim()
      .nullable()
      .required(messages.validation.periodRequired)
      .test(
        'end-date-after-start-date',
        messages.validation.endDateBeforeStartDate,
        (value, context) => {
          const parent = context.parent as { start_date?: string | null };
          const startDate = parent.start_date;
          if (!value || !startDate) return true;
          return value >= startDate;
        }
      ),
    batch_id: optionSchema,
  });
};

export const transferBatchGrazingAreaReportFilterSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(transferBatchGrazingAreaReportFilterSchema(languageGB)) as any;

export default transferBatchGrazingAreaReportFilterSchemaResolver;
