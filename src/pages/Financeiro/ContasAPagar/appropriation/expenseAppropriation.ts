// src/pages/Financeiro/ContasAPagar/appropriation/expenseAppropriation.ts
// -----------------------------------------------------------------------------
// UT-000795 (Execução 102, F-109) — funções PURAS (sem React/DOM) da
// Apropriação Direta Pecuária/Manutenção de Contas a Pagar: obrigatoriedade do
// Fornecedor, payload (contrato do plano da API §1.5), reidratação a partir de
// `appropriation_detail` (§4.2) e mapeamento do 422 flat por campo.
//
// Regras de ouro:
//   - uuid, nunca `id`; chave ausente = `null` explícito dentro do bloco do
//     tipo, nunca `''`.
//   - Horímetro/Km: só o campo APLICÁVEL (decidido por `uses_mileage` da API,
//     nunca "família 5" hardcoded) é enviado/hidratado (H1); número puro, sem
//     ×10 (H2). `0` é valor válido.
//   - NÃO usar `isEmpty()` aqui (landmine ERRO-FE-001).
// -----------------------------------------------------------------------------

import { isAxiosError } from 'axios';

import {
  expenseAppropriationIndex,
  expenseAppropriationTypeIndex,
} from '@/constants/financeiro/expense/options/appropriation-options';

import type { Option } from '@/@types/option';
import type {
  ExpenseAppropriationDetail,
  ExpenseForm,
  ExpenseMaintenanceEquipmentOption,
  ExpensePayload,
} from '@/@types/v2/Financeiro/expense';

/** Tipos (1 Agricultura, 2 Pecuária, 4 Manutenção) que exigem Fornecedor na
 *  Apropriação Direta (D-102-12), independente de `is_taxation`. */
const PROVIDER_REQUIRED_TYPES: number[] = [
  expenseAppropriationTypeIndex.AGRICULTURA,
  expenseAppropriationTypeIndex.PECUARIA,
  expenseAppropriationTypeIndex.MANUTENCAO,
];

export function isProviderRequiredForAppropriation(
  appropriation: number | null | undefined,
  appropriationType: number | null | undefined
): boolean {
  return (
    appropriation === expenseAppropriationIndex.DIRETA &&
    appropriationType !== null &&
    appropriationType !== undefined &&
    PROVIDER_REQUIRED_TYPES.includes(appropriationType)
  );
}

// `true` só quando a API marcou o equipamento como de Km (`uses_mileage`).
export function equipmentUsesMileage(
  equipment: Pick<ExpenseMaintenanceEquipmentOption, 'uses_mileage'> | null | undefined
): boolean {
  return equipment?.uses_mileage === true;
}

// Medidor aplicável ao equipamento (H1): o outro sempre `null`.
export function resolveMaintenanceMeter(
  equipment: Pick<ExpenseMaintenanceEquipmentOption, 'uses_mileage'> | null | undefined,
  hourMeter: number | null | undefined,
  mileage: number | null | undefined
): { hour_meter: number | null; mileage: number | null } {
  return equipmentUsesMileage(equipment)
    ? { hour_meter: null, mileage: mileage ?? null }
    : { hour_meter: hourMeter ?? null, mileage: null };
}

type AppropriationFormSlice = Pick<
  ExpenseForm,
  | 'appropriation'
  | 'appropriation_type'
  | 'aprop_agri_area_uuid'
  | 'aprop_agri_activity_uuid'
  | 'aprop_agri_operation_uuid'
  | 'aprop_agri_cultivation_uuid'
  | 'aprop_pec_area_uuid'
  | 'aprop_pec_grazing_uuid'
  | 'aprop_pec_batch_uuid'
  | 'aprop_pec_animal_uuid'
  | 'aprop_pec_operation_uuid'
  | 'aprop_pec_activity_uuid'
  | 'aprop_man_equipment_uuid'
  | 'aprop_man_hour_meter'
  | 'aprop_man_mileage'
>;

