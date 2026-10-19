// src/services/v2/BaseRegistrations/familyEquipment-service.ts
// -----------------------------------------------------------------------------
// Family Equipment Service — API v1 do backend Laravel GB.Cerne (Família de
// Bens / catálogo de parâmetros de equipamentos).
//
// Contrato (envelope ApiResponse): { success, message, data, errors, meta }.
//   GET    /family-equipments        → data: FamilyEquipmentListItem[] + meta paginado REAL
//                                       (ApiResponse::paginated — idêntico a CostCenter,
//                                       NÃO o adaptador single-page de Species)
//   GET    /family-equipments/{uuid} → data: FamilyEquipmentDetail
//   POST   /family-equipments        → multipart (FormData)
//   PUT    /family-equipments/{uuid} → multipart via POST + `_method=PUT`
//                                       (method spoofing — PUT nativo não é
//                                       parseado de forma confiável pelo
//                                       Laravel quando o corpo é multipart)
//   DELETE /family-equipments/{uuid} → 204; 422 "está em uso" se referenciado
//                                       (equipments.family_equipment_id FK)
//
// `listFamilyEquipments` ADAPTA o envelope paginado do backend
// ({ data: [], meta: {} }) para o shape `ResponsePagination`
// ({ data: { items, pagination } }) que a infra de grid do projeto
// (useCustomGridQuery/TableProvider) consome — espelha `listCostCenters`
// literalmente (checklist item 4).
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { PaginationQueryParams } from '@/@types/pagination';
import type { Response, ResponsePagination } from '@/@types/response-api';
import type {
  FamilyEquipmentDetail,
  FamilyEquipmentListItem,
  FamilyEquipmentOption,
  FamilyEquipmentOptionsListEnvelope,
  FamilyEquipmentPayload,
  FamilyEquipmentsListEnvelope,
} from '@/@types/v2/BaseRegistrations/familyEquipment';

// Params aceitos pela listagem — paginação padrão + busca + filtros reais do
// backend (`is_enabled`/`type_depreciation`). Checklist item 5: `is_enabled`/
// `type_depreciation` SEMPRE stringificados explicitamente antes de ir para a
// querystring (a API casta `is_enabled` via BuiltinTypeCast bool — aceita
// "true"/"false" string; `type_depreciation` é o Enum backed, aceita o valor
// inteiro como string).
export interface ListFamilyEquipmentsParams extends PaginationQueryParams {
  search?: string;
  is_enabled?: boolean | 'true' | 'false';
  type_depreciation?: 0 | 1 | '0' | '1';
}

