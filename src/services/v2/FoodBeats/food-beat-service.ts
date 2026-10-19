// src/services/v2/FoodBeats/food-beat-service.ts
// -----------------------------------------------------------------------------
// FoodBeat Service — API v1 do backend Laravel GB.Cerne (Batida — Fábrica,
// TASK-FB-FE-03). Fachada CRUD completa + 2 relatórios PDF (item e agregado)
// sobre o Model `FoodBeat`/`FoodBeatItem` (FoodBeat-contrato.md §4, APROVADO
// 100%, Ciclo 4). Mirror exato de `food-service.ts` (Food) e
// `stock-service.ts` (adaptador de envelope paginado → `ResponsePagination`).
//
// Contrato (envelope ApiResponse): { success, message, data, errors, meta }.
//   GET    /food-beats                  → data: FoodBeatListItem[], meta
//                                          paginação REAL (filtros
//                                          product_uuid/user_uuid/start_date/
//                                          end_date, §4)
//   GET    /food-beats/{uuid}           → data: FoodBeatDetail (COM items[])
//   POST   /food-beats                  → payload CreateFoodBeatPayload
//                                          (branch F/E server-side, `DA-FB-04`)
//   PUT    /food-beats/{uuid}           → payload UpdateFoodBeatPayload —
//                                          SOMENTE `date` (Decisão 1, `## 9`)
//   DELETE /food-beats/{uuid}           → soft delete + recálculo assíncrono
//   GET    /food-beats/{uuid}/report    → PDF de 1 registro (síncrono, blob)
//   GET    /food-beats/report           → PDF agregado por período+food_uuid
//                                          (síncrono, blob)
//
// ⚠️ `updateFoodBeat` aceita SOMENTE `UpdateFoodBeatPayload` (`{date}`,
// `TASK-FB-FE-01`) — assinatura estreita de propósito (Decisão 1, `## 9` do
// contrato). Se algum dia a assinatura for chamada com um objeto maior, o
// TypeScript já bloqueia em tempo de compilação.
//
// **Nenhum service novo de apoio criado** (achado confirmado por leitura
// direta do front, `TASK-FB-FE-03`) — os lookups dos itens já são cobertos
// por serviços existentes, reusados aqui só na documentação, NÃO
// reimportados por este arquivo (o consumo real acontece nas telas de
// `TASK-FB-FE-04/05/06`):
//   - `listWarehouses` (`@/services/v2/Warehouses/warehouse-service`) —
//     Select "Armazém Destino"/linhas do ramo Estoque.
//   - `listStocks` (`@/services/v2/Stocks/stock-service`, filtros
//     `product_uuid`+`warehouse_uuid`) — Select "Matéria Prima"/estoque de
//     origem em AMBOS os ramos.
//   - `getFood` (`@/services/v2/Foods/food-service`) — composição
//     (`feedstocks[]`) da Ração selecionada no ramo Formulação.
//   - `listProductOptions` (`@/services/v2/Products/product-service`,
//     params `food_eligibility`) — Select "Produto" do ramo Estoque.
//     **Gap declarado, não silenciado:** `FoodBeat-contrato.md` não
//     especifica um parâmetro equivalente ao `food_eligibility` de `Food`
//     para restringir por categoria elegível (`DA-FB-06`, categorias
//     `[36,53,44,56]`/`config('food_beat.eligible_product_category_ids')`).
//     A Tarefa de formulário (`TASK-FB-FE-06`) decide, no seu momento, se
//     consome `listProductOptions` sem esse filtro ou se reporta Gap para o
//     backend expor um parâmetro dedicado — não é decisão desta Tarefa.
//   - `getProduct`/`listUsers` — resolver `has_lot` do produto selecionado
//     (Estoque) e o filtro `user_uuid` da listagem (`TASK-FB-FE-05`).
//
// `getFoodBeatAggregatedReport` é criado aqui (mecânico, o endpoint existe
// no contrato) mas nenhuma tela consome ainda — não há Tarefa de UI para o
// relatório agregado nesta esteira. Não é decisão desta Tarefa decidir
// se/quando essa tela entra — só não deixar o service pela metade por causa
// disso.
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { PaginationQueryParams } from '@/@types/pagination';
import type { Response, ResponsePagination } from '@/@types/response-api';
import type {
  CreateFoodBeatPayload,
  FoodBeatDetail,
  FoodBeatListItem,
  FoodBeatsListEnvelope,
  UpdateFoodBeatPayload,
} from '@/@types/v2/FoodBeats';

