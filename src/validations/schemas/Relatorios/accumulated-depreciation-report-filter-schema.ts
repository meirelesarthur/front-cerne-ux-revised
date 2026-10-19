// src/validations/schemas/Relatorios/accumulated-depreciation-report-filter-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do filtro do relatório "Depreciação Acumulada"
// (Bens/Equipamentos — F-216, CONTRATO-F216-depreciacao-acumulada.md §6).
// Mirror ESTRUTURAL de `Inventario/equipment-inventory-report-filter-schema.ts`,
// DIVERGINDO no conjunto de campos obrigatórios: aqui os 4 filtros
// (`family`/`status`/`start_date`/`end_date`) são TODOS `.required()` — mirror
// EXATO de `AccumulatedDepreciationReportRequest::rules()` (GB.Cerne.Api,
// nenhum campo `nullable`/`sometimes`), diferente do irmão `equipmentInventoryReport`
// onde só `status` era obrigatório.
//
// O schema valida a FORMA INTERNA do form (Option-based para `family`, string
// ISO para as datas), NÃO o payload final do service
// (`AccumulatedDepreciationReportParams`):
//   family: Option<string> | null   (obrigatório)
//   status: 1 | 2 | null            (obrigatório)
//   start_date: string | null       (obrigatório, ISO yyyy-MM-dd)
//   end_date: string | null         (obrigatório, ISO yyyy-MM-dd, >= start_date)
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import type { LanguageDate } from '@/@types/language';

const optionSchema = yup
  .object({ value: yup.mixed(), label: yup.string() })
  .nullable()
  .default(null);

export const accumulatedDepreciationReportFilterSchema = (languageGB: LanguageDate) => {
  const messages = languageGB.accumulatedDepreciationReport.report.validation;

  return yup.object({
    family: optionSchema.required(messages.familyRequired),
    status: yup.mixed<1 | 2>().required(messages.statusRequired),
    start_date: yup.string().nullable().required(messages.startDateRequired),
    end_date: yup
      .string()
      .nullable()
      .required(messages.endDateRequired)
      .test(
        'end-date-after-or-equal-start-date',
        messages.endDateBeforeStartDate,
        function endDateAfterOrEqualStartDate(value) {
          const { start_date: startDate } = this.parent as { start_date?: string | null };
          if (!value || !startDate) return true;
          return value >= startDate;
        }
      ),
  });
};

export const accumulatedDepreciationReportFilterSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(accumulatedDepreciationReportFilterSchema(languageGB)) as any;

export default accumulatedDepreciationReportFilterSchemaResolver;
