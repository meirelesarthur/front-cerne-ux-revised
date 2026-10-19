// src/pages/Operacional/Pastagem/appropriation-mapper.ts
// -----------------------------------------------------------------------------
// Hidratação do formulário de Apropriação/rateio de Pastagem —
// TASK-PAST-FE-07. Extraído de `AppropriatePastagem.tsx` (mirror
// `Appropriations/appropriation-form-mapper.ts`) — 1 linha por item das 4
// coleções de satélite (equipments/inputs/productions/services), `label`
// só para exibição (nunca enviado).
// -----------------------------------------------------------------------------

import type { AppropriationData, AppropriatePastureForm } from '@/@types/v2/Pastures';

export function mapAppropriationDataToFormValues(data: AppropriationData): AppropriatePastureForm {
  return {
    equipments: data.pasture.equipments.map((row) => ({
      uuid: row.uuid,
      label: row.equipment?.uuid ?? row.uuid,
      center_uuid: null,
      class: null,
      vl_time: row.amount ?? null,
    })),
    inputs: data.pasture.inputs.map((row) => ({
      uuid: row.uuid,
      label: row.stock?.product?.description ?? row.uuid,
      center_uuid: null,
      class: null,
    })),
    productions: data.pasture.productions.map((row) => ({
      uuid: row.uuid,
      label: row.product?.description ?? row.uuid,
      center_uuid: null,
      class: null,
    })),
    services: data.pasture.services.map((row) => ({
      uuid: row.uuid,
      label: row.employee?.name ?? row.uuid,
      center_uuid: null,
      class: null,
    })),
  };
}
