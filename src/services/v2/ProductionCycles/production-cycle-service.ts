// src/services/v2/ProductionCycles/production-cycle-service.ts
// -----------------------------------------------------------------------------
// Production Cycle Service — API v1 do backend Laravel GB.Cerne (Ciclo de
// Produção). TASK-FE-01 (97-Esteiras/033) — fundação de dados (LEITURA).
//
// Contrato (envelope ApiResponse): { success, message, data, errors, meta }.
//   GET    /production-cycles              → data: ProductionCycle[] + meta de paginação REAL
//                                             (with([harvest,user,employee,culture,center]) — SEM areas)
//   GET    /production-cycles/{uuid}        → data: ProductionCycle (with([...,areas]))
//   POST   /production-cycles              → payload ProductionCyclePayload (FE-02)
//   PUT    /production-cycles/{uuid}        → payload ProductionCyclePayload (FE-02)
//   DELETE /production-cycles/{uuid}        → 204 soft delete
//
// `listProductionCycles` ADAPTA o envelope paginado do backend ({ data: [],
// meta: {} }) para o shape `ResponsePagination` ({ data: { items, pagination } })
// que a infra de grid do projeto (useCustomGridQuery/TableProvider) consome —
// mesmo truque de `listHarvests`/`listCostCenters`.
//
// `check-period` (TASK-API-02) NÃO existe em `routes/api.php` (confirmado no
// FID-G3F §2.2/§3.4, D-FE-1) — R6 (conflito de período+área) é garantido
// server-side via 422 no submit (FE-02), nunca uma pré-checagem daqui.
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { PaginationQueryParams } from '@/@types/pagination';
import type { Response, ResponsePagination } from '@/@types/response-api';
import type {
  ProductionCycle,
  ProductionCyclePayload,
  ProductionCyclesListEnvelope,
} from '@/@types/v2/ProductionCycles';

// Params aceitos pela listagem — paginação real + filtros de FID-G3F §3.2
// (nomes `_uuid`, adaptados do C26 legado: `harvest_id`/`user_id`/date range).
export interface ListProductionCyclesParams extends PaginationQueryParams {
  harvest_uuid?: string;
  user_uuid?: string;
  start_date?: string;
  end_date?: string;
}

async function listProductionCycles(
  params: ListProductionCyclesParams
): Promise<ResponsePagination<ProductionCycle[]>> {
  const { data } = await api.V2.get<ProductionCyclesListEnvelope>('/production-cycles', {
    page: params.page,
    per_page: params.per_page,
    harvest_uuid: params.harvest_uuid || undefined,
    user_uuid: params.user_uuid || undefined,
    start_date: params.start_date || undefined,
    end_date: params.end_date || undefined,
  });

  // Adaptação envelope ApiResponse::paginated → ResponsePagination (grid).
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

async function getProductionCycleByUuid(productionCycleUuid: string) {
  const { data } = await api.V2.get<Response<ProductionCycle>>(
    `/production-cycles/${productionCycleUuid}`
  );
  return data;
}

// FE-02 (formulário create/edit) — assinaturas expostas aqui (fundação de
// dados desta Tarefa) para o service ficar completo; NÃO consumidas por
// nenhuma tela de TASK-FE-01 (só leitura).
async function createProductionCycle(payload: ProductionCyclePayload) {
  const { data } = await api.V2.post<Response<ProductionCycle>>('/production-cycles', payload);
  return data;
}

async function updateProductionCycle(productionCycleUuid: string, payload: ProductionCyclePayload) {
  const { data } = await api.V2.put<Response<ProductionCycle>>(
    `/production-cycles/${productionCycleUuid}`,
    payload
  );
  return data;
}

async function deleteProductionCycle(productionCycleUuid: string) {
  const { data } = await api.V2.delete(`/production-cycles/${productionCycleUuid}`);
  return data;
}

export {
  createProductionCycle,
  deleteProductionCycle,
  getProductionCycleByUuid,
  listProductionCycles,
  updateProductionCycle,
};
