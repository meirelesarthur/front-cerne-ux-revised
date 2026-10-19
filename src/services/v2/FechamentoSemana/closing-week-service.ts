// src/services/v2/FechamentoSemana/closing-week-service.ts
// -----------------------------------------------------------------------------
// Closing Week Service — API v1 do backend Laravel GB.Cerne
// (`/closing-weeks*`), TASK-FE-FS-01 (fundação).
//
// Envelope paginado — mesma divergência já documentada em
// `charge-service.ts`/`transfer-service.ts`: a API devolve `{ data: [array
// plano], meta: { current_page, last_page, per_page, total, from, to,
// links } }` (`ApiResponse::paginated`), mas o `useCustomGridQuery` espera
// `ResponsePagination<T>` = `{ data: { items, pagination: { total, count,
// per_page, current_page, total_pages } } }`. A adaptação abaixo é
// responsabilidade DESTE service — molde literal `charge-service.ts`.
//
// `X-Farm-Id` anexado automaticamente pelo interceptor genérico de
// `@/services/api.ts` — este service não manipula o header manualmente.
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { PaginationQueryParams } from '@/@types/pagination';
import type { Response, ResponsePagination } from '@/@types/response-api';
import type {
  ClosingWeekDetail,
  ClosingWeekListItem,
  ClosingWeekPreviewData,
  ClosingWeekPreviewParams,
  ClosingWeeksListEnvelope,
  StoreClosingWeekPayload,
} from '@/@types/v2/FechamentoSemana';

// Params aceitos por `GET /closing-weeks` — só paginação (`ClosingWeekIndexRequest`,
// CL-006: sem filtro/busca nesta tela, LM-05 `per_page` default 10).
export interface ListClosingWeeksParams extends PaginationQueryParams {}

async function listClosingWeeks(
  params: ListClosingWeeksParams
): Promise<ResponsePagination<ClosingWeekListItem[]>> {
  const { data } = await api.V2.get<ClosingWeeksListEnvelope>('/closing-weeks', {
    page: params.page,
    per_page: params.per_page,
  });

  // Adaptação envelope ApiResponse::paginated → ResponsePagination (grid) —
  // mesmo padrão de `listCharges`/`listTransfers`.
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

// `GET /closing-weeks/preview` — leitura sob demanda (mutation no consumidor,
// TASK-FE-FS-04), NUNCA auto-fetch/cache (mirror `buildChargeTransferDraft`).
async function previewClosingWeek(
  params: ClosingWeekPreviewParams
): Promise<Response<ClosingWeekPreviewData>> {
  const { data } = await api.V2.get<Response<ClosingWeekPreviewData>>('/closing-weeks/preview', {
    start_date: params.start_date,
    end_date: params.end_date,
  });
  return data;
}

async function storeClosingWeek(
  payload: StoreClosingWeekPayload
): Promise<Response<ClosingWeekDetail>> {
  const { data } = await api.V2.post<Response<ClosingWeekDetail>>('/closing-weeks', payload);
  return data;
}

async function getClosingWeek(uuid: string): Promise<Response<ClosingWeekDetail>> {
  const { data } = await api.V2.get<Response<ClosingWeekDetail>>(`/closing-weeks/${uuid}`);
  return data;
}

// `DELETE /closing-weeks/{uuid}` — 204 SEM envelope (soft-delete no servidor,
// DEC-FS-03; mirror `deleteCharge`). Não ler `data.message` da resposta.
async function deleteClosingWeek(uuid: string): Promise<void> {
  await api.V2.delete(`/closing-weeks/${uuid}`);
}

export {
  deleteClosingWeek,
  getClosingWeek,
  listClosingWeeks,
  previewClosingWeek,
  storeClosingWeek,
};
