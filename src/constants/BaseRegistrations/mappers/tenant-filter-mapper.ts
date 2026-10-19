// src/constants/BaseRegistrations/mappers/tenant-filter-mapper.ts
// -----------------------------------------------------------------------------
// Mapper PURO do filtro da listagem de Contratantes (TASK-072-FE-07, I10).
//
//   filtro aplicado (cru, persistido)  ⇄  form interno do drawer (Options)
//   filtro aplicado                    →  params do `GET /tenants`
//
// Contrato real: `TenantIndexRequest` (API v1.2, TASK-072-API-03). Valores
// fora do enum/formato viram `null` na volta para o form (nunca quebram o
// drawer nem geram 422 ao reaplicar). Vazios são omitidos no request.
// -----------------------------------------------------------------------------

import { tenantDueDayOptions } from '@/constants/BaseRegistrations/options/tenant-due-day-options';
import { tenantDueMonthOptions } from '@/constants/BaseRegistrations/options/tenant-due-month-options';
import { tenantSignatureOptions } from '@/constants/BaseRegistrations/options/tenant-signature-options';
import { tenantStatusOptions } from '@/constants/BaseRegistrations/options/tenant-status-options';

import type { LanguageDate } from '@/@types/language';
import type { Option } from '@/@types/option';
import type {
  TenantListFilterParams,
  TenantsFilterForm,
  TenantsFilterFormInternal,
} from '@/@types/v2/BaseRegistrations/tenant';

/** Limite do `search` no back (`TenantIndexRequest`: `max:60`). */
export const TENANT_FILTER_SEARCH_MAX_LENGTH = 60;

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Chaves que o `GET /tenants` aceita (ordem estável, usada também na contagem). */
const REQUEST_KEYS: (keyof TenantListFilterParams)[] = [
  'search',
  'status',
  'signature',
  'due_month',
  'dt_accession',
  'due_day',
  'start_date',
  'end_date',
  'role_uuid',
  'plan_uuid',
];

export const tenantFilterPristineValues: TenantsFilterFormInternal = {
  search: '',
  status: null,
  signature: null,
  due_month: null,
  due_day: null,
  dt_accession: null,
  start_date: null,
  end_date: null,
  role_uuid: null,
  plan_uuid: null,
};

function isPresent(value: unknown): boolean {
  return value !== undefined && value !== null && value !== '';
}

function findOption<T>(options: Option<T>[], value: unknown): Option<T> | null {
  if (!isPresent(value)) return null;
  return options.find((option) => String(option.value) === String(value)) ?? null;
}

function toIsoDateOrNull(value?: string | null): string | null {
  return value && ISO_DATE.test(value) ? value : null;
}

function toAsyncOption(uuid?: string, label?: string): Option<string> | null {
  if (!uuid || !UUID.test(uuid)) return null;
  return { value: uuid, label: label || uuid };
}

/**
 * Filtro aplicado → valores internos do drawer (re-hidratação ao abrir).
 * @param {TenantsFilterForm | null | undefined} filter Filtro persistido.
 * @param {LanguageDate} languageGB Tradução corrente (rótulos das Options).
 * @return {TenantsFilterFormInternal} Valores do form; inválidos viram `null`.
 */
export function toInternalValues(
  filter: TenantsFilterForm | null | undefined,
  languageGB: LanguageDate
): TenantsFilterFormInternal {
  return {
    search: filter?.search ?? '',
    status: findOption(tenantStatusOptions.options(languageGB), filter?.status),
    signature: findOption(tenantSignatureOptions.options(languageGB), filter?.signature),
    due_month: findOption(tenantDueMonthOptions.options(languageGB), filter?.due_month),
    due_day: findOption(tenantDueDayOptions.options(languageGB), filter?.due_day),
    dt_accession: toIsoDateOrNull(filter?.dt_accession),
    start_date: toIsoDateOrNull(filter?.start_date),
    end_date: toIsoDateOrNull(filter?.end_date),
    role_uuid: toAsyncOption(filter?.role_uuid, filter?.role_label),
    plan_uuid: toAsyncOption(filter?.plan_uuid, filter?.plan_label),
  };
}

/**
 * Valores internos do drawer → filtro aplicado (vazios omitidos).
 * @param {TenantsFilterFormInternal} internal Valores do form do drawer.
 * @return {TenantsFilterForm} Filtro cru a persistir.
 */
export function toFilterRequest(internal: TenantsFilterFormInternal): TenantsFilterForm {
  const filter: TenantsFilterForm = {
    search: internal.search?.trim() || undefined,
    status: internal.status?.value ?? undefined,
    signature: internal.signature?.value ?? undefined,
    due_month: internal.due_month?.value ?? undefined,
    due_day: internal.due_day?.value ?? undefined,
    dt_accession: toIsoDateOrNull(internal.dt_accession) ?? undefined,
    start_date: toIsoDateOrNull(internal.start_date) ?? undefined,
    end_date: toIsoDateOrNull(internal.end_date) ?? undefined,
    role_uuid: internal.role_uuid?.value || undefined,
    plan_uuid: internal.plan_uuid?.value || undefined,
    role_label: internal.role_uuid?.value ? internal.role_uuid.label : undefined,
    plan_label: internal.plan_uuid?.value ? internal.plan_uuid.label : undefined,
  };

  return Object.fromEntries(
    Object.entries(filter).filter(([, value]) => isPresent(value))
  ) as TenantsFilterForm;
}

/**
 * Filtro aplicado → params do `GET /tenants` (só chaves do contrato, sem vazios).
 * @param {TenantsFilterForm | null | undefined} filter Filtro persistido.
 * @return {TenantListFilterParams} Query params aceitos pelo `TenantIndexRequest`.
 */
export function toTenantListParams(
  filter: TenantsFilterForm | null | undefined
): TenantListFilterParams {
  const params: Record<string, unknown> = {};
  for (const key of REQUEST_KEYS) {
    const value = filter?.[key];
    if (isPresent(value)) params[key] = typeof value === 'string' ? value.trim() : value;
  }
  return params as TenantListFilterParams;
}

/**
 * Quantidade de filtros aplicados (badge do botão Filtrar) — ignora rótulos.
 * @param {TenantsFilterForm | null | undefined} filter Filtro persistido.
 * @return {number} Total de chaves de contrato preenchidas.
 */
export function countAppliedTenantFilters(filter: TenantsFilterForm | null | undefined): number {
  return Object.keys(toTenantListParams(filter)).length;
}
