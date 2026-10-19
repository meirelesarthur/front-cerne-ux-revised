// src/validations/schemas/Relatorios/machines-maintenance-report-filter-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do filtro do relatório "Manutenções" (F-276,
// execução 97-Esteiras/078, TASK-F276-F02). Mirror ESTRUTURAL de
// `requisitions-report-filter-schema.ts` (F-312, `start_date`/`end_date`
// obrigatórios com `end_date >= start_date`) + `equipment_ids` (mirror
// `MachinesSupplyReport`, `array().min(1)` — contrato §Filtro #1 + FormRequest
// DELIVERED `equipment_ids` `required|array|min:1`).
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import type { LanguageDate } from '@/@types/language';

const optionSchema = yup
  .object({ value: yup.mixed(), label: yup.string() })
  .nullable()
  .default(null);

export const machinesMaintenanceReportFilterSchema = (languageGB: LanguageDate) => {
  const messages = languageGB.machinesMaintenanceReport.report;

  return yup.object({
    equipment_ids: yup
      .array()
      .of(yup.string().required())
      .min(1, messages.validation.equipmentRequired)
      .required(messages.validation.equipmentRequired),
    farm_ids: yup.array().of(yup.string().required()).notRequired(),
    warehouse_id: optionSchema.notRequired(),
    product_id: optionSchema.notRequired(),
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

export const machinesMaintenanceReportFilterSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(machinesMaintenanceReportFilterSchema(languageGB)) as any;

export default machinesMaintenanceReportFilterSchemaResolver;
