// src/services/v2/Events/event-service.ts
// -----------------------------------------------------------------------------
// Event Service — API v1 do backend Laravel GB.Cerne (`/events*`,
// Eventos-contrato.md §1). Mirror estrutural de `function-service.ts`
// (adaptação do envelope paginado real `ApiResponse::paginated` para
// `ResponsePagination`, consumido pela grid via `useCustomGridQuery`).
//
// TASK-FE-EVT-01 cobre `listEvents`/`deleteEvent`. TASK-FE-EVT-02 ACRESCENTA
// `getEvent`/`createEvent`/`updateEvent` (mirror `getFunction`/`createFunction`/
// `updateFunction`).
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { PaginationQueryParams } from '@/@types/pagination';
import type { Response, ResponsePagination } from '@/@types/response-api';
import type {
  CreateEventRequest,
  EventDetail,
  EventListItem,
  EventOption,
  EventOptionsListEnvelope,
  EventsListEnvelope,
  UpdateEventRequest,
} from '@/@types/v2/Events';

// Params aceitos pela listagem — paginação padrão + busca (`name`, ILIKE) +
// filtros reais do backend (`is_enabled`/`start_date`/`end_date`, sobre
// `created_at` — contrato de tela §2). `is_enabled` SEMPRE stringificado
// explicitamente antes de ir para a querystring (checklist `??` nunca `||`).
export interface ListEventsParams extends PaginationQueryParams {
  search?: string;
  is_enabled?: boolean | 'true' | 'false';
  start_date?: string;
  end_date?: string;
}

async function listEvents(params: ListEventsParams): Promise<ResponsePagination<EventListItem[]>> {
  const { data } = await api.V2.get<EventsListEnvelope>('/events', {
    page: params.page,
    per_page: params.per_page,
    search: params.search || undefined,
    // `??` — NUNCA `||` (checklist item 19 do padrão do projeto):
    // `is_enabled === false` (filtro "Inativo") é um valor válido e `||` o
    // descartaria silenciosamente.
    is_enabled: params.is_enabled !== undefined ? String(params.is_enabled) : undefined,
    start_date: params.start_date || undefined,
    end_date: params.end_date || undefined,
  });

  // Adaptação envelope ApiResponse::paginated → ResponsePagination (grid) —
  // mesmo padrão de `listFunctions`/`listParameterWeights`.
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

async function deleteEvent(uuid: string) {
  const { data } = await api.V2.delete(`/events/${uuid}`);
  return data;
}

// -----------------------------------------------------------------------------
// Lookup enxuto (`GET /events/options`, TASK-12-registro-faltas) — Mirror
// EXATO de `listFunctionOptions` (`function-service.ts`): o endpoint devolve
// uma `Collection` PHP SEM paginação real (`EventOptionResource::collection`),
// então o adaptador simula uma página única para compatibilizar com o
// contrato `ResponsePagination` exigido pelo `SelectAsyncPaginate`.
// Compartilhável por Bonus/Advance/Earning/EmployeeEvent/Absence (mesmo
// endpoint) — reusar esta função, nunca duplicar.
// -----------------------------------------------------------------------------

// `extends PaginationQueryParams` só para compatibilizar estruturalmente com
// a assinatura genérica `service` do `SelectAsyncPaginate`
// (`(pageParams: PaginationQueryParams) => ...`, mesma técnica de
// `ListFunctionOptionsParams`) — `page`/`per_page` NUNCA são enviados na
// query (o endpoint `/events/options` não pagina, contrato de tela §8).
export interface ListEventOptionsParams extends PaginationQueryParams {
  search?: string;
  only_enabled?: boolean;
}

async function listEventOptions(
  params: ListEventOptionsParams
): Promise<ResponsePagination<EventOption[]>> {
  const { data } = await api.V2.get<EventOptionsListEnvelope>('/events/options', {
    search: params.search || undefined,
    only_enabled: params.only_enabled ?? true,
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

// -----------------------------------------------------------------------------
// Formulário create/edit (TASK-FE-EVT-02) — mirror exato de
// `function-service.ts` (getFunction/createFunction/updateFunction).
// -----------------------------------------------------------------------------

async function getEvent(uuid: string): Promise<Response<EventDetail>> {
  const { data } = await api.V2.get<Response<EventDetail>>(`/events/${uuid}`);
  return data;
}

async function createEvent(body: CreateEventRequest): Promise<Response<EventDetail>> {
  const { data } = await api.V2.post<Response<EventDetail>>('/events', body);
  return data;
}

async function updateEvent(uuid: string, body: UpdateEventRequest): Promise<Response<EventDetail>> {
  const { data } = await api.V2.put<Response<EventDetail>>(`/events/${uuid}`, body);
  return data;
}

export { createEvent, deleteEvent, getEvent, listEventOptions, listEvents, updateEvent };