async function listFamilyEquipments(
  params: ListFamilyEquipmentsParams
): Promise<ResponsePagination<FamilyEquipmentListItem[]>> {
  const { data } = await api.V2.get<FamilyEquipmentsListEnvelope>('/family-equipments', {
    page: params.page,
    per_page: params.per_page,
    search: params.search || undefined,
    is_enabled: params.is_enabled !== undefined ? String(params.is_enabled) : undefined,
    type_depreciation:
      params.type_depreciation !== undefined ? String(params.type_depreciation) : undefined,
  });

  // Adaptação envelope ApiResponse::paginated → ResponsePagination (grid) —
  // mesmo truque de `listCostCenters` (chave real é `last_page`, confirmado
  // contra app/Http/Responses/ApiResponse.php do api_root).
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

// -----------------------------------------------------------------------------
// GET /family-equipments/options (TASK-FE-652/DF-17) — lookup ENXUTO, UNGATED
// (`GAP-BE-040 Opção B`/`TASK-BE-705`) para o `SelectAsyncPaginate` de
// "Família de Bens" (`InvoiceItemEquipmentPanel.tsx`). Catálogo PAGINADO
// (mirror `listFinancialCategoryOptions`) — `search`/`page`/`per_page`. NÃO
// altera `listFamilyEquipments`/`getFamilyEquipmentByUuid` já existentes —
// coexistem (aquele continua servindo o CRUD dedicado, gateado).
// -----------------------------------------------------------------------------
export interface ListFamilyEquipmentOptionsParams extends PaginationQueryParams {
  search?: string;
  // ERRO-04a — endpoint filtra `is_enabled` opt-in (sem o parâmetro devolve
  // também registros desabilitados); mirror `is_enabled` de
  // `ListFamilyEquipmentsParams`/`listFamilyEquipments` acima.
  is_enabled?: boolean | 'true' | 'false';
}

async function listFamilyEquipmentOptions(
  params: ListFamilyEquipmentOptionsParams
): Promise<ResponsePagination<FamilyEquipmentOption[]>> {
  const { data } = await api.V2.get<FamilyEquipmentOptionsListEnvelope>(
    '/family-equipments/options',
    {
      page: params.page,
      per_page: params.per_page,
      search: params.search || undefined,
      is_enabled: params.is_enabled !== undefined ? String(params.is_enabled) : undefined,
    }
  );

  return {
    success: data.success,
    message: data.message,
    data: {
      items: data.data,
      pagination: {
        total: data.data.length,
        count: data.data.length,
        per_page: data.data.length,
        current_page: 1,
        total_pages: 1,
      },
    },
  };
}

async function getFamilyEquipmentByUuid(uuid: string) {
  const { data } = await api.V2.get<Response<FamilyEquipmentDetail>>(`/family-equipments/${uuid}`);
  return data;
}

// buildFamilyEquipmentFormData — monta o FormData COMPLETO (full-resource,
// checklist item 3: TODOS os campos sempre, nunca um delta de dirtyFields).
function buildFamilyEquipmentFormData(payload: FamilyEquipmentPayload): FormData {
  const fd = new FormData();
  fd.append('description', payload.description);
  fd.append('is_enabled', payload.is_enabled ? '1' : '0');
  fd.append('type_depreciation', String(payload.type_depreciation));
  fd.append('depreciation', payload.depreciation !== null ? String(payload.depreciation) : '');
  fd.append('life_bens', payload.life_bens !== null ? String(payload.life_bens) : '');

  // `residual` só é relevante quando COM_RESIDUAL — mas enviamos sempre que
  // definido (o backend valida/ignora conforme `type_depreciation`; nunca
  // omitimos por conta própria — a UI já limpa o valor ao trocar o tipo).
  if (payload.residual !== null && payload.residual !== undefined) {
    fd.append('residual', String(payload.residual));
  }
  if (payload.vl_time_productive !== null && payload.vl_time_productive !== undefined) {
    fd.append('vl_time_productive', String(payload.vl_time_productive));
  }
  if (payload.vl_time_unproductive !== null && payload.vl_time_unproductive !== undefined) {
    fd.append('vl_time_unproductive', String(payload.vl_time_unproductive));
  }
  if (payload.image) {
    fd.append('image', payload.image);
  }
  if (payload.removeImage) {
    fd.append('remove_image', '1');
  }
  return fd;
}

async function createFamilyEquipment(payload: FamilyEquipmentPayload) {
  const fd = buildFamilyEquipmentFormData(payload);
  const { data } = await api.V2.post<Response<FamilyEquipmentDetail>>('/family-equipments', fd);
  return data;
}

// ⚠️ Achado real da Tarefa (TASK-FE-FE-02): PUT nativo + multipart não é
// parseado de forma confiável pelo Laravel (`$request->all()` fica vazio para
// arquivos em PUT real). Envia como POST + `_method=PUT` dentro do próprio
// FormData (method spoofing padrão do Laravel) — NUNCA `api.V2.put(...)` aqui.
async function updateFamilyEquipment(uuid: string, payload: FamilyEquipmentPayload) {
  const fd = buildFamilyEquipmentFormData(payload);
  fd.append('_method', 'PUT');
  const { data } = await api.V2.post<Response<FamilyEquipmentDetail>>(
    `/family-equipments/${uuid}`,
    fd
  );
  return data;
}

async function deleteFamilyEquipment(uuid: string) {
  const { data } = await api.V2.delete(`/family-equipments/${uuid}`);
  return data;
}

export {
  buildFamilyEquipmentFormData,
  createFamilyEquipment,
  deleteFamilyEquipment,
  getFamilyEquipmentByUuid,
  listFamilyEquipmentOptions,
  listFamilyEquipments,
  updateFamilyEquipment,
};
