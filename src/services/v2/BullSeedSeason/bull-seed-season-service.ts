// src/services/v2/BullSeedSeason/bull-seed-season-service.ts
// -----------------------------------------------------------------------------
// Bull Seed Season Service — API v1 do backend Laravel GB.Cerne
// (Touros/Sêmen/Embrião, Operacional / Reprodução, 97-Esteiras/005,
// Tarefa 24). Mirror estrutural de `breeding-season-service.ts` (mesmo
// adaptador do envelope paginado real `ApiResponse::paginated` →
// `ResponsePagination`, consumido pela grid via `useCustomGridQuery`).
//
// Contrato (envelope ApiResponse): { success, message, data, errors, meta }.
//   GET    /bull-seed-season         → data: BullSeedSeasonListItem[] + meta
//                                       paginação real (filtro opcional
//                                       `start_date`/`end_date`).
//   GET    /bull-seed-season/{uuid}  → data: BullSeedSeasonDetail (`animals`/
//                                       `products` só aqui, contrato §3).
//   DELETE /bull-seed-season/{uuid}  → hard delete; 422 possível
//                                       (`BusinessRuleException`, FK filha) —
//                                       exibir a mensagem do servidor tal
//                                       como vem.
//
// Tarefa 25 (formulário) acrescenta as funções de escrita
// (`createBullSeedSeason`/`updateBullSeedSeason`/`getBullSeedSeasonNextCode`)
// e os 6 lookups (`listAnimalOptions`/`listProductOptions`/
// `listWarehouseOptions`/`listBreedingSeasonOptions`/
// `listProductsByWarehouse`/`getProductDetail`), deferidos pela Tarefa 24
// (fundação) por não terem consumidor até aqui. Os 6 lookups são
// `Collection` PLANA no Repository (`api-contract-touros-semen-embriao.md
// §7/§8`) — resposta SEM paginação/`meta`, mirror exato
// `listBreedingSeasonUserOptions` (`breeding-season-service.ts`): `Select` +
// `useQuery`, NUNCA `SelectAsyncPaginate`.
//
//   GET  /bull-seed-season/next-code               → { code: string },
//                                                      só em criação.
//   GET  /bull-seed-season/breeding-season-options  → BreedingSeasonOption[]
//   GET  /bull-seed-season/animal-options           → AnimalOption[] — 1
//                                                      chamada compartilhada
//                                                      por todas as linhas
//                                                      do repetidor de
//                                                      animais.
//   GET  /bull-seed-season/warehouse-options        → WarehouseOption[] —
//                                                      compartilhado entre
//                                                      linhas de produto.
//   GET  /bull-seed-season/product-options          → ProductOption[] —
//                                                      catálogo geral, usado
//                                                      quando a linha NÃO
//                                                      tem armazém.
//   GET  /bull-seed-season/products-by-warehouse    → ProductOption[],
//                                                      filtrado por
//                                                      `warehouse_uuid`
//                                                      (query obrigatória) —
//                                                      usado quando a linha
//                                                      TEM armazém.
//   GET  /bull-seed-season/product-detail           → ProductDetail,
//                                                      filtrado por `uuid`
//                                                      (produto) — disparado
//                                                      ao SELECIONAR um
//                                                      produto, nunca pelo
//                                                      armazém.
//   POST /bull-seed-season                          → payload
//                                                      BullSeedSeasonUpsertPayload.
//   PUT  /bull-seed-season/{uuid}                    → idem, substituição
//                                                      COMPLETA de
//                                                      `animals[]`/
//                                                      `products[]`
//                                                      (`sync()` no
//                                                      servidor, mirror
//                                                      `CL-11`).
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { PaginationQueryParams } from '@/@types/pagination';
import type { Response, ResponsePagination } from '@/@types/response-api';
import type {
  AnimalOption,
  BreedingSeasonOption,
  BullSeedSeasonDetail,
  BullSeedSeasonFilterRequest,
  BullSeedSeasonListItem,
  BullSeedSeasonsListEnvelope,
  BullSeedSeasonUpsertPayload,
  ProductDetail,
  ProductOption,
  WarehouseOption,
} from '@/@types/v2/BullSeedSeason';

// Params aceitos pela listagem — paginação real + filtro opcional do backend
// (`BullSeedSeasonFilterData`): `start_date`/`end_date`.
export interface ListBullSeedSeasonsParams
  extends PaginationQueryParams, BullSeedSeasonFilterRequest {}

