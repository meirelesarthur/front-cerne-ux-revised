// src/services/v2/Farms/farm-admin-service.ts
// -----------------------------------------------------------------------------
// Farm ADMIN Service — CRUD administrativo completo de Fazenda (execução 024,
// `TASK-FE-400`). Arquivo NOVO e SEPARADO de `@/services/v2/Farms/farm-service.ts`
// (`TASK-FE-320`, só `listFarms()` sobre `/farms/current-tenant`, sem
// paginação, consumido exclusivamente pelo multiselect de Emissores NFe) —
// são 2 recursos de API distintos, NÃO editar aquele arquivo.
//
// Contrato (envelope ApiResponse): { success, message, data, errors, meta }.
//   GET    /farms                 → data: FarmDetail[] + meta paginado REAL (ApiResponse::paginated)
//   GET    /farms/{uuid}          → data: FarmDetail
//   POST   /farms                 → multipart (FormData), `image`/`centers[]` inline
//   PUT    /farms/{uuid}          → multipart via POST + `_method=PUT` (method
//                                    spoofing — mesmo achado de
//                                    `family-equipment-service.ts`: PUT nativo
//                                    + multipart não é parseado de forma
//                                    confiável pelo Laravel)
//   DELETE /farms/{uuid}          → 204
//   GET    /farms/{uuid}/centers  → data: FarmCenterOption[], SEM paginação
//   PUT    /farms/{uuid}/centers  → sync avulso (fora do escopo desta tela —
//                                    exposto por completude do contrato Grupo C)
//
// `listFarms` ADAPTA o envelope paginado do backend para o shape
// `ResponsePagination` (mesmo truque de `listCostCenters`/`listFamilyEquipments`).
//
// ✅ GAP-FE-120/GAP-FE-124 FECHADOS (companheira desta execução, backend
// commitado em `TASK-BE-421`/`TASK-BE-424`) — `city_uuid`/`country_uuid`
// (string, uuid) substituem `city_id`/`country_id` (integer) no payload de
// escrita — ver `FarmPayload` (`@/@types/v2/Farms/farm-admin`).
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { PaginationQueryParams } from '@/@types/pagination';
import type { Response, ResponsePagination } from '@/@types/response-api';
import type {
  FarmCenterOption,
  FarmCentersEnvelope,
  FarmDetail,
  FarmPayload,
  FarmsListEnvelope,
} from '@/@types/v2/Farms/farm-admin';

// Params aceitos pela listagem — paginação real + filtros reais de
// `FarmFilterData` (search/tenant_id/is_enabled — SEM `state_id`, que a
// prosa do contrato menciona mas o código real não implementa). `country_id`
// foi REMOVIDO da UI na `TASK-FE-580` (decisão do dev); o backend continua
// aceitando o param, a SPA só parou de enviá-lo.
export interface ListFarmsParams extends PaginationQueryParams {
  search?: string;
  tenant_id?: number | string;
  is_enabled?: 'true' | 'false';
}

