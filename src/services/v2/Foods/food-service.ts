// src/services/v2/Foods/food-service.ts
// -----------------------------------------------------------------------------
// Food Service — API v1 do backend Laravel GB.Cerne (Formulação — Fábrica/
// Ração, TASK-FOOD-FE-03). Fachada CRUD completa + `duplicate` + `report`
// (PDF síncrono) sobre o Model `Food` (Food-contrato.md §4, APROVADO 100%).
//
// Contrato (envelope ApiResponse): { success, message, data, errors, meta }.
//   GET    /foods                    → data: FoodListItem[], meta paginação REAL
//                                       (filtros product_uuid/is_enabled/type, §4)
//   GET    /foods/{uuid}             → data: FoodDetail (composição + saldo de
//                                       estoque das matérias-primas, §4.4)
//   POST   /foods                    → payload FoodPayload
//   PUT    /foods/{uuid}             → payload FoodPayload — sync da composição
//                                       (DA-FOOD-06, payload SEMPRE completo, não
//                                       parcial)
//   DELETE /foods/{uuid}             → soft delete
//   POST   /foods/{uuid}/duplicate   → clona Food + composição, code sequencial
//                                       novo (DA-FOOD-07)
//   GET    /foods/{uuid}/report      → PDF síncrono (DA-FOOD-08), responseType 'blob'
//
// ⚠️ ACHADO uuid-first NO PAYLOAD DE ESCRITA — RECONCILIADO ANTES DESTE
// SERVICE SER ESCRITO (não é decisão silenciosa deste Executor): a Leitura
// do dev de `TASK-FOOD-FE-01`/`TASK-FOOD-FE-03` registrava como "achado a
// CONFIRMAR com o Arquiteto de API" o fato de `Food-contrato.md §4.1`
// (versão original, ciclo 3) validar `product_id`/`measurement_id`/
// `feedstocks.*.product_id` contra `Rule::exists(tabela, 'id')` — coluna
// interna sequencial, que o front NUNCA tem (só `uuid`). Isso foi
// CONFIRMADO como bug real (não resíduo inofensivo) e CORRIGIDO no backend,
// na mesma janela de execução deste lote:
//   - `GAP-22` (`[AVALIADO]`, sem gate do dono — conformidade a invariante
//     já aprovada e em produção em `OpeningBalanceRequest`/
//     `RequestPurchaseRequest`);
//   - `TASK-FOOD-05` (`✅ [CONCLUÍDO]`, validado por
//     `gb-cerne-api-tester-v2`, 2026-08-11) — `FoodRequest`/`FoodData`/
//     `FoodFeedstockData`/4 Actions de escrita passaram a exigir
//     `product_uuid`/`measurement_uuid`/`feedstocks.*.product_uuid`/
//     `feedstocks.*.measurement_uuid`, nunca `*_id`;
//   - `Food-contrato.md §4.1` já está RECONCILIADO com este desenho (Ciclo 3.2).
// Este service usa `FoodPayload`/`FoodFeedstockPayload` de
// `@/@types/v2/Foods` — que JÁ foram escritos com os nomes de campo
// corrigidos (`product_uuid`/`measurement_uuid`, ver comentário equivalente
// naquele arquivo). NENHUM Gap novo é aberto por este Executor — o achado já
// estava resolvido e testado no backend antes deste arquivo ser escrito.
//
// `X-Farm-Id` via interceptor genérico de `@/services/api.ts` — nunca
// setado manualmente aqui, nunca em querystring (`?farm=`, comportamento
// legado corrigido por design — Decisão 3 do contrato, `## 9`).
//
// `listFoods` ADAPTA o envelope paginado do backend ({ data: [], meta: {} })
// para o shape `ResponsePagination` que a infra de grid do projeto
// (useCustomGridQuery/TableProvider) consome — mesmo adaptador de
// `listMovements`/`listOpeningBalances` (meta REAL, nunca fabricada).
//
// `getFoodReport` mirror `exportEquipments`/`exportOpeningBalances`
// (`api.V2.get<Blob>(..., { responseType: 'blob' })`).
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { PaginationQueryParams } from '@/@types/pagination';
import type { Response, ResponsePagination } from '@/@types/response-api';
import type {
  FoodDetail,
  FoodListItem,
  FoodPayload,
  FoodsListEnvelope,
  FoodType,
} from '@/@types/v2/Foods';

// Params aceitos pela listagem — paginação real + filtros confirmados em
// Food-contrato.md §4 (product_uuid, is_enabled, type).
export interface ListFoodsParams extends PaginationQueryParams {
  search?: string;
  product_uuid?: string;
  is_enabled?: '1' | '0';
  type?: FoodType;
}

async function listFoods(params: ListFoodsParams): Promise<ResponsePagination<FoodListItem[]>> {
  const { data } = await api.V2.get<FoodsListEnvelope>('/foods', {
    page: params.page,
    per_page: params.per_page,
    search: params.search || undefined,
    product_uuid: params.product_uuid || undefined,
    is_enabled: params.is_enabled ?? undefined,
    type: params.type || undefined,
  });

  // Adaptação envelope ApiResponse::paginated → ResponsePagination (grid) —
  // idêntico a `listMovements`/`listOpeningBalances` (meta REAL, nunca
  // fabricada).
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

// GET /foods/{uuid} — detalhe + composição + saldo (Food-contrato.md §4.4).
async function getFood(foodUuid: string) {
  const { data } = await api.V2.get<Response<FoodDetail>>(`/foods/${foodUuid}`);
  return data;
}

async function createFood(payload: FoodPayload) {
  const { data } = await api.V2.post<Response<FoodDetail>>('/foods', payload);
  return data;
}

// PUT /foods/{uuid} — sync da composição (DA-FOOD-06): o payload SEMPRE
// substitui a composição inteira; o chamador nunca deve assumir que um
// `PUT` parcial preserva itens de composição não enviados.
async function updateFood(foodUuid: string, payload: FoodPayload) {
  const { data } = await api.V2.put<Response<FoodDetail>>(`/foods/${foodUuid}`, payload);
  return data;
}

// DELETE /foods/{uuid} — soft delete.
async function deleteFood(foodUuid: string) {
  const { data } = await api.V2.delete(`/foods/${foodUuid}`);
  return data;
}

// POST /foods/{uuid}/duplicate — clona Food + composição, novo `code`
// sequencial (DA-FOOD-07). Sem payload próprio.
async function duplicateFood(foodUuid: string) {
  const { data } = await api.V2.post<Response<FoodDetail>>(`/foods/${foodUuid}/duplicate`);
  return data;
}

// GET /foods/{uuid}/report — PDF síncrono (DA-FOOD-08), mirror
// `exportEquipments`/`exportOpeningBalances` (`responseType: 'blob'`).
async function getFoodReport(foodUuid: string): Promise<Blob> {
  const { data } = await api.V2.get<Blob>(`/foods/${foodUuid}/report`, undefined, {
    responseType: 'blob',
  });
  return data;
}

export { createFood, deleteFood, duplicateFood, getFood, getFoodReport, listFoods, updateFood };
