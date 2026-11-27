// src/pages/CadastrosBase/TiposServico/serviceTypeService.ts
// -----------------------------------------------------------------------------
// PROTÓTIPO (27/11/2026, não portar) — chamadas do cadastro de Tipos de serviço.
// Só existem no simulador (`mocks/dev-api/handlers/serviceTypesDemo.ts`, caminhos
// `/prototype/service-types`); a API de verdade ainda não existe (as telas antigas
// continuam em `/operations` e `/activities`, que não mudam).
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { Response, ResponsePagination } from '@/@types/response-api';

import type { ServiceTypeParams, ServiceTypeUse } from './serviceTypeParams';

export interface ServiceTypeListItem {
  uuid: string;
  name: string;
  description: string | null;
  grouper_uuid: string | null;
  grouper_name: string | null;
  order: number;
  is_enabled: boolean;
  use: ServiceTypeUse;
  generates_execution: boolean;
}

export interface ServiceTypeDetail extends ServiceTypeListItem, ServiceTypeParams {}

export interface ServiceTypePayload extends ServiceTypeParams {
  name: string;
  description: string | null;
  grouper_uuid: string | null;
  is_enabled: boolean;
  order: number;
}

export interface ServiceTypeFilter {
  search?: string;
  use?: ServiceTypeUse;
  grouper_uuid?: string;
  is_enabled?: 'true' | 'false';
  generates_execution?: 'true' | 'false';
  /** Só para mostrar o nome no filtro; nunca vai à API. */
  grouper_label?: string;
}

export interface PrototypeOption {
  uuid: string;
  name: string;
}

export interface PrototypeGrouperOption {
  uuid: string;
  code: string;
  name: string;
}

interface ListEnvelope<T> {
  success: boolean;
  message: string;
  data: T[];
  meta?: { total?: number; per_page?: number; current_page?: number; last_page?: number };
}

export const SERVICE_TYPES_PATH = '/prototype/service-types';

export const serviceTypeQueryKey = {
  list: 'prototype-service-types-list',
  detail: 'prototype-service-types-detail',
  options: 'prototype-service-types-options',
  groupers: 'prototype-service-types-groupers',
  nextOrder: 'prototype-service-types-next-order',
} as const;

/** Adapta o envelope paginado ao formato que `useCustomGridQuery` espera. */
export function toGridResponse<T>(data: ListEnvelope<T>): ResponsePagination<T[]> {
  return {
    success: data.success,
    message: data.message,
    data: {
      items: data.data,
      pagination: {
        total: data.meta?.total ?? data.data.length,
        count: data.data.length,
        per_page: data.meta?.per_page ?? data.data.length,
        current_page: data.meta?.current_page ?? 1,
        total_pages: data.meta?.last_page ?? 1,
      },
    },
  };
}

export async function listServiceTypes(
  params: { page?: number; per_page?: number } & ServiceTypeFilter
): Promise<ResponsePagination<ServiceTypeListItem[]>> {
  const { data } = await api.V2.get<ListEnvelope<ServiceTypeListItem>>(SERVICE_TYPES_PATH, {
    page: params.page,
    per_page: params.per_page,
    search: params.search || undefined,
    use: params.use || undefined,
    grouper_uuid: params.grouper_uuid || undefined,
    is_enabled: params.is_enabled || undefined,
    generates_execution: params.generates_execution || undefined,
  });
  return toGridResponse(data);
}

export async function getServiceType(uuid: string) {
  const { data } = await api.V2.get<Response<ServiceTypeDetail>>(`${SERVICE_TYPES_PATH}/${uuid}`);
  return data;
}

export async function getNextServiceTypeOrder() {
  const { data } = await api.V2.get<Response<{ next_order: number }>>(`${SERVICE_TYPES_PATH}/next-order`);
  return data;
}

export async function createServiceType(payload: ServiceTypePayload) {
  const { data } = await api.V2.post<Response<ServiceTypeDetail>>(SERVICE_TYPES_PATH, payload);
  return data;
}

export async function updateServiceType(uuid: string, payload: ServiceTypePayload) {
  const { data } = await api.V2.put<Response<ServiceTypeDetail>>(`${SERVICE_TYPES_PATH}/${uuid}`, payload);
  return data;
}

export async function deleteServiceType(uuid: string) {
  const { data } = await api.V2.delete(`${SERVICE_TYPES_PATH}/${uuid}`);
  return data;
}

/** Tipos de serviço (nome) para filtro e para o formulário de Serviços. */
export async function listServiceTypeOptions(): Promise<PrototypeOption[]> {
  const { data } = await api.V2.get<Response<PrototypeOption[]>>(`${SERVICE_TYPES_PATH}/options`);
  return data.data;
}

export async function listPrototypeGrouperOptions(): Promise<PrototypeGrouperOption[]> {
  const { data } = await api.V2.get<Response<PrototypeGrouperOption[]>>(`${SERVICE_TYPES_PATH}/grouper-options`);
  return data.data;
}
