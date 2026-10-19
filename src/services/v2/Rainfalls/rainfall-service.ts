// src/services/v2/Rainfalls/rainfall-service.ts
// -----------------------------------------------------------------------------
// Rainfall Service — API v1 do backend Laravel GB.Cerne (`/rainfalls*`,
// execução 041, TASK-FE-041-PLV-01/02/05). Casa própria (entity-flat, mirror
// `FeedlotYards`/`DeathAnimals`).
//
//   GET    /rainfalls            → paginado (ApiResponse::paginated, meta REAL), rainfall_view
//   GET    /rainfalls/{uuid}     → detalhe completo, rainfall_view
//   POST   /rainfalls            → 201, rainfall_create
//   PUT    /rainfalls/{uuid}     → 200, rainfall_edit (payload COMPLETO — backend
//                                  full-replace, `RainfallRequest` exige
//                                  date/amount/areas sempre;
//                                  `UpdateRainfallAction::syncAreas()` não suporta parcial)
//   DELETE /rainfalls/{uuid}     → 204 (hard delete transacional), rainfall_delete
//   GET    /rainfalls/download   → blob (modelo .xlsx, 2 abas), rainfall_create
//   POST   /rainfalls/import     → multipart (ABORT-ALL), rainfall_create
//
// Rota dentro de `farm.context` — X-Farm-Id anexado automaticamente pelo
// interceptor genérico de `@/services/api.ts`. Sem axios cru, sem fetch em
// componente (Lei 3/7).
//
// `getAreasOptions` — mirror EXATO de `getAreasOptions()` em
// `harvestProduct-service.ts:151-154` (D2 do plano de API, reusa o endpoint
// genérico já existente `GET /areas/options`, `is_enabled=true`) — NÃO
// reimplementado, mesma assinatura/shape.
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { PaginationQueryParams } from '@/@types/pagination';
import type { Response, ResponsePagination } from '@/@types/response-api';
import type {
  AreaOptionItem,
  CreateRainfallRequest,
  FlatOptionsEnvelope,
  RainfallDetail,
  RainfallFilterRequest,
  RainfallImportResult,
  RainfallListItem,
  RainfallsListEnvelope,
  UpdateRainfallRequest,
} from '@/@types/v2/Rainfalls';

export interface ListRainfallsParams extends PaginationQueryParams, RainfallFilterRequest {}

async function getAllRainfalls(
  params: ListRainfallsParams
): Promise<ResponsePagination<RainfallListItem[]>> {
  const { data } = await api.V2.get<RainfallsListEnvelope>('/rainfalls', {
    page: params.page,
    per_page: params.per_page,
    start_date: params.start_date || undefined,
    end_date: params.end_date || undefined,
  });

  // Adaptação envelope ApiResponse::paginated → ResponsePagination (grid) —
  // mesmo adaptador de `listFeedlotYards`/`listDeathAnimals`. Ordenação
  // `date desc` é FIXA server-side (`RainfallRepository::listWithFilters()`)
  // — este service nunca envia `orderBy`.
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

async function getRainfall(uuid: string): Promise<Response<RainfallDetail>> {
  const { data } = await api.V2.get<Response<RainfallDetail>>(`/rainfalls/${uuid}`);
  return data;
}

async function createRainfall(payload: CreateRainfallRequest): Promise<Response<RainfallDetail>> {
  const { data } = await api.V2.post<Response<RainfallDetail>>('/rainfalls', payload);
  return data;
}

// PUT (não PATCH): payload SEMPRE COMPLETO — backend full-replace
// (`RainfallRequest`/`UpdateRainfallAction`, sem `sometimes`/atualização
// parcial). Correção UT-000317/F-058: PATCH parcial fazia `areas` sumir do
// payload quando só `date`/`amount` eram alterados.
async function updateRainfall(
  uuid: string,
  payload: UpdateRainfallRequest
): Promise<Response<RainfallDetail>> {
  const { data } = await api.V2.put<Response<RainfallDetail>>(`/rainfalls/${uuid}`, payload);
  return data;
}

async function deleteRainfall(uuid: string) {
  const { data } = await api.V2.delete(`/rainfalls/${uuid}`);
  return data;
}

// `GET /rainfalls/download` — blob (modelo .xlsx, 2 abas: cabecalho/pluvAreas)
// — mirror `downloadPlanAccountImportTemplate`.
async function downloadRainfallTemplate(): Promise<Blob> {
  const { data } = await api.V2.get<Blob>('/rainfalls/download', undefined, {
    responseType: 'blob',
  });
  return data;
}

// `POST /rainfalls/import` — multipart, campo `file` — ABORT-ALL: 422 com
// `errors.rows[]` se qualquer linha/área for inválida, nada tocado. Mirror
// `importPlanAccounts`.
async function importRainfalls(file: File): Promise<Response<RainfallImportResult>> {
  const fd = new FormData();
  fd.append('file', file);
  const { data } = await api.V2.post<Response<RainfallImportResult>>('/rainfalls/import', fd);
  return data;
}

// `GET /areas/options` — mirror EXATO `getAreasOptions()` de
// `harvestProduct-service.ts:151-154` (D2 do plano de API — reusa o endpoint
// genérico já existente, `is_enabled=true`, SEM cascata/dependência de outro
// campo — `areas[]` é lista estática por fazenda).
async function getAreasOptions(): Promise<AreaOptionItem[]> {
  const { data } = await api.V2.get<FlatOptionsEnvelope<AreaOptionItem>>('/areas/options');
  return data.data;
}

export {
  createRainfall,
  deleteRainfall,
  downloadRainfallTemplate,
  getAllRainfalls,
  getAreasOptions,
  getRainfall,
  importRainfalls,
  updateRainfall,
};
