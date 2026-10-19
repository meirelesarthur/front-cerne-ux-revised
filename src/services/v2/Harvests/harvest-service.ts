// src/services/v2/Harvests/harvest-service.ts
// -----------------------------------------------------------------------------
// Harvest Service — API v1 do backend Laravel GB.Cerne (Safras).
//
// Contrato (envelope ApiResponse): { success, message, data, errors, meta }.
//   GET    /harvests                     → data: Harvest[] + meta de paginação REAL (per_page honrado, default 15)
//   GET    /harvests/{uuid}               → data: Harvest (mesmo shape do index)
//   POST   /harvests                     → payload HarvestPayload
//   PUT    /harvests/{uuid}               → payload HarvestPayload
//   DELETE /harvests/{uuid}               → 204; erro de negócio (message) se referenciada (FK residual)
//   GET    /harvests/active               → data: Harvest[] sem paginação (is_enabled=true COM semana)
//   GET    /harvests/{uuid}/weeks/current  → data: WeekVintage (404 é resultado ESPERADO, não erro genérico)
//
// `listHarvests` ADAPTA o envelope paginado do backend ({ data: [], meta: {} })
// para o shape `ResponsePagination` ({ data: { items, pagination } }) que a
// infra de grid do projeto (useCustomGridQuery/TableProvider) consome — mesmo
// truque de `listCostCenters`, mas SEM a ressalva de "backend ignora
// per_page": aqui o backend honra de verdade (HarvestFilterData::$per_page,
// HarvestRepository::listWithFilters → paginate($filters->per_page)).
//
// `periods` nunca é montado/enviado por este service (fora do escopo v1 —
// HarvestRequest aceita `periods[]` como `sometimes`, mas não há endpoint
// `/periods` no `routes/api.php` para popular um seletor no front; omitir a
// chave é válido e o backend não sincroniza períodos quando ela está ausente).
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { PaginationQueryParams } from '@/@types/pagination';
import type { Response, ResponsePagination } from '@/@types/response-api';
import type {
  Harvest,
  HarvestPayload,
  HarvestsListEnvelope,
  WeekVintage,
} from '@/@types/v2/Harvests';

// Params aceitos pela listagem — paginação real + busca + status.
export interface ListHarvestsParams extends PaginationQueryParams {
  search?: string;
  is_enabled?: 'true' | 'false';
}

async function listHarvests(params: ListHarvestsParams): Promise<ResponsePagination<Harvest[]>> {
  const { data } = await api.V2.get<HarvestsListEnvelope>('/harvests', {
    page: params.page,
    per_page: params.per_page,
    search: params.search || undefined,
    is_enabled: params.is_enabled || undefined,
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

async function getHarvest(harvestUuid: string) {
  const { data } = await api.V2.get<Response<Harvest>>(`/harvests/${harvestUuid}`);
  return data;
}

async function createHarvest(payload: HarvestPayload) {
  const { data } = await api.V2.post<Response<Harvest>>('/harvests', payload);
  return data;
}

async function updateHarvest(harvestUuid: string, payload: HarvestPayload) {
  const { data } = await api.V2.put<Response<Harvest>>(`/harvests/${harvestUuid}`, payload);
  return data;
}

async function deleteHarvest(harvestUuid: string) {
  const { data } = await api.V2.delete(`/harvests/${harvestUuid}`);
  return data;
}

// Sem paginação — todas as safras habilitadas COM semana, pensado para
// popular selects em outros módulos (não consumido pelas telas desta feature).
async function listActiveHarvests() {
  const { data } = await api.V2.get<Response<Harvest[]>>('/harvests/active');
  return data;
}

// 404 (ResourceNotFoundException) é resultado ESPERADO e válido quando
// nenhuma semana cobre a data informada — o chamador (TASK-FE-010) trata
// esse caso como estado de UI, não como erro genérico.
async function getHarvestCurrentWeek(harvestUuid: string, date: string) {
  const { data } = await api.V2.get<Response<WeekVintage>>(
    `/harvests/${harvestUuid}/weeks/current`,
    { date }
  );
  return data;
}

// ============================================
// ADITIVO — TASK-RP-FE-07 (Solicitação de Compras, 97-Esteiras/022)
// ============================================
// `listHarvestOptions` — consumida pelo Select "Safra" do formulário de
// Solicitação de Compras (`TASK-RP-FE-09`, ainda não construído). O
// task-packet da Tarefa autorizava explicitamente: "se `listActiveHarvests`
// já cobrir o caso de uso sem paginação real ser necessária, reaproveitar em
// vez de criar nova função; decisão do Executor, documentada".
//
// DECISÃO DO EXECUTOR: reaproveitar `listHarvests` (não `listActiveHarvests`)
// — confirmado em `api_root` (`routes/api.php`) que NÃO existe
// `/harvests/options` (só `harvests/active`, sem paginação/busca, e
// `harvests/{uuid}/weeks/current` como rotas extras do `apiResource`).
// `listActiveHarvests` não serve ao contrato de `service` que
// `SelectAsyncPaginate` espera (sem `search`/paginação real). `listHarvests`
// SIM serve: `HarvestFilterData` (lido em `api_root`) já aceita `search`
// (ILIKE em `description`) + `per_page` real — mesmo shape de
// `listCostCenterOptions`/`listProductOptions`, só que sobre o endpoint de
// listagem padrão (`/harvests`), não um `/options` dedicado (que não existe
// nem está previsto). Sem `deleteHarvest`/filtros de negócio adicionais —
// alias fino, único propósito é nomear a função como a Tarefa espera.
async function listHarvestOptions(
  params: ListHarvestsParams
): Promise<ResponsePagination<Harvest[]>> {
  return listHarvests(params);
}

export {
  createHarvest,
  deleteHarvest,
  getHarvest,
  getHarvestCurrentWeek,
  listActiveHarvests,
  listHarvestOptions,
  listHarvests,
  updateHarvest,
};
