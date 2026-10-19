// src/services/v2/Marcacao/marking-service.ts
// -----------------------------------------------------------------------------
// Marking Service — API v1 do backend Laravel GB.Cerne (`/markings*`,
// TASK-MC-FE-02). Fonte: leitura DIRETA de
// `app/Http/Controllers/Api/V1/{MarkingController,MarkingForecastController,
// MarkingDoneController}.php` + `app/Http/Requests/Api/V1/*.php` (fork
// `GB.Cerne.Api`, TASK-MC-01/02/03 já materializadas nesta sessão).
//
// Envelope paginado (`ApiResponse::paginated`) — mesma adaptação de
// `listWeanings`/`listBirthAnimals`: a API devolve `{ data: [array plano],
// meta: { current_page, last_page, per_page, total } }`, o
// `useCustomGridQuery` espera `ResponsePagination<T>` (`data.items`/
// `data.pagination`). Adaptação feita aqui, nunca no componente.
//
// `X-Farm-Id` anexado automaticamente pelo interceptor genérico de
// `@/services/api.ts` — este service não manipula o header manualmente.
//
// `createMarking`/`updateMarking` enviam o payload COMPLETO sempre —
// `MarkingRequest::rules()` real exige TODOS os campos (exceto
// `employee_uuid`/`center_uuid`) também no update (SEM `sometimes`,
// confirmado por leitura direta de `UpdateMarkingAction::handle()`:
// `fill($inputs)->save()` com o payload inteiro) — diferente do padrão de
// PATCH parcial por `dirtyFields` usado em outros módulos (mirror
// `updateWeaning`, não `updatePastagem`).
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { PaginationQueryParams } from '@/@types/pagination';
import type { Response, ResponsePagination } from '@/@types/response-api';
import type {
  BulkDoneRequest,
  BulkForecastRequest,
  CreateMarkingRequest,
  MarkingData,
  MarkingDoneLine,
  MarkingDoneSaveResult,
  MarkingFilterRequest,
  MarkingForecastLine,
  MarkingForecastSaveResult,
  MarkingImportResult,
  ReplaceMarkingDoneRequest,
  ReplaceMarkingForecastRequest,
  UpdateMarkingRequest,
} from '@/@types/v2/Marcacao/marking';

const BASE = '/markings';

export interface ListMarkingsParams extends PaginationQueryParams, MarkingFilterRequest {}

interface MarkingsApiPaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

interface MarkingsListEnvelope {
  success: boolean;
  message: string;
  data: MarkingData[];
  errors: Record<string, string[]> | null;
  meta: MarkingsApiPaginationMeta | null;
}

