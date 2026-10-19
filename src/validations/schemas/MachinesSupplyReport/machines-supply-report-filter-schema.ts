// src/validations/schemas/MachinesSupplyReport/machines-supply-report-filter-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do filtro do relatório "Abastecimentos" (F-277,
// esteira 97-Esteiras/054, TASK-054-277-FE-01). Mirror ESTRUTURAL de
// `@/validations/schemas/MachinesReport/machines-report-filter-schema.ts`
// (F-278) — par `start_date`/`end_date` sempre obrigatório via
// `fieldValidationSchema(languageGB).date()`; `equipment_ids` com
// `.min(1, ...)` (ÚNICO filtro obrigatório, mirror `MachinesReportRequest`
// FILTER-01); `end_date >= start_date` validado via `.test()` com mensagem
// PRÓPRIA do módulo.
//
// Campos ADICIONAIS em relação ao F-278 (roteiro-front-F277-abastecimentos.md
// §3.1/§4.3): `product_ids` (array opcional, mirror `farm_ids`) e
// `warehouse_id` (`Option<string>` nullable, mirror
// `ContasAPagar::proprietary_id`/`farm_id` — `optionSchema` LOCAL, não
// `v.option()` obrigatório). `format` sempre tem valor default `pdf`
// pré-selecionado (`noClearable` no Select).
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

export const machinesSupplyReportFilterSchema = (languageGB: LanguageDate) => {
  const v = fieldValidationSchema(languageGB);
  const messages = languageGB.machinesSupplyReport.report;

  return yup.object({
    equipment_ids: yup
      .array(yup.string().required())
      .min(1, messages.validation.equipmentsRequired)
      .default([]),
    farm_ids: yup.array(yup.string().required()).default([]),
    product_ids: yup.array(yup.string().required()).default([]),
    warehouse_id: optionSchema,
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
    format: v.option<ReportFormat>(),
  });
};

export const machinesSupplyReportFilterSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(machinesSupplyReportFilterSchema(languageGB)) as any;

export default machinesSupplyReportFilterSchemaResolver;