async function listFarms(params: ListFarmsParams): Promise<ResponsePagination<FarmDetail[]>> {
  const { data } = await api.V2.get<FarmsListEnvelope>('/farms', {
    page: params.page,
    per_page: params.per_page,
    search: params.search || undefined,
    tenant_id: params.tenant_id || undefined,
    is_enabled: params.is_enabled || undefined,
  });

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

async function getFarmByUuid(farmUuid: string) {
  const { data } = await api.V2.get<Response<FarmDetail>>(`/farms/${farmUuid}`);
  return data;
}

// buildFarmFormData — monta o FormData COMPLETO (full-resource, mirror
// `buildFamilyEquipmentFormData`) — sempre multipart por causa do `image`,
// mesmo quando a logo não muda (TASK-FE-403).
function buildFarmFormData(payload: FarmPayload): FormData {
  const fd = new FormData();
  fd.append('description', payload.description);
  fd.append('descriptive', payload.descriptive);
  fd.append('total_area', String(payload.total_area));
  fd.append('value_ha', String(payload.value_ha));
  fd.append('city_uuid', payload.city_uuid);
  fd.append('country_uuid', payload.country_uuid);
  fd.append('is_enabled', payload.is_enabled ? '1' : '0');
  fd.append('control_supplies_stock', payload.control_supplies_stock ? '1' : '0');
  fd.append('use_cash_book', payload.use_cash_book ? '1' : '0');
  fd.append('cost_processing_date', String(payload.cost_processing_date));
  fd.append('phone', payload.phone);
  fd.append('coin', payload.coin);
  fd.append('zip_code', payload.zip_code);
  fd.append('district', payload.district);

  if (payload.tenant_id !== undefined) fd.append('tenant_id', String(payload.tenant_id));
  if (payload.car) fd.append('car', payload.car);
  if (payload.note) fd.append('note', payload.note);
  if (payload.rate !== undefined && payload.rate !== null) fd.append('rate', String(payload.rate));
  if (payload.nif) fd.append('nif', payload.nif);
  if (payload.state_registration) fd.append('state_registration', payload.state_registration);
  if (payload.cafir) fd.append('cafir', payload.cafir);
  if (payload.caepf) fd.append('caepf', payload.caepf);
  if (payload.number) fd.append('number', payload.number);
  if (payload.exploration_type !== undefined) {
    fd.append('exploration_type', String(payload.exploration_type));
  }
  if (payload.nirf) fd.append('nirf', payload.nirf);
  if (payload.ccir) fd.append('ccir', payload.ccir);
  if (payload.latitude_longitude) fd.append('latitude_longitude', payload.latitude_longitude);

  // GAP-FE-121 fechado (reaberto, TASK-FE-414) — `coordinates` (GeoJSON do
  // polígono desenhado/importado na etapa Demarcação) agora é enviado de
  // fato; omitido apenas quando `null`/ausente (nenhum perímetro demarcado,
  // step opcional) — campo `nullable` no backend, omitir continua seguro.
  if (payload.coordinates) fd.append('coordinates', payload.coordinates);

  // `centers` sempre enviado (mesmo vazio) — TASK-FE-403: o backend só
  // sincroniza quando o campo está PRESENTE; ausência preserva os centros já
  // vinculados (comportamento documentado em §7.4 do contrato).
  (payload.centers ?? []).forEach((uuid) => fd.append('centers[]', uuid));

  if (payload.image) {
    fd.append('image', payload.image);
  }
  if (payload.remove_image) {
    fd.append('remove_image', '1');
  }
  return fd;
}

async function createFarm(payload: FarmPayload) {
  const fd = buildFarmFormData(payload);
  const { data } = await api.V2.post<Response<FarmDetail>>('/farms', fd);
  return data;
}

// PUT + multipart — method spoofing (`_method=PUT`), mesmo achado real já
// documentado em `family-equipment-service.ts` (PUT nativo + multipart não é
// parseado de forma confiável pelo Laravel).
async function updateFarm(farmUuid: string, payload: FarmPayload) {
  const fd = buildFarmFormData(payload);
  fd.append('_method', 'PUT');
  const { data } = await api.V2.post<Response<FarmDetail>>(`/farms/${farmUuid}`, fd);
  return data;
}

async function deleteFarm(farmUuid: string) {
  const { data } = await api.V2.delete(`/farms/${farmUuid}`);
  return data;
}

// GET /farms/{uuid}/centers — Grupo C, só disponível em modo EDIÇÃO (exige
// `{uuid}` de uma farm já criada). Exposto por completude do contrato — a
// tela de formulário (`TASK-FE-403`) usa `listCostCenterOptions` (catálogo
// geral do tenant) como fonte ÚNICA do multiselect em AMBOS os modos
// (decisão da Tarefa, evita 2 caminhos de código); esta função fica
// disponível para consumo futuro (ex.: tela de detalhe/gestão avulsa de
// centros).
async function listFarmCenters(farmUuid: string) {
  const { data } = await api.V2.get<FarmCentersEnvelope>(`/farms/${farmUuid}/centers`);
  return data.data ?? ([] as FarmCenterOption[]);
}

// PUT /farms/{uuid}/centers — sync avulso (Grupo C). Fora do escopo desta
// tela (o sync inline já acontece dentro de create/update), exposto por
// completude do contrato.
async function syncFarmCenters(farmUuid: string, centers: string[]) {
  const { data } = await api.V2.put<Response<FarmDetail>>(`/farms/${farmUuid}/centers`, {
    centers,
  });
  return data;
}

export {
  buildFarmFormData,
  createFarm,
  deleteFarm,
  getFarmByUuid,
  listFarmCenters,
  listFarms,
  syncFarmCenters,
  updateFarm,
};
