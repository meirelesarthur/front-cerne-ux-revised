// src/services/v2/Diets/diet-service.ts
// -----------------------------------------------------------------------------
// Diet Service — API v1 do backend Laravel GB.Cerne (Dieta — Operacional/
// Pecuária, TASK-FE-DIET-01). Fachada CRUD completa + `diet-options` (lookup
// sem paginação, consumido pelo Select `diet_id` da Batida) sobre o Model
// `Diet`/`Ingredient` (`arquitetura-api-dieta.md` TASK-DIET-API-01). Mirror
// estrutural de `food-service.ts` (adaptador de envelope paginado →
// `ResponsePagination`).
//
// Contrato (envelope ApiResponse), confirmado por leitura direta do
// `DietController`/`DietRepository` (worktree `diet-api`):
//   GET    /diets                → data: DietListItem[], meta paginação REAL
//                                   (filtros search/objective/date, AD-08).
//                                   Paginação FIXA em 10 no servidor
//                                   (`->paginate(10)`, sem `per_page`
//                                   exposto) — `per_page` NUNCA enviado por
//                                   este service.
//   GET    /diets/{uuid}         → data: DietDetail (ingredients[] + saldo
//                                   de estoque por linha).
//   GET    /diets/diet-options   → data: Option[] pronto, SEM paginação.
//   POST   /diets                → payload DietPayload.
//   PUT    /diets/{uuid}         → payload DietPayload — a composição
//                                   inteira substitui a anterior (sem
//                                   reconciliação por identidade).
//   DELETE /diets/{uuid}         → soft delete (cascade ingredients).
//
// `X-Farm-Id` via interceptor genérico de `@/services/api.ts` — nunca setado
// manualmente aqui, nunca em querystring.
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { Option } from '@/@types/option';
import type { PaginationQueryParams } from '@/@types/pagination';
import type { Response, ResponsePagination } from '@/@types/response-api';
import type {
  DietDetail,
  DietFilterForm,
  DietListItem,
  DietObjective,
  DietOptionsEnvelope,
  DietPayload,
  DietsListEnvelope,
} from '@/@types/v2/Diets';

// Params aceitos pela listagem — paginação real (só `page`, servidor fixa
// `per_page=10`) + filtros confirmados em `DietFilterData.php` (AD-08).
export interface ListDietsParams extends Omit<PaginationQueryParams, 'per_page'> {
  search?: string;
  objective?: DietObjective;
  date?: string;
}

async function listDiets(params: ListDietsParams): Promise<ResponsePagination<DietListItem[]>> {
  const { data } = await api.V2.get<DietsListEnvelope>('/diets', {
    page: params.page,
    search: params.search || undefined,
    objective: params.objective || undefined,
    date: params.date || undefined,
  });

  // Adaptação envelope ApiResponse::paginated → ResponsePagination (grid) —
  // idêntico a `listFoods`/`listFoodBeats` (meta REAL, nunca fabricada).
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

// GET /diets/{uuid} — detalhe + composição + saldo de estoque por linha.
async function getDiet(dietUuid: string) {
  const { data } = await api.V2.get<Response<DietDetail>>(`/diets/${dietUuid}`);
  return data;
}

async function createDiet(payload: DietPayload) {
  const { data } = await api.V2.post<Response<DietDetail>>('/diets', payload);
  return data;
}

// PUT /diets/{uuid} — a composição inteira SUBSTITUI a anterior (sem
// reconciliação por identidade, confirmado por `IngredientData.php` não
// transportar `uuid`) — o chamador nunca deve assumir que um `PUT` parcial
// preserva ingredientes não enviados.
async function updateDiet(dietUuid: string, payload: DietPayload) {
  const { data } = await api.V2.put<Response<DietDetail>>(`/diets/${dietUuid}`, payload);
  return data;
}

// DELETE /diets/{uuid} — soft delete (cascade ingredients).
async function deleteDiet(dietUuid: string) {
  const { data } = await api.V2.delete(`/diets/${dietUuid}`);
  return data;
}

// GET /diets/diet-options — lookup SEM paginação/busca server-side
// (`GetDietOptionsAction.handle()`, confirmado por leitura direta: devolve a
// Collection COMPLETA de dietas da fazenda, sem filtro nem page). Consumido
// pelo Select `diet_id` da Batida (TASK-FE-DIET-06) e pelo filtro da
// listagem de Batida (TASK-FE-DIET-05).
async function listDietOptions(): Promise<Option<string>[]> {
  const { data } = await api.V2.get<DietOptionsEnvelope>('/diets/diet-options');
  return data.data;
}

// Adaptador para `SelectAsyncPaginate` (`service` espera `ResponsePagination`
// com busca/paginação) sobre um endpoint que não pagina nem busca no
// servidor — busca/pagina CLIENT-SIDE sobre o resultado real (SEM MOCK: os
// dados vêm sempre do endpoint real, só a fatia/filtro é local). Documentado
// como adaptação, não como Gap: o achado (endpoint sem `search`/`page`) já
// está registrado em GAP-DIET-FE-01/arquitetura-frontend-dieta.md.
async function listDietOptionsPaginated(
  params: PaginationQueryParams & { search?: string }
): Promise<ResponsePagination<Option<string>[]>> {
  const all = await listDietOptions();
  const search = params.search?.trim().toLowerCase();
  const filtered = search
    ? all.filter((option) => option.label.toLowerCase().includes(search))
    : all;

  const perPage = params.per_page || 10;
  const page = params.page || 1;
  const start = (page - 1) * perPage;
  const items = filtered.slice(start, start + perPage);

  return {
    success: true,
    data: {
      items,
      pagination: {
        total: filtered.length,
        count: items.length,
        per_page: perPage,
        current_page: page,
        total_pages: Math.max(1, Math.ceil(filtered.length / perPage)),
      },
    },
  };
}

export {
  createDiet,
  deleteDiet,
  getDiet,
  listDietOptions,
  listDietOptionsPaginated,
  listDiets,
  updateDiet,
};

export type { DietFilterForm };