async function listBullSeedSeasons(
  params: ListBullSeedSeasonsParams
): Promise<ResponsePagination<BullSeedSeasonListItem[]>> {
  const { data } = await api.V2.get<BullSeedSeasonsListEnvelope>('/bull-seed-season', {
    page: params.page,
    per_page: params.per_page,
    start_date: params.start_date || undefined,
    end_date: params.end_date || undefined,
  });

  // Adaptação envelope ApiResponse::paginated → ResponsePagination (grid) —
  // mesmo adaptador de `listBreedingSeasons`/`listAbsences`.
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

async function getBullSeedSeason(uuid: string): Promise<Response<BullSeedSeasonDetail>> {
  const { data } = await api.V2.get<Response<BullSeedSeasonDetail>>(`/bull-seed-season/${uuid}`);
  return data;
}

async function deleteBullSeedSeason(uuid: string) {
  const { data } = await api.V2.delete(`/bull-seed-season/${uuid}`);
  return data;
}

// ---- Escrita (Tarefa 25) --------------------------------------------------

async function createBullSeedSeason(
  payload: BullSeedSeasonUpsertPayload
): Promise<Response<BullSeedSeasonDetail>> {
  const { data } = await api.V2.post<Response<BullSeedSeasonDetail>>('/bull-seed-season', payload);
  return data;
}

async function updateBullSeedSeason(
  uuid: string,
  payload: BullSeedSeasonUpsertPayload
): Promise<Response<BullSeedSeasonDetail>> {
  const { data } = await api.V2.put<Response<BullSeedSeasonDetail>>(
    `/bull-seed-season/${uuid}`,
    payload
  );
  return data;
}

// `GET /bull-seed-season/next-code` — sugestão de código, só chamada em modo
// CRIAÇÃO, gate `bull-seed-season_create`. Resposta simples `{ code: string
// }`, sem Resource dedicado (contrato de API §8, mirror
// `getBreedingSeasonNextCode`).
async function getBullSeedSeasonNextCode(): Promise<Response<{ code: string }>> {
  const { data } = await api.V2.get<Response<{ code: string }>>('/bull-seed-season/next-code');
  return data;
}

// ---- 6 lookups (Tarefa 25) — TODOS `Collection` plana, SEM paginação/
// `meta` (armadilha 1 do contrato de tela). `Select` + `useQuery`, NUNCA
// `SelectAsyncPaginate`. Mirror `listBreedingSeasonUserOptions` — desempacota
// `data.data` direto, `[]` de fallback (SEM MOCK, nunca fabricado). --------

async function listBreedingSeasonOptions(): Promise<BreedingSeasonOption[]> {
  const { data } = await api.V2.get<Response<BreedingSeasonOption[]>>(
    '/bull-seed-season/breeding-season-options'
  );
  return data.data ?? [];
}

// 1 única chamada compartilhada por todas as linhas do repetidor de animais
// (contrato de tela §5.2) — cache do TanStack reaproveitado pela mesma
// queryKey, nunca 1 request por linha.
async function listAnimalOptions(): Promise<AnimalOption[]> {
  const { data } = await api.V2.get<Response<AnimalOption[]>>('/bull-seed-season/animal-options');
  return data.data ?? [];
}

// Compartilhado entre todas as linhas do repetidor de produtos.
async function listWarehouseOptions(): Promise<WarehouseOption[]> {
  const { data } = await api.V2.get<Response<WarehouseOption[]>>(
    '/bull-seed-season/warehouse-options'
  );
  return data.data ?? [];
}

// Catálogo geral — usado quando a linha de produto NÃO tem armazém
// selecionado (armadilha 3 do contrato de tela).
async function listProductOptions(): Promise<ProductOption[]> {
  const { data } = await api.V2.get<Response<ProductOption[]>>('/bull-seed-season/product-options');
  return data.data ?? [];
}

// Filtrado por estoque no armazém — usado quando a linha TEM armazém
// selecionado. `warehouse_uuid` obrigatório na querystring (armadilha 4 —
// a queryKey do consumidor deve incluir este uuid, nunca compartilhar cache
// entre armazéns diferentes).
async function listProductsByWarehouse(warehouseUuid: string): Promise<ProductOption[]> {
  const { data } = await api.V2.get<Response<ProductOption[]>>(
    '/bull-seed-season/products-by-warehouse',
    { warehouse_uuid: warehouseUuid }
  );
  return data.data ?? [];
}

// Disparado ao SELECIONAR um produto (qualquer uma das 2 fontes acima) —
// resolve UM/Estoque para exibição read-only na linha (armadilha 6, nunca
// disparado pelo armazém). `stocks[]` é a lista por armazém — o consumidor
// resolve a quantidade da linha por match de `warehouse.uuid` (ou soma, sem
// armazém selecionado).
async function getProductDetail(productUuid: string): Promise<ProductDetail | null> {
  const { data } = await api.V2.get<Response<ProductDetail>>('/bull-seed-season/product-detail', {
    uuid: productUuid,
  });
  return data.data ?? null;
}

export {
  createBullSeedSeason,
  deleteBullSeedSeason,
  getBullSeedSeason,
  getBullSeedSeasonNextCode,
  getProductDetail,
  listAnimalOptions,
  listBreedingSeasonOptions,
  listBullSeedSeasons,
  listProductOptions,
  listProductsByWarehouse,
  listWarehouseOptions,
  updateBullSeedSeason,
};
