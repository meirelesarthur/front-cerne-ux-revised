// src/services/v2/AdvancedReproductive/advanced-reproductive-service.ts
// -----------------------------------------------------------------------------
// Advanced Reproductive Service — API v1 do backend Laravel GB.Cerne
// (Gerenciamento Avançado, Operacional / Reprodução, F-011, 97-Esteiras/056,
// TASK-AR-FE-01). Mirror estrutural de `breeding-season-service.ts`/
// `bull-seed-season-service.ts` (mesmo adaptador do envelope real
// `ApiResponse::paginated` → `ResponsePagination`, consumido pela grid via
// `useCustomGridQuery`), ESTENDIDO com `indicators` no mesmo payload da
// listagem (extensão documentada, roteiro-cirurgico-frontend-advanced-
// reproductive.md §6.1 — NUNCA uma segunda chamada de rede).
//
// Contrato (envelope ApiResponse): { success, message, data, errors, meta }.
//   GET /advanced-reproductive                          → data:
//     AdvancedReproductiveListItem[] + meta paginação real ESTENDIDO com
//     `meta.indicators` (animals_count/pregnancy_rate/birth_animals_count).
//     Filtros opcionais (ordem exata do contrato): search, reproductive_status,
//     breeding_batch_id, breeding_season_id, protocol_id, bull_seed_season_id.
//   GET /advanced-reproductive/protocol-season-options  → data:
//     ProtocolSeasonOption[] — resposta PLANA (sem paginação/`meta`), gate
//     `advanced-reproductive_view` (FUP-AR-04). Mirror `Select` + `useQuery`
//     direto (`listBreedingSeasonUserOptions`), NUNCA `SelectAsyncPaginate`
//     (armadilha documentada — endpoint plano quebra com paginação
//     assíncrona, §6.4 do roteiro).
//
// `breeding_batch_id`/`breeding_season_id`/`bull_seed_season_id` NÃO têm
// endpoint `-options` dedicado nesta feature — os 3 selects de filtro
// (TASK-AR-FE-02) reusam os services de listagem paginada JÁ existentes
// (`listBreedingBatches`/`listBreedingSeasons`/`listBullSeedSeasons`, cada um
// no seu próprio módulo) via `SelectAsyncPaginate` (achado do Arquiteto,
// roteiro §6.3) — não pertencem a este service.
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { PaginationQueryParams } from '@/@types/pagination';
import type { Response, ResponsePagination } from '@/@types/response-api';
import type {
  AdvancedReproductiveFilterForm,
  AdvancedReproductiveIndicators,
  AdvancedReproductiveListEnvelope,
  AdvancedReproductiveListItem,
  ProtocolSeasonOption,
} from '@/@types/v2/AdvancedReproductive';

// `ResponsePagination<T>` estendido com `indicators` DENTRO de `data` — o
// MESMO payload da listagem (mirror `meta.indicators` do backend). Tipado
// como OBRIGATÓRIO (não opcional): o contrato de API garante a presença,
// smoke do Tester valida em runtime (roteiro §6.1).
export interface ResponsePaginationWithIndicators extends ResponsePagination<
  AdvancedReproductiveListItem[]
> {
  data: ResponsePagination<AdvancedReproductiveListItem[]>['data'] & {
    indicators: AdvancedReproductiveIndicators;
  };
}

// Params aceitos pela listagem — paginação real + os 6 filtros opcionais do
// backend (`AdvancedReproductiveFilterData`), ordem exata do contrato.
export interface ListAdvancedReproductiveParams
  extends PaginationQueryParams, AdvancedReproductiveFilterForm {}

async function listAdvancedReproductive(
  params: ListAdvancedReproductiveParams
): Promise<ResponsePaginationWithIndicators> {
  const { data } = await api.V2.get<AdvancedReproductiveListEnvelope>('/advanced-reproductive', {
    page: params.page,
    per_page: params.per_page,
    search: params.search || undefined,
    reproductive_status: params.reproductive_status ?? undefined,
    breeding_batch_id: params.breeding_batch_id || undefined,
    breeding_season_id: params.breeding_season_id || undefined,
    protocol_id: params.protocol_id || undefined,
    bull_seed_season_id: params.bull_seed_season_id || undefined,
  });

  // Adaptação envelope ApiResponse::paginated → ResponsePagination (grid),
  // ESTENDIDA com `indicators` — mesmo adaptador de `listBreedingBatches`/
  // `listBullSeedSeasons`, acrescido do bloco de indicadores (§6.1).
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
      // `indicators` sempre presente no runtime real (contrato de API
      // fechado, TASK-AR-02) — nunca fabricado/mockado aqui; se o backend
      // omitir o bloco, o smoke do Tester deve flagrar a divergência.
      indicators: data.meta?.indicators as AdvancedReproductiveIndicators,
    },
  };
}

// `GET /advanced-reproductive/protocol-season-options` — resposta PLANA
// (sem paginação/`meta`), gate `advanced-reproductive_view` (empréstimo de
// permissão até `protocols-season` migrar como feature própria, FUP-AR-04).
// Mirror `listBreedingSeasonUserOptions`/`listBreedingSeasonOptions` —
// desempacota `data.data` direto, `[]` de fallback (SEM MOCK, nunca
// fabricado). Consumido por `Select` + `useQuery` direto (§6.4), NUNCA
// `SelectAsyncPaginate`.
async function listProtocolSeasonOptions(): Promise<ProtocolSeasonOption[]> {
  const { data } = await api.V2.get<Response<ProtocolSeasonOption[]>>(
    '/advanced-reproductive/protocol-season-options'
  );
  return data.data ?? [];
}

export { listAdvancedReproductive, listProtocolSeasonOptions };
