// src/validations/schemas/Inventario/equipment-inventory-report-filter-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do filtro do relatório "Inventário Patrimonial"
// (Bens/Equipamentos — F-260, TASK-INV-FE-01, esteira 075). Mirror
// ESTRUTURAL de `stock-movement-report-filter-schema.ts`, DIVERGINDO no
// campo obrigatório: aqui é `status` que é `.required()` (mirror do contrato
// de API, `DA-INV-03`) — `family`/`proprietary`/`type` ficam opcionais.
//
// O schema valida a FORMA INTERNA do form (Option-based, react-select), NÃO
// o payload final do service (`EquipmentInventoryReportParams`):
//   family: Option<string> | null       (opcional)
//   proprietary: Option<string> | null  (opcional)
//   status: 1 | 2 | null                (obrigatório)
//   type: 0 | 1 | null                  (opcional; ausente ⇒ PDF)
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import type { LanguageDate } from '@/@types/language';

const optionSchema = yup
  .object({ value: yup.mixed(), label: yup.string() })
  .nullable()
  .default(null);

export const equipmentInventoryReportFilterSchema = (languageGB: LanguageDate) => {
  const messages = languageGB.equipmentInventoryReport.report;

  return yup.object({
    family: optionSchema,
    proprietary: optionSchema,
    status: yup.mixed<1 | 2>().required(messages.validation.statusRequired),
    type: yup.mixed<0 | 1>().nullable(),
  });
};

export const equipmentInventoryReportFilterSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(equipmentInventoryReportFilterSchema(languageGB)) as any;

export default equipmentInventoryReportFilterSchemaResolver;
