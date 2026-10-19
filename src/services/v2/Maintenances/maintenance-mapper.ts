/* eslint-disable camelcase -- campos snake_case do contrato da API */
// src/services/v2/Maintenances/maintenance-mapper.ts
// -----------------------------------------------------------------------------
// UT-000684 — mapper ÚNICO API (executor aninhado) → shape plano das telas.
// A API (`MaintenanceItemResource`) devolve `executor: {type, employee|provider,
// quantity?, amount?, total_amount}` ou `null`; as telas leem campos planos
// (`executor_type`, `employee`, `provider`, `employee_*`, `provider_total`).
// Puro, sem recálculo de valores (FID-G3F §3) e sem inventar `uuid` de item.
// -----------------------------------------------------------------------------

import type { Option } from '@/@types/option';
import type {
  MaintenanceDetail,
  MaintenanceDetailApi,
  MaintenanceItemApi,
  MaintenanceItemForm,
  MaintenanceItemListData,
} from '@/@types/v2/Maintenances';

function toNumber(value: number | string | null | undefined): number | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function mapMaintenanceItem(item: MaintenanceItemApi): MaintenanceItemListData {
  const executor = item.executor ?? null;

  const base = {
    equipment: item.equipment,
    hour_meter: toNumber(item.hour_meter),
    mileage: toNumber(item.mileage),
    warehouse: item.warehouse ?? null,
    product: item.product ?? null,
    measurement: item.measurement ?? null,
    quantity: toNumber(item.quantity),
    amount: toNumber(item.amount),
    total_amount: toNumber(item.total_amount),
    note: item.note ?? null,
  };

  if (executor?.type === 'employee') {
    return {
      ...base,
      executor_type: 'employee',
      employee: executor.employee ?? null,
      provider: null,
      employee_quantity: toNumber(executor.quantity),
      employee_amount: toNumber(executor.amount),
      employee_total_amount: toNumber(executor.total_amount),
      provider_total: null,
    };
  }

  if (executor?.type === 'provider') {
    const total = toNumber(executor.total_amount);
    return {
      ...base,
      executor_type: 'provider',
      employee: null,
      provider: executor.provider ?? null,
      employee_quantity: null,
      employee_amount: null,
      employee_total_amount: total,
      provider_total: total,
    };
  }

  return {
    ...base,
    executor_type: null,
    employee: null,
    provider: null,
    employee_quantity: null,
    employee_amount: null,
    employee_total_amount: null,
    provider_total: null,
  };
}

export function mapMaintenanceDetail(detail: MaintenanceDetailApi): MaintenanceDetail {
  const { items, has_financial, ...rest } = detail;
  return {
    ...rest,
    has_financial: has_financial === true,
    items: (items ?? []).map(mapMaintenanceItem),
  };
}

// Hidratação da Edição: shape normalizado → `MaintenanceItemForm`
// (preserva executor/funcionário/qtd/fornecedor/valor).
export function mapMaintenanceItemToForm(
  item: MaintenanceItemListData,
  executorLabels: { employee: string; provider: string }
): MaintenanceItemForm {
  const executorType: Option<'employee' | 'provider'> | null = item.executor_type
    ? {
        value: item.executor_type,
        label:
          item.executor_type === 'employee' ? executorLabels.employee : executorLabels.provider,
      }
    : null;

  return {
    equipment_uuid: { value: item.equipment.uuid, label: item.equipment.description },
    hour_meter: item.hour_meter,
    mileage: item.mileage,
    warehouse_uuid: item.warehouse
      ? { value: item.warehouse.uuid, label: item.warehouse.description }
      : null,
    product_uuid: item.product
      ? { value: item.product.uuid, label: item.product.description }
      : null,
    measurement_uuid: item.measurement
      ? { value: item.measurement.uuid, label: item.measurement.name }
      : null,
    quantity: item.quantity,
    note: item.note,
    executor_type: executorType,
    employee_uuid: item.employee ? { value: item.employee.uuid, label: item.employee.name } : null,
    employee_quantity: item.employee_quantity ?? null,
    provider_uuid: item.provider ? { value: item.provider.uuid, label: item.provider.name } : null,
    provider_total: item.provider_total ?? null,
  };
}

// Regra de exibição do botão "Gerar Financeiro" (FLX-057/23, FLX-058/7):
// permissão + ao menos um item com fornecedor + sem despesa já gerada.
export function canShowGenerateFinancial(
  detail: MaintenanceDetail | undefined,
  hasPermission: boolean
): boolean {
  if (!detail || !hasPermission) {
    return false;
  }
  const hasProviderItem = detail.items.some((row) => row.provider != null);
  return hasProviderItem && detail.has_financial !== true;
}