// Params aceitos pela listagem — paginação real + filtros confirmados em
// FoodBeat-contrato.md §4 (product_uuid, user_uuid, start_date, end_date).
export interface ListFoodBeatsParams extends PaginationQueryParams {
  product_uuid?: string;
  user_uuid?: string;
  start_date?: string;
  end_date?: string;
}

async function listFoodBeats(
  params: ListFoodBeatsParams
): Promise<ResponsePagination<FoodBeatListItem[]>> {
  const { data } = await api.V2.get<FoodBeatsListEnvelope>('/food-beats', {
    page: params.page,
    per_page: params.per_page,
    product_uuid: params.product_uuid || undefined,
    user_uuid: params.user_uuid || undefined,
    start_date: params.start_date || undefined,
    end_date: params.end_date || undefined,
  });

  // Adaptação envelope ApiResponse::paginated → ResponsePagination (grid) —
  // idêntico a `listFoods`/`listStocks`/`listWarehouses` (meta REAL, nunca
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

// GET /food-beats/{uuid} — detalhe + items[] (FoodBeat-contrato.md §4.4).
async function getFoodBeat(foodBeatUuid: string) {
  const { data } = await api.V2.get<Response<FoodBeatDetail>>(`/food-beats/${foodBeatUuid}`);
  return data;
}

async function createFoodBeat(payload: CreateFoodBeatPayload) {
  const { data } = await api.V2.post<Response<FoodBeatDetail>>('/food-beats', payload);
  return data;
}

// PUT /food-beats/{uuid} — ⚠️ Assinatura estreita de propósito —
// `UpdateFoodBeatPayload` = `{date}` SOMENTE (Decisão 1, `## 9` do contrato).
// Ver `TASK-FB-FE-01`.
async function updateFoodBeat(foodBeatUuid: string, payload: UpdateFoodBeatPayload) {
  const { data } = await api.V2.put<Response<FoodBeatDetail>>(
    `/food-beats/${foodBeatUuid}`,
    payload
  );
  return data;
}

// DELETE /food-beats/{uuid} — soft delete + recálculo assíncrono (`DA-FB-11`).
async function deleteFoodBeat(foodBeatUuid: string) {
  const { data } = await api.V2.delete(`/food-beats/${foodBeatUuid}`);
  return data;
}

// GET /food-beats/{uuid}/report — PDF de 1 registro (síncrono), mirror
// `getFoodReport`/`exportEquipments` (`responseType: 'blob'`).
async function getFoodBeatItemReport(foodBeatUuid: string): Promise<Blob> {
  const { data } = await api.V2.get<Blob>(`/food-beats/${foodBeatUuid}/report`, undefined, {
    responseType: 'blob',
  });
  return data;
}

// GET /food-beats/report — PDF agregado por período+food_uuid (síncrono).
// Sem tela consumidora nesta esteira (ver cabeçalho do arquivo) — função
// pronta para quando a Tarefa de UI do relatório agregado for planejada.
export interface GetFoodBeatAggregatedReportParams {
  start_date: string;
  end_date: string;
  food_uuid?: string;
}

async function getFoodBeatAggregatedReport(
  params: GetFoodBeatAggregatedReportParams
): Promise<Blob> {
  const { data } = await api.V2.get<Blob>(
    '/food-beats/report',
    { ...params },
    {
      responseType: 'blob',
    }
  );
  return data;
}

export {
  createFoodBeat,
  deleteFoodBeat,
  getFoodBeat,
  getFoodBeatAggregatedReport,
  getFoodBeatItemReport,
  listFoodBeats,
  updateFoodBeat,
};
