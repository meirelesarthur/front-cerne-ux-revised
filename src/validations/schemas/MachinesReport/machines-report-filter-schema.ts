// src/validations/schemas/MachinesReport/machines-report-filter-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do filtro do relatório "Máquinas" (F-278, esteira
// 97-Esteiras/052, TASK-052-278-FE-01). Mirror ESTRUTURAL de
// `production-area-report-filter-schema.ts` (par `start_date`/`end_date`
// sempre obrigatório via `fieldValidationSchema(languageGB).date()`,
// mensagem GENÉRICA `defaltStrings.validations.requiredField`; `end_date >=
// start_date` validado via `.test()` com mensagem PRÓPRIA do módulo) +
// `expense-report-filter-schema.ts::columns` (array obrigatório com
// `.min(1, ...)` — aqui `equipment_ids`, MachinesReportRequest FILTER-01).
//
// `farm_ids` é opcional (array, default `[]`). `maintenance_type`/
// `maintenance_executor_id` são opcionais (nullable) — a cascata
// employee↔provider é ergonomia de UI (página), não regra de schema.
// `format` sempre tem valor default `pdf` pré-selecionado (`noClearable`
// no Select), mirror `expense-report-filter-schema.ts::format`.
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

export const machinesReportFilterSchema = (languageGB: LanguageDate) => {
  const v = fieldValidationSchema(languageGB);
  const messages = languageGB.machinesReport.report;

  return yup.object({
    equipment_ids: yup
      .array(yup.string().required())
      .min(1, messages.validation.equipmentsRequired)
      .default([]),
    farm_ids: yup.array(yup.string().required()).default([]),
    start_date: v.date(),
    end_date: v
      .date()
      .test(
        'end-date-after-start-date',
        messages.validation.endDateBeforeStartDate,
        (value, context) => {
          const parent = context.parent as { start_date?: string | null };
          if (!value || !parent.start_date) return true;
          return value >= parent.start_date;
        }
      ),
    maintenance_type: optionSchema,
    maintenance_executor_id: optionSchema,
    format: v.option<ReportFormat>(),
  });
};

export const machinesReportFilterSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(machinesReportFilterSchema(languageGB)) as any;

export default machinesReportFilterSchemaResolver;