async function listMarkings(
  params: ListMarkingsParams
): Promise<ResponsePagination<MarkingData[]>> {
  const { data } = await api.V2.get<MarkingsListEnvelope>(BASE, {
    page: params.page,
    per_page: params.per_page,
    area_uuid: params.area_uuid || undefined,
    harvest_uuid: params.harvest_uuid || undefined,
    variety_uuid: params.variety_uuid || undefined,
    user_uuid: params.user_uuid || undefined,
    status: params.status || undefined,
    color: params.color || undefined,
    start_date: params.start_date || undefined,
    end_date: params.end_date || undefined,
    week: params.week || undefined,
  });

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

async function getMarking(uuid: string): Promise<Response<MarkingData>> {
  const { data } = await api.V2.get<Response<MarkingData>>(`${BASE}/${uuid}`);
  return data;
}

async function createMarking(payload: CreateMarkingRequest): Promise<Response<MarkingData>> {
  const { data } = await api.V2.post<Response<MarkingData>>(BASE, payload);
  return data;
}

async function updateMarking(
  uuid: string,
  payload: UpdateMarkingRequest
): Promise<Response<MarkingData>> {
  const { data } = await api.V2.put<Response<MarkingData>>(`${BASE}/${uuid}`, payload);
  return data;
}

async function deleteMarking(uuid: string): Promise<void> {
  await api.V2.delete(`${BASE}/${uuid}`);
}

// ---- Previsão (forecast) — single-marking --------------------------------
// `PUT /markings/{uuid}/forecast` (`MarkingForecastController::updateSingle`,
// TASK-MC-FE-05). Retorno REAL confirmado por leitura direta de
// `MarkingForecastController::presentResult()` (fork `GB.Cerne.Api`):
// `{ marking, lines }` — NUNCA `MarkingData` isolado (correção de tipo desta
// Tarefa, mesmo racional já documentado em `@/@types/v2/Marcacao/marking`).
async function replaceMarkingForecast(
  uuid: string,
  payload: ReplaceMarkingForecastRequest
): Promise<Response<MarkingForecastSaveResult>> {
  const { data } = await api.V2.put<Response<MarkingForecastSaveResult>>(
    `${BASE}/${uuid}/forecast`,
    payload
  );
  return data;
}

// ---- Previsão — em massa (ids[]) — TASK-MC-FE-07. `getMarkingForecastBulk`
// também é reaproveitado por TASK-MC-FE-05 (single) para hidratar as linhas
// já existentes de UM marking — NÃO existe `GET /markings/{uuid}/forecast`
// dedicado no fork (confirmado por leitura direta de `routes/api.php`); o
// mesmo endpoint bulk (`GET /markings/forecast?ids[]=`) resolve pelo
// PRIMEIRO marking do grupo (`GetMarkingForecastLinesForBulkAction`), que é
// exatamente o comportamento certo quando `ids` tem 1 único elemento. ------
async function createMarkingForecastBulk(
  payload: BulkForecastRequest
): Promise<Response<MarkingForecastSaveResult[]>> {
  const { data } = await api.V2.post<Response<MarkingForecastSaveResult[]>>(
    `${BASE}/forecast`,
    payload
  );
  return data;
}

async function getMarkingForecastBulk(ids: string[]): Promise<Response<MarkingForecastLine[]>> {
  const { data } = await api.V2.get<Response<MarkingForecastLine[]>>(`${BASE}/forecast`, { ids });
  return data;
}

async function updateMarkingForecastBulk(
  payload: BulkForecastRequest
): Promise<Response<MarkingForecastSaveResult[]>> {
  const { data } = await api.V2.put<Response<MarkingForecastSaveResult[]>>(
    `${BASE}/forecast`,
    payload
  );
  return data;
}

// ---- Realizado (done) — single-marking — TASK-MC-FE-06. Mesma correção de
// retorno de `replaceMarkingForecast` acima (`MarkingDoneController::
// presentResult()` real). -----------------------------------------------
async function replaceMarkingDone(
  uuid: string,
  payload: ReplaceMarkingDoneRequest
): Promise<Response<MarkingDoneSaveResult>> {
  const { data } = await api.V2.put<Response<MarkingDoneSaveResult>>(
    `${BASE}/${uuid}/done`,
    payload
  );
  return data;
}

// ---- Realizado — em massa (ids[]) — TASK-MC-FE-07. `getMarkingDoneBulk`
// também é reaproveitado por TASK-MC-FE-06 (single), mesmo racional de
// `getMarkingForecastBulk` acima. -----------------------------------------
async function createMarkingDoneBulk(
  payload: BulkDoneRequest
): Promise<Response<MarkingDoneSaveResult[]>> {
  const { data } = await api.V2.post<Response<MarkingDoneSaveResult[]>>(`${BASE}/done`, payload);
  return data;
}

async function getMarkingDoneBulk(ids: string[]): Promise<Response<MarkingDoneLine[]>> {
  const { data } = await api.V2.get<Response<MarkingDoneLine[]>>(`${BASE}/done`, { ids });
  return data;
}

async function updateMarkingDoneBulk(
  payload: BulkDoneRequest
): Promise<Response<MarkingDoneSaveResult[]>> {
  const { data } = await api.V2.put<Response<MarkingDoneSaveResult[]>>(`${BASE}/done`, payload);
  return data;
}

// ---- Import/Export/Download/Print — TASK-MC-FE-08, fora desta Tarefa ----
// Todos síncronos (mirror decisão §4.7 da API: sem `AsyncJob`), expostos
// aqui por completude da camada de dados.
async function importMarkings(file: File): Promise<Response<MarkingImportResult>> {
  const formData = new FormData();
  formData.append('file', file);
  const { data } = await api.V2.post<Response<MarkingImportResult>>(`${BASE}/import`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

async function downloadMarkingsExport(filter?: MarkingFilterRequest): Promise<Blob> {
  const { data } = await api.V2.get<Blob>(
    `${BASE}/export`,
    { ...filter },
    { responseType: 'blob' }
  );
  return data;
}

async function downloadMarkingTemplate(): Promise<Blob> {
  const { data } = await api.V2.get<Blob>(
    `${BASE}/download-template`,
    {},
    { responseType: 'blob' }
  );
  return data;
}

async function downloadMarkingReport(uuid: string): Promise<Blob> {
  const { data } = await api.V2.get<Blob>(`${BASE}/${uuid}/report`, {}, { responseType: 'blob' });
  return data;
}

export {
  createMarking,
  createMarkingDoneBulk,
  createMarkingForecastBulk,
  deleteMarking,
  downloadMarkingReport,
  downloadMarkingsExport,
  downloadMarkingTemplate,
  getMarking,
  getMarkingDoneBulk,
  getMarkingForecastBulk,
  importMarkings,
  listMarkings,
  replaceMarkingDone,
  replaceMarkingForecast,
  updateMarking,
  updateMarkingDoneBulk,
  updateMarkingForecastBulk,
};