type AppropriationPayloadSlice = Pick<
  ExpensePayload,
  | 'appropriation'
  | 'appropriation_type'
  | 'aprop_agri_area_uuid'
  | 'aprop_agri_activity_uuid'
  | 'aprop_agri_operation_uuid'
  | 'aprop_agri_cultivation_uuid'
  | 'aprop_pec_area_uuid'
  | 'aprop_pec_grazing_uuid'
  | 'aprop_pec_batch_uuid'
  | 'aprop_pec_animal_uuid'
  | 'aprop_pec_operation_uuid'
  | 'aprop_pec_activity_uuid'
  | 'aprop_man_equipment_uuid'
  | 'aprop_man_hour_meter'
  | 'aprop_man_mileage'
>;

const uuidOrNull = (option: Option<string> | null | undefined): string | null =>
  option?.value ? option.value : null;

// Bloco de apropriação do payload de POST/PUT `/expenses`.
// - Indireta: `appropriation:2`, `appropriation_type:null`, nenhuma `aprop_*`.
// - Direta+Agricultura: as 4 chaves `aprop_agri_*` (idêntico ao anterior).
// - Direta+Área: só `appropriation`/`appropriation_type`.
// - Direta+Pecuária: 6 chaves `aprop_pec_*` (Área e Módulo nunca ambos).
// - Direta+Manutenção: Equipamento + APENAS o medidor aplicável.
export function buildAppropriationPayload(form: AppropriationFormSlice): AppropriationPayloadSlice {
  const appropriation = form.appropriation?.value ?? expenseAppropriationIndex.INDIRETA;
  const isDirect = appropriation === expenseAppropriationIndex.DIRETA;
  const type = isDirect ? (form.appropriation_type?.value ?? null) : null;
  const base: AppropriationPayloadSlice = { appropriation, appropriation_type: type };

  if (!isDirect) return base;

  if (type === expenseAppropriationTypeIndex.AGRICULTURA) {
    return {
      ...base,
      aprop_agri_area_uuid: uuidOrNull(form.aprop_agri_area_uuid),
      aprop_agri_activity_uuid: uuidOrNull(form.aprop_agri_activity_uuid),
      aprop_agri_operation_uuid: uuidOrNull(form.aprop_agri_operation_uuid),
      aprop_agri_cultivation_uuid: uuidOrNull(form.aprop_agri_cultivation_uuid),
    };
  }

  if (type === expenseAppropriationTypeIndex.PECUARIA) {
    const areaUuid = uuidOrNull(form.aprop_pec_area_uuid);
    // Área e Módulo mutuamente exclusivos (XOR): se a tela deixar ambos, Área vence.
    const grazingUuid = areaUuid ? null : uuidOrNull(form.aprop_pec_grazing_uuid);
    return {
      ...base,
      aprop_pec_area_uuid: areaUuid,
      aprop_pec_grazing_uuid: grazingUuid,
      aprop_pec_batch_uuid: uuidOrNull(form.aprop_pec_batch_uuid),
      aprop_pec_animal_uuid: uuidOrNull(form.aprop_pec_animal_uuid),
      aprop_pec_operation_uuid: uuidOrNull(form.aprop_pec_operation_uuid),
      aprop_pec_activity_uuid: uuidOrNull(form.aprop_pec_activity_uuid),
    };
  }

  if (type === expenseAppropriationTypeIndex.MANUTENCAO) {
    const equipment = form.aprop_man_equipment_uuid;
    const result: AppropriationPayloadSlice = {
      ...base,
      aprop_man_equipment_uuid: uuidOrNull(equipment),
    };
    if (equipmentUsesMileage(equipment)) {
      if (form.aprop_man_mileage !== null && form.aprop_man_mileage !== undefined) {
        result.aprop_man_mileage = Math.round(Number(form.aprop_man_mileage));
      }
    } else if (form.aprop_man_hour_meter !== null && form.aprop_man_hour_meter !== undefined) {
      result.aprop_man_hour_meter = Math.round(Number(form.aprop_man_hour_meter) * 10) / 10;
    }
    return result;
  }

  return base;
}

export type HydratedAppropriationFields = Pick<
  ExpenseForm,
  | 'aprop_pec_area_uuid'
  | 'aprop_pec_grazing_uuid'
  | 'aprop_pec_batch_uuid'
  | 'aprop_pec_animal_uuid'
  | 'aprop_pec_operation_uuid'
  | 'aprop_pec_activity_uuid'
  | 'aprop_man_equipment_uuid'
  | 'aprop_man_hour_meter'
  | 'aprop_man_mileage'
>;

