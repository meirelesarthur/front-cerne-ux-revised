// src/pages/CadastrosBase/ServicosAgricolas/serviceService.ts
// -----------------------------------------------------------------------------
// PROTÓTIPO (27/11/2026, não portar) — chamadas do cadastro de Serviços (o antigo
// cadastro de Atividades). Só existem no simulador (`/prototype/services`).
// O Serviço é só nome, descrição e situação; os parâmetros ficam no Tipo de serviço.
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { Response, ResponsePagination } from '@/@types/response-api';

import { type PrototypeOption, toGridResponse } from '../TiposServico/serviceTypeService';

export interface ServiceListItem {
  uuid: string;
  name: string;
  description: string | null;
  is_enabled: boolean;
  /** Um serviço pode estar em vários Tipos de serviço. */
  service_types: PrototypeOption[];
}

export interface ServicePayload {
  name: string;
  description: string | null;
  is_enabled: boolean;
  service_type_uuids: string[];
}

export interface ServiceFilter {
  search?: string;
  service_type_uuid?: string;
  is_enabled?: 'true' | 'false';
  /** Só para mostrar o nome no filtro; nunca vai à API. */
  service_type_label?: string;
}

interface ListEnvelope<T> {
  success: boolean;
  message: string;
  data: T[];
  meta?: { total?: number; per_page?: number; current_page?: number; last_page?: number };
}

export const SERVICES_PATH = '/prototype/services';

export const serviceQueryKey = {
  list: 'prototype-services-list',
  detail: 'prototype-services-detail',
} as const;

export async function listServices(
  params: { page?: number; per_page?: number } & ServiceFilter
): Promise<ResponsePagination<ServiceListItem[]>> {
  const { data } = await api.V2.get<ListEnvelope<ServiceListItem>>(SERVICES_PATH, {
    page: params.page,
    per_page: params.per_page,
    search: params.search || undefined,
    service_type_uuid: params.service_type_uuid || undefined,
    is_enabled: params.is_enabled || undefined,
  });
  return toGridResponse(data);
}

export async function getService(uuid: string) {
  const { data } = await api.V2.get<Response<ServiceListItem>>(`${SERVICES_PATH}/${uuid}`);
  return data;
}

export async function createService(payload: ServicePayload) {
  const { data } = await api.V2.post<Response<ServiceListItem>>(SERVICES_PATH, payload);
  return data;
}

export async function updateService(uuid: string, payload: ServicePayload) {
  const { data } = await api.V2.put<Response<ServiceListItem>>(`${SERVICES_PATH}/${uuid}`, payload);
  return data;
}

export async function deleteService(uuid: string) {
  const { data } = await api.V2.delete(`${SERVICES_PATH}/${uuid}`);
  return data;
}
