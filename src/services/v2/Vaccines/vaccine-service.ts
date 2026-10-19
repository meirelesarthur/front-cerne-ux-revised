// src/services/v2/Vaccines/vaccine-service.ts
// -----------------------------------------------------------------------------
// Vaccine Service — API v1 do backend Laravel GB.Cerne (Vacinas).
//
// Contrato (envelope ApiResponse): { success, message, data, errors, meta }.
//   GET    /vaccines          → data: VaccineListItem[], meta com paginação real
//   GET    /vaccines/{uuid}   → data: VaccineData
//   POST   /vaccines          → payload VaccinePayload (specie_uuid OPCIONAL — D2)
//   PUT    /vaccines/{uuid}   → payload VaccinePayload (SEMPRE completo)
//   DELETE /vaccines/{uuid}   → 204; exclusão física, SEM guarda de FK (D5 —
//                                cascata real confirmada no pivô
//                                item_sanitary_vaccines)
//
// `listVaccines` ADAPTA o envelope { data: [], meta: {} } para o shape
// `ResponsePagination` que `useCustomGridQuery`/`TableProvider` consomem —
// mesmo adaptador de `listBreeds`. `specie_uuid` vai na querystring
// (filtro server-side). Catálogo GLOBAL (D1) — sem X-Farm-Id manual, sem
// bloco farm.context (mesma exceção já aplicada a species/breeds/
// category-animals).
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { PaginationQueryParams } from '@/@types/pagination';
import type { Response, ResponsePagination } from '@/@types/response-api';
import type {
  VaccineData,
  VaccineListItem,
  VaccinePayload,
  VaccinesListEnvelope,
} from '@/@types/v2/Vaccines';

export interface ListVaccinesParams extends PaginationQueryParams {
  search?: string;
  is_enabled?: 'true' | 'false';
  specie_uuid?: string;
}

async function listVaccines(
  params: ListVaccinesParams
): Promise<ResponsePagination<VaccineListItem[]>> {
  const { data } = await api.V2.get<VaccinesListEnvelope>('/vaccines', {
    page: params.page,
    per_page: params.per_page,
    search: params.search || undefined,
    is_enabled: params.is_enabled || undefined,
    specie_uuid: params.specie_uuid || undefined,
  });

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

async function getVaccineByUuid(uuid: string) {
  const { data } = await api.V2.get<Response<VaccineData>>(`/vaccines/${uuid}`);
  return data;
}

async function createVaccine(payload: VaccinePayload) {
  const { data } = await api.V2.post<Response<VaccineData>>('/vaccines', payload);
  return data;
}

async function updateVaccine(uuid: string, payload: VaccinePayload) {
  const { data } = await api.V2.put<Response<VaccineData>>(`/vaccines/${uuid}`, payload);
  return data;
}

async function deleteVaccine(uuid: string) {
  const { data } = await api.V2.delete(`/vaccines/${uuid}`);
  return data;
}

export { createVaccine, deleteVaccine, getVaccineByUuid, listVaccines, updateVaccine };
