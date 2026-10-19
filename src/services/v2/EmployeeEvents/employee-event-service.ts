// src/services/v2/EmployeeEvents/employee-event-service.ts
// -----------------------------------------------------------------------------
// Employee Event Service — API v1 do backend Laravel GB.Cerne
// (`/employee-events*`, FuncionarioXEventos-contrato.md §3/§4, TASK-FE-FXE-01).
//
// Contrato (envelope ApiResponse): { success, message, data, errors, meta }.
//   GET   /employee-events            → data: EmployeeEventListItem[] + meta paginação REAL
//                                        (filtros employee_uuid/event_uuid/is_enabled) — `employeeevents_view`.
//   PUT   /employee-events/sync       → payload SyncEmployeeEventsRequest; data: SyncEmployeeEventsResult
//                                        (único endpoint de escrita da SPA, DA-EE-FE-01) — `employeeevents_edit`.
//                                        422 possível: `errors.duplicate_link` (GAP-BE-06).
//   GET   /employee-events/download   → binário (.xlsx em branco) — `employeeevents_view` (GAP-BE-05 Opção A).
//   POST  /employee-events/import     → multipart `file`; data: EmployeeEventImportResult — `employeeevents_create`.
//   GET   /employee-events/report     → binário (PDF), SEM query params (relatório farm-wide,
//                                        1 clique) — `employeeevents_view` (GAP-BE-05 Opção A).
//
// `listEmployeeEvents`/`syncEmployeeEvents` são consumidos só pela Tela 2
// (Matriz, TASK-FE-FXE-02), mas criados aqui junto do resto do service
// (instrução explícita da Tarefa 06 — fundação completa do módulo).
//
// `X-Farm-Id` anexado automaticamente pelo interceptor genérico de
// `@/services/api.ts` (mesmo mecanismo de `event-service.ts`) — este service
// não manipula o header manualmente.
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { PaginationQueryParams } from '@/@types/pagination';
import type { Response, ResponsePagination } from '@/@types/response-api';
import type {
  EmployeeEventImportResult,
  EmployeeEventListItem,
  EmployeeEventsListEnvelope,
  SyncEmployeeEventsRequest,
  SyncEmployeeEventsResult,
} from '@/@types/v2/EmployeeEvents';

// Params aceitos por `GET /employee-events` — filtros server-side
// `employee_uuid`/`event_uuid`/`is_enabled` (contrato de API §3.1
// `EmployeeEventFilterData`), sem `search` (o pivot não tem campo textual
// próprio a buscar — a busca por nome do funcionário vive na Tela 1, via
// `listEmployees`).
export interface ListEmployeeEventsParams extends PaginationQueryParams {
  employee_uuid?: string;
  event_uuid?: string;
  is_enabled?: boolean;
}

async function listEmployeeEvents(
  params: ListEmployeeEventsParams
): Promise<ResponsePagination<EmployeeEventListItem[]>> {
  const { data } = await api.V2.get<EmployeeEventsListEnvelope>('/employee-events', {
    page: params.page,
    per_page: params.per_page,
    employee_uuid: params.employee_uuid || undefined,
    event_uuid: params.event_uuid || undefined,
    // `??` — NUNCA `||` (checklist item 19 do padrão do projeto): `is_enabled
    // === false` é um valor válido e `||` o descartaria silenciosamente.
    is_enabled: params.is_enabled ?? undefined,
  });

  // Adaptação envelope ApiResponse::paginated → ResponsePagination (grid) —
  // mesmo padrão de `listEvents`/`listEmployees`.
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

// `PUT /employee-events/sync` — único endpoint de escrita da SPA (DA-EE-FE-01).
// Payload SEMPRE completo (o array `items` reflete o `useFieldArray` inteiro
// no momento do submit; o backend faz o diff+delete+updateOrCreate).
async function syncEmployeeEvents(
  payload: SyncEmployeeEventsRequest
): Promise<Response<SyncEmployeeEventsResult>> {
  const { data } = await api.V2.put<Response<SyncEmployeeEventsResult>>(
    '/employee-events/sync',
    payload
  );
  return data;
}

// Download do modelo em branco (.xlsx) — exceção ao envelope `ApiResponse`
// (resposta binária), mirror `downloadStockCorrectionImportTemplate`.
async function downloadEmployeeEventsTemplate(): Promise<Blob> {
  const { data } = await api.V2.get<Blob>('/employee-events/download', undefined, {
    responseType: 'blob',
  });
  return data;
}

// `POST /employee-events/import` — multipart, campo `file`. Sucesso (201):
// envelope `Response<EmployeeEventImportResult>` (shape confirmado por
// leitura direta, ver nota de cabeçalho de `@/@types/v2/EmployeeEvents`).
// Erro 422: `errors.rows: string[]` (linhas inválidas, fail-fast, nada
// persistido) OU `message` única — tratamento diferenciado fica na mutation
// de `FuncionarioEventoImportModal.tsx` (NÃO usa `useRequest` genérico,
// mirror `StockCorrectionImportModal.tsx`).
async function importEmployeeEvents(file: File): Promise<Response<EmployeeEventImportResult>> {
  const fd = new FormData();
  fd.append('file', file);
  const { data } = await api.V2.post<Response<EmployeeEventImportResult>>(
    '/employee-events/import',
    fd
  );
  return data;
}

// Relatório PDF (`GET /employee-events/report`) — SEM query params (farm-wide,
// 1 clique, contrato de tela §2 — confirmado por leitura direta de
// `EmployeeEventReportController::__invoke()`, que não aceita nenhum filtro).
// Exceção ao envelope `ApiResponse` (resposta binária), mirror
// `exportStocksReport`/`downloadStockCorrectionImportTemplate`.
async function exportEmployeeEventsReport(): Promise<Blob> {
  const { data } = await api.V2.get<Blob>('/employee-events/report', undefined, {
    responseType: 'blob',
  });
  return data;
}

export {
  downloadEmployeeEventsTemplate,
  exportEmployeeEventsReport,
  importEmployeeEvents,
  listEmployeeEvents,
  syncEmployeeEvents,
};