export const EMPTY_APPROPRIATION_FIELDS: HydratedAppropriationFields = {
  aprop_pec_area_uuid: null,
  aprop_pec_grazing_uuid: null,
  aprop_pec_batch_uuid: null,
  aprop_pec_animal_uuid: null,
  aprop_pec_operation_uuid: null,
  aprop_pec_activity_uuid: null,
  aprop_man_equipment_uuid: null,
  aprop_man_hour_meter: null,
  aprop_man_mileage: null,
};

const describedOption = (
  ref: { uuid: string; description: string } | null | undefined
): Option<string> | null => (ref ? { label: ref.description, value: ref.uuid } : null);

// Converte `appropriation_detail` (plano API §4.2) nos 9 campos do form, como
// option única `{label, value}` (nenhuma requisição no load). `null`/`undefined`
// devolve tudo `null`. Números crus (sem máscara, sem ×10).
export function hydrateAppropriationDetail(
  detail: ExpenseAppropriationDetail | null | undefined
): HydratedAppropriationFields {
  if (!detail) return { ...EMPTY_APPROPRIATION_FIELDS };

  const result: HydratedAppropriationFields = { ...EMPTY_APPROPRIATION_FIELDS };

  const livestock = detail.livestock;
  if (livestock) {
    result.aprop_pec_area_uuid = describedOption(livestock.area);
    result.aprop_pec_grazing_uuid = describedOption(livestock.grazing);
    result.aprop_pec_batch_uuid = describedOption(livestock.batch);
    result.aprop_pec_animal_uuid = livestock.animal
      ? { label: livestock.animal.identification, value: livestock.animal.uuid }
      : null;
    result.aprop_pec_operation_uuid = livestock.operation
      ? { label: livestock.operation.name, value: livestock.operation.uuid }
      : null;
    result.aprop_pec_activity_uuid = livestock.activity
      ? { label: livestock.activity.name, value: livestock.activity.uuid }
      : null;
  }

  const maintenance = detail.maintenance;
  if (maintenance?.equipment) {
    const equipment: ExpenseMaintenanceEquipmentOption = {
      label: maintenance.equipment.description,
      value: maintenance.equipment.uuid,
      uses_mileage: maintenance.equipment.uses_mileage === true,
    };
    const meter = resolveMaintenanceMeter(equipment, maintenance.hour_meter, maintenance.mileage);
    result.aprop_man_equipment_uuid = equipment;
    result.aprop_man_hour_meter = meter.hour_meter;
    result.aprop_man_mileage = meter.mileage;
  }

  return result;
}

export type AppropriationErrorKey =
  | 'aprop_pec_area_uuid'
  | 'aprop_pec_grazing_uuid'
  | 'aprop_pec_batch_uuid'
  | 'aprop_pec_animal_uuid'
  | 'aprop_pec_operation_uuid'
  | 'aprop_pec_activity_uuid'
  | 'aprop_man_equipment_uuid'
  | 'aprop_man_hour_meter'
  | 'aprop_man_mileage'
  | 'provider_uuid'
  | 'appropriation_type';

const APPROPRIATION_ERROR_KEYS: AppropriationErrorKey[] = [
  'aprop_pec_area_uuid',
  'aprop_pec_grazing_uuid',
  'aprop_pec_batch_uuid',
  'aprop_pec_animal_uuid',
  'aprop_pec_operation_uuid',
  'aprop_pec_activity_uuid',
  'aprop_man_equipment_uuid',
  'aprop_man_hour_meter',
  'aprop_man_mileage',
  'provider_uuid',
  'appropriation_type',
];

// Extrai do 422 flat os erros dos campos de Apropriação (um por campo).
// Não-422 ou chaves não relacionadas: ignoradas.
export function extractAppropriationErrors(
  error: unknown
): { key: AppropriationErrorKey; message: string }[] {
  if (!isAxiosError(error) || error.response?.status !== 422) return [];
  const errors = error.response.data?.errors as Record<string, unknown> | null | undefined;
  if (!errors || typeof errors !== 'object') return [];
  return APPROPRIATION_ERROR_KEYS.filter((key) => key in errors).map((key) => {
    const messages = errors[key];
    return {
      key,
      message: Array.isArray(messages) ? String(messages[0]) : String(messages),
    };
  });
}
