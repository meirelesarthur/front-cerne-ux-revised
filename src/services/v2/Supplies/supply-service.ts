// src/services/v2/Supplies/supply-service.ts
// -----------------------------------------------------------------------------
// Supply Service — API v1 do backend Laravel GB.Cerne (Abastecimentos, Gestão
// de Frota). Tabela dedicada `supplies` (AD-01, zero reuso de Apontamentos).
//
// Contrato (envelope ApiResponse): { success, message, data, errors, meta }.
//   GET    /supplies                          → data: SupplyListItem[] + meta
//                                                de paginação (Tarefa 40)
//   POST   /supplies                          → payload SupplyPayload,
//                                                permission
//                                                appropriation-supplies_create
//                                                (Tarefa 41)
//   GET    /supplies/last-reading/{equipment}  → { hour_meter, mileage },
//                                                200 mesmo sem histórico
//                                                prévio (Tarefa 41, cascata 1)
//   GET    /supplies/{uuid}                    → SupplyDetail (show — reusado
//                                                para hidratar Visualização E
//                                                Edição, sem GET .../edit,
//                                                Tarefa 40)
//   PUT    /supplies/{uuid}                    → payload SupplyPayload,
//                                                full-replace de items[]
//                                                (Tarefa 41)
//   DELETE /supplies/{uuid}                    → 204 (Tarefa 40)
//
// `listSupplies` ADAPTA o envelope paginado do backend ({ data: [], meta: {} })
// para o shape `ResponsePagination` ({ data: { items, pagination } }) que a
// infra de grid do projeto (useCustomGridQuery/TableProvider) consome — mirror
// `listWarehouses`/`listStocks` (meta REAL, nunca fallback fake).
//
// `createSupply`/`updateSupply` enviam JSON puro (sem `FormData`) — o
// contrato §4 NÃO tem upload de arquivo nesta feature (diferente de
// `appropriation-service.ts`).
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { PaginationQueryParams } from '@/@types/pagination';
import type { Response, ResponsePagination } from '@/@types/response-api';
import type {
  SupplyDetail,
  SupplyLastReading,
  SupplyListItem,
  SupplyPayload,
  SuppliesListEnvelope,
} from '@/@types/v2/Supplies';

// ============================================
// LISTAGEM — GET /supplies (Tarefa 40)
// ============================================

export interface ListSuppliesParams extends PaginationQueryParams {
  equipment_uuid?: string;
  start_date?: string;
  end_date?: string;
}

async function listSupplies(
  params: ListSuppliesParams
): Promise<ResponsePagination<SupplyListItem[]>> {
  const { data } = await api.V2.get<SuppliesListEnvelope>('/supplies', {
    page: params.page,
    per_page: params.per_page,
    equipment_uuid: params.equipment_uuid || undefined,
    start_date: params.start_date || undefined,
    end_date: params.end_date || undefined,
  });

  // Adaptação envelope ApiResponse::paginated → ResponsePagination (grid) —
  // mirror `listWarehouses`/`listStocks` (meta REAL, não fallback fake).
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

// ============================================
// DETALHE — GET /supplies/{uuid} (Tarefa 40 — reusado pela Edição na Tarefa 41)
// ============================================

async function getSupplyByUuid(uuid: string): Promise<Response<SupplyDetail>> {
  const { data } = await api.V2.get<Response<SupplyDetail>>(`/supplies/${uuid}`);
  return data;
}

// ============================================
// EXCLUSÃO — DELETE /supplies/{uuid} (Tarefa 40)
// ============================================

async function deleteSupply(uuid: string): Promise<void> {
  await api.V2.delete(`/supplies/${uuid}`);
}

// ============================================
// CRIAÇÃO/EDIÇÃO — POST/PUT /supplies (Tarefa 41)
// ============================================

async function createSupply(payload: SupplyPayload): Promise<Response<SupplyDetail>> {
  const { data } = await api.V2.post<Response<SupplyDetail>>('/supplies', payload);
  return data;
}

async function updateSupply(uuid: string, payload: SupplyPayload): Promise<Response<SupplyDetail>> {
  const { data } = await api.V2.put<Response<SupplyDetail>>(`/supplies/${uuid}`, payload);
  return data;
}

// ============================================
// CASCATA 1 — GET /supplies/last-reading/{equipmentUuid} (Tarefa 41, único
// service novo desta feature sem sibling de reuso direto — FID-G3F §8)
// ============================================

async function getSupplyLastReading(equipmentUuid: string): Promise<Response<SupplyLastReading>> {
  const { data } = await api.V2.get<Response<SupplyLastReading>>(
    `/supplies/last-reading/${equipmentUuid}`
  );
  return data;
}

export {
  createSupply,
  deleteSupply,
  getSupplyByUuid,
  getSupplyLastReading,
  listSupplies,
  updateSupply,
};
