// src/services/v2/BaseRegistrations/marker-service.ts
// -----------------------------------------------------------------------------
// Marker Service — API v1 do backend Laravel GB.Cerne (Marcadores / catálogo
// global de ícones do mapa da propriedade).
//
// Contrato (envelope ApiResponse): { success, message, data, errors, meta }.
//   GET    /markers          → data: MarkerListItem[] + meta paginado REAL
//                               (ApiResponse::paginated, 15/página — idêntico a
//                               FamilyEquipment/Contador)
//   GET    /markers/{uuid}   → data: MarkerDetail (TASK-MK-FE-02)
//   POST   /markers          → multipart (TASK-MK-FE-02) — `icon` OBRIGATÓRIO
//                               (DA-MK-17)
//   POST   /markers/{uuid}
//     + _method=PUT           → multipart, method spoofing (TASK-MK-FE-02) —
//                               `icon` opcional, `remove_icon` remove o atual
//   DELETE /markers/{uuid}   → 204; 422 `errors.in_use` (mapa `{tabela: count}`,
//                               GAP-MK-FE-01) se em uso
//
// `listMarkers` ADAPTA o envelope paginado do backend ({ data: [], meta: {} })
// para o shape `ResponsePagination` ({ data: { items, pagination } }) que a
// infra de grid do projeto (useCustomGridQuery/TableProvider) consome —
// espelha `listFamilyEquipments` literalmente (checklist item 2).
//
// `buildMarkerFormData`/`createMarker`/`updateMarker` (TASK-MK-FE-02) espelham
// `buildFamilyEquipmentFormData`/`createFamilyEquipment`/`updateFamilyEquipment`
// — `is_enabled` vai como `'1'`/`'0'` (NUNCA `'true'`/`'false'` string: a regra
// `boolean` do Laravel rejeita esse literal em payload multipart, achado
// confirmado em teste real da API); `type` vai como o INTEIRO do enum
// stringificado (`String(1)`/`String(2)`), nunca o nome do case; `update` usa
// `POST` + `_method=PUT` (method spoofing) — NUNCA `api.V2.put()` com
// `FormData` (mesmo achado real de `FamilyEquipment`, PUT nativo + multipart
// não é parseado de forma confiável pelo Laravel).
// -----------------------------------------------------------------------------

import type { MarkerType } from '@/constants/Marker/marker-type';

import api from '@/services/api';

import type { PaginationQueryParams } from '@/@types/pagination';
import type { Response, ResponsePagination } from '@/@types/response-api';
import type {
  MarkerDetail,
  MarkerListItem,
  MarkerPayload,
  MarkersListEnvelope,
} from '@/@types/v2/BaseRegistrations/marker';

// Params aceitos pela listagem — paginação padrão + busca + filtros reais do
// backend (`type`/`is_enabled`). Checklist item 3: `type`/`is_enabled` SEMPRE
// stringificados explicitamente antes de ir para a querystring (a API aceita
// `type` como o INTEIRO do enum backed e `is_enabled` como booleano, ambos
// via cast coerente — mas a querystring HTTP só carrega string).
export interface ListMarkersParams extends PaginationQueryParams {
  search?: string;
  type?: 1 | 2 | '1' | '2';
  is_enabled?: boolean | 'true' | 'false';
}

async function listMarkers(
  params: ListMarkersParams
): Promise<ResponsePagination<MarkerListItem[]>> {
  const { data } = await api.V2.get<MarkersListEnvelope>('/markers', {
    page: params.page,
    per_page: params.per_page,
    search: params.search || undefined,
    type: params.type !== undefined ? String(params.type) : undefined,
    is_enabled: params.is_enabled !== undefined ? String(params.is_enabled) : undefined,
  });

  // Adaptação envelope ApiResponse::paginated → ResponsePagination (grid) —
  // mesmo truque de `listFamilyEquipments`/`listCostCenters` (chave real é
  // `last_page`, confirmado contra `app/Http/Responses/ApiResponse.php` do
  // api_root).
  return {
    success: data.success,
    message: data.message,
    data: {
      items: data.data,
      pagination: {
        total: data.meta?.total ?? data.data.length,
        count: data.data.length,
        per_page: data.meta?.per_page ?? params.per_page ?? data.data.length,
        current_page: data.meta?.current_page ?? params.page ?? 1,
        total_pages: data.meta?.last_page ?? 1,
      },
    },
  };
}

async function deleteMarker(uuid: string) {
  const { data } = await api.V2.delete(`/markers/${uuid}`);
  return data;
}

async function getMarkerByUuid(uuid: string) {
  const { data } = await api.V2.get<Response<MarkerDetail>>(`/markers/${uuid}`);
  return data;
}

// `GET /markers/active` — catálogo ABERTO (SOMENTE `auth:sanctum`, SEM
// `permission:markers_view`, DA-MK-12) de marcadores `is_enabled=true`,
// opcionalmente filtrado por `type` (1=Atividade/2=Infraestrutura,
// `markerType`). Devolve `data` como ARRAY NÃO-PAGINADO (`ApiResponse::success`
// + `MarkerResource::collection`), diferente do shape paginado de `listMarkers`
// acima (`ApiResponse::paginated`, gated por `markers_view`). Consumido pelos
// selects de Atividade/Infraestrutura do formulário de Área (F-348/UT-000446,
// GAP-FE correções do dono) — `markers_view` é uma permissão administrativa
// (CRUD de Marcadores) que o usuário comum de Área não tem; usar `listMarkers`
// nesses selects gerava 403/toast "Sem permissão" mesmo com sessão válida.
async function listActiveMarkers(type?: MarkerType): Promise<MarkerListItem[]> {
  const { data } = await api.V2.get<Response<MarkerListItem[]>>('/markers/active', {
    type: type !== undefined ? String(type) : undefined,
  });
  return data.data ?? [];
}

// Full-resource sempre (checklist item — nunca um delta de `dirtyFields`).
// `is_enabled` como `'1'`/`'0'` (não `'true'`/`'false'`, ver nota de cabeçalho
// do arquivo); `type` como o INTEIRO stringificado (armadilha #2).
function buildMarkerFormData(payload: MarkerPayload): FormData {
  const fd = new FormData();
  fd.append('description', payload.description);
  fd.append('is_enabled', payload.is_enabled ? '1' : '0');
  fd.append('type', String(payload.type));
  if (payload.icon) {
    fd.append('icon', payload.icon);
  }
  if (payload.removeIcon) {
    fd.append('remove_icon', '1');
  }
  return fd;
}

async function createMarker(payload: MarkerPayload) {
  const { data } = await api.V2.post<Response<MarkerDetail>>(
    '/markers',
    buildMarkerFormData(payload)
  );
  return data;
}

// Method spoofing — NUNCA `api.V2.put()` com `FormData` (ver nota de cabeçalho
// do arquivo).
async function updateMarker(uuid: string, payload: MarkerPayload) {
  const fd = buildMarkerFormData(payload);
  fd.append('_method', 'PUT');
  const { data } = await api.V2.post<Response<MarkerDetail>>(`/markers/${uuid}`, fd);
  return data;
}

export {
  buildMarkerFormData,
  createMarker,
  deleteMarker,
  getMarkerByUuid,
  listActiveMarkers,
  listMarkers,
  updateMarker,
};
