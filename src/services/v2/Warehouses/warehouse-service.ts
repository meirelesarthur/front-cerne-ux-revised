// src/services/v2/Warehouses/warehouse-service.ts
// -----------------------------------------------------------------------------
// Warehouse Service — API v1 do backend Laravel GB.Cerne (Armazéns).
//
// Contrato (envelope ApiResponse): { success, message, data, errors, meta }.
//   GET    /warehouses            → data: WarehouseListItem[] + meta de paginação
//                                    Laravel (DINÂMICA: default 15, teto 100)
//   GET    /warehouses/{uuid}     → data: WarehouseDetail (alias estrutural de
//                                    WarehouseListItem — sem agregação extra)
//   POST   /warehouses            → payload WarehousePayload
//   PUT    /warehouses/{uuid}     → payload WarehousePayload (farm_id nunca
//                                    aceito — imutável, DEC-007 pt.5)
//   DELETE /warehouses/{uuid}     → hard delete; erro de negócio (message) se
//                                    referenciado (6 checagens de FK filha)
//
// `listWarehouses` ADAPTA o envelope paginado do backend ({ data: [], meta: {} })
// para o shape `ResponsePagination` ({ data: { items, pagination } }) que a
// infra de grid do projeto (useCustomGridQuery/TableProvider) consome — mesmo
// truque de `listCostCenters`/`listRoles` — nenhum hook global precisa mudar.
//
// per_page: enviado sempre (default 15, teto 100 — combinado com o default da
// grid em TASK-FE-018); meta.per_page/meta.total/meta.last_page lidos da
// resposta real, nunca assumidos como constante local fixa.
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { PaginationQueryParams } from '@/@types/pagination';
import type { Response, ResponsePagination } from '@/@types/response-api';
import type {
  WarehouseDetail,
  WarehouseListItem,
  WarehouseOption,
  WarehouseOptionsListEnvelope,
  WarehousePayload,
  WarehousesListEnvelope,
} from '@/@types/v2/Warehouses';

// Params aceitos pela listagem — paginação dinâmica + busca + filtros reais do
// backend (`type`/`is_active`), todos opt-in (WarehouseFilterData).
export interface ListWarehousesParams extends PaginationQueryParams {
  search?: string;
  type?: 'insumos' | 'producao' | 'formulacao';
  is_active?: 'true' | 'false';
}

async function listWarehouses(
  params: ListWarehousesParams
): Promise<ResponsePagination<WarehouseListItem[]>> {
  const { data } = await api.V2.get<WarehousesListEnvelope>('/warehouses', {
    page: params.page,
    per_page: params.per_page,
    search: params.search || undefined,
    type: params.type || undefined,
    is_active: params.is_active || undefined,
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

async function getWarehouse(warehouseUuid: string) {
  const { data } = await api.V2.get<Response<WarehouseDetail>>(`/warehouses/${warehouseUuid}`);
  return data;
}

async function createWarehouse(payload: WarehousePayload) {
  const { data } = await api.V2.post<Response<WarehouseDetail>>('/warehouses', payload);
  return data;
}

async function updateWarehouse(warehouseUuid: string, payload: WarehousePayload) {
  const { data } = await api.V2.put<Response<WarehouseDetail>>(
    `/warehouses/${warehouseUuid}`,
    payload
  );
  return data;
}

async function deleteWarehouse(warehouseUuid: string) {
  const { data } = await api.V2.delete(`/warehouses/${warehouseUuid}`);
  return data;
}

// -----------------------------------------------------------------------------
// GET /warehouses/options (TASK-BE-508, aditivo TASK-FE-504) — lookup ENXUTO
// para o Select `default_warehouse_uuid` do formulário de Produtos (Aba 2).
// SEM gate de `warehouses_view`. FLAT — a resposta NÃO é paginada
// (`ApiResponse::success`, `meta: null` sempre), então `pagination` abaixo é
// sempre "1 página só" derivada de `data.length` (mesmo adaptador de
// `listBankOptions`, que já lida com `meta` ausente via fallback). O
// `SelectAsyncPaginate` que consome este service DEVE receber `pageSize`
// maior que o volume real do catálogo (poucas dezenas por fazenda) para não
// disparar uma 2ª página fantasma (`hasMore` calculado por
// `items.length === pageSize`).
//
// `type` (TASK-FE-611/AP-08, extensão aditiva TASK-BE-1003/GAP-BE-610) —
// mesmos 3 slugs de `ListWarehousesParams.type` (CRUD completo) — filtra o
// lookup por Armazém de Insumos/Produção/Formulação; omitido = comportamento
// idêntico ao anterior (todos).
//
// `farm_uuid` (Trans. Fazendas, Tarefa 02, extensão ADITIVA) — quando
// informado, o backend (`WarehouseOptionsRequest`/`ListWarehouseOptionsAction`,
// lidos no código real de `GB.Cerne.Api`) valida que a fazenda pertence ao
// MESMO tenant do usuário autenticado e devolve os armazéns ATIVOS dessa
// fazenda em vez da fazenda corrente (`FarmContext`). Ausência preserva
// 100% o comportamento atual (regressão zero para `WarehouseTransfer`/
// demais consumidores existentes) — mesmo racional da extensão do backend.
// -----------------------------------------------------------------------------
export interface ListWarehouseOptionsParams extends PaginationQueryParams {
  search?: string;
  type?: 'insumos' | 'producao' | 'formulacao';
  farm_uuid?: string;
  /** PLANO-FIX AUDIT-FILTROS-RELATORIOS §2.6/§3 F-335 — opt-in (default OFF)
   *  que desliga o default `Inputs('I')` do repo, trazendo TODOS os tipos
   *  (fiel ao legado deste relatório). Sem o param, consumidores atuais
   *  (estoque/suprimento) continuam recebendo só Insumos. */
  all_types?: boolean;
  /** PLANO-FIX §2.6/§3 F-335 — opt-in (default OFF) que torna `is_active`
   *  condicional em vez de forçado `true`. Sem o param, comportamento atual
   *  inalterado. */
  include_inactive?: boolean;
}

async function listWarehouseOptions(
  params: ListWarehouseOptionsParams
): Promise<ResponsePagination<WarehouseOption[]>> {
  const { data } = await api.V2.get<WarehouseOptionsListEnvelope>('/warehouses/options', {
    search: params.search || undefined,
    type: params.type || undefined,
    farm_uuid: params.farm_uuid || undefined,
    all_types: params.all_types ?? undefined,
    include_inactive: params.include_inactive ?? undefined,
  });

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

export {
  createWarehouse,
  deleteWarehouse,
  getWarehouse,
  listWarehouseOptions,
  listWarehouses,
  updateWarehouse,
};
