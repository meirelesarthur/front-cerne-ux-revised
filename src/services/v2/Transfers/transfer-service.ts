// src/services/v2/Transfers/transfer-service.ts
// -----------------------------------------------------------------------------
// Transfer Service — API v1 do backend Laravel GB.Cerne (`/transfers*`,
// api-contract-romaneios.md §4, TASK-TRF-FE-01).
//
// Fundação desta Tarefa: `listTransfers`/`deleteTransfer`. O resto
// (`getTransfer`/`createTransfer`/`updateTransfer`) entra nas Tarefas irmãs
// (TASK-TRF-FE-02..04, formulário).
//
// Envelope paginado — a divergência mais perigosa desta camada
// (front-contract-romaneios.md §7.1, armadilha #1 da Tarefa): a API devolve
// `{ data: [array plano], meta: { current_page, last_page, per_page, total,
// from, to, links } }` (`ApiResponse::paginated`), MAS o `useCustomGridQuery`
// espera `ResponsePagination<T>` = `{ data: { items, pagination: { total,
// count, per_page, current_page, total_pages } } }`. A adaptação abaixo
// (`data` → `items`, `meta.last_page` → `total_pages`) é responsabilidade
// DESTE service — molde literal `team-service.ts:57-72`. Escrever
// `query.data?.data?.items` sem este adapter devolve `undefined` em runtime,
// sem erro de tipo (precedência `spa > pwa` — o padrão genérico
// `get_pwa_grid_query_pattern` descreve um formato diferente do real).
//
// `X-Farm-Id` anexado automaticamente pelo interceptor genérico de
// `@/services/api.ts` — este service não manipula o header manualmente.
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { PaginationQueryParams } from '@/@types/pagination';
import type { Response, ResponsePagination } from '@/@types/response-api';
import type {
  CreateTransferRequest,
  TransferDetail,
  TransferFinishDetail,
  TransferFinishPayload,
  TransferFilterRequest,
  TransferListItem,
  TransfersListEnvelope,
  UpdateTransferRequest,
} from '@/@types/v2/Transfers';

// Params aceitos por `GET /transfers` — paginação padrão + `TransferFilterRequest`
// (9 filtros do drawer + busca numérica, contrato de API §4.2).
export interface ListTransfersParams extends PaginationQueryParams, TransferFilterRequest {}

async function listTransfers(
  params: ListTransfersParams
): Promise<ResponsePagination<TransferListItem[]>> {
  const { data } = await api.V2.get<TransfersListEnvelope>('/transfers', {
    page: params.page,
    per_page: params.per_page,
    // ⚠️ `search` é `integer` no servidor (armadilha #2 da Tarefa) — a tela
    // só chama este service quando o valor já é um inteiro válido; aqui só
    // repassamos o número (nunca uma string).
    search: params.search,
    product_uuid: params.product_uuid || undefined,
    client_uuid: params.client_uuid || undefined,
    user_uuid: params.user_uuid || undefined,
    proprietary_uuid: params.proprietary_uuid || undefined,
    type: params.type || undefined,
    status: params.status || undefined,
    // `??` — NUNCA `||` (armadilha #3 da Tarefa): `financial === false`
    // ("Não") é um valor válido e `||` o descartaria silenciosamente,
    // mostrando a lista inteira. Molde: `team-service.ts:47-54`.
    financial: params.financial !== undefined ? String(params.financial) : undefined,
    start_date: params.start_date || undefined,
    end_date: params.end_date || undefined,
  });

  // Adaptação envelope ApiResponse::paginated → ResponsePagination (grid) —
  // mesmo padrão de `listTeams`/`listFunctions`/`listEmployeeEvents`.
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

// `DELETE /transfers/{uuid}` — 204 SEM envelope (armadilha #6 da Tarefa). Não
// ler `data.message` da resposta; a mensagem de sucesso é da tela (i18n). O
// `destroy` recompõe o estoque (`RevertTransferStockExitAction`) no
// servidor — nenhuma ação adicional do client é necessária aqui.
//
// Pode falhar com 422 de negócio (armadilha #8 da Tarefa — NF-e vinculada ou
// lançamento financeiro, mesmo com o botão habilitado, porque o dado pode
// mudar entre o carregamento da lista e o clique): o caller deve exibir a
// `message` do servidor, nunca uma mensagem genérica.
async function deleteTransfer(uuid: string): Promise<void> {
  await api.V2.delete(`/transfers/${uuid}`);
}

// -----------------------------------------------------------------------------
// TASK-TRF-FE-02 — formulário (criar/editar). `GET` devolve o `TransferDetail`
// hidratado (items/expenses inclusos, contrato §5.8); `POST`/`PUT` recebem o
// payload COMPLETO (`CreateTransferRequest`/`UpdateTransferRequest` — mesmo
// shape, `PUT` é substituição integral, nunca delta de `dirtyFields`).
// -----------------------------------------------------------------------------

async function getTransfer(uuid: string): Promise<Response<TransferDetail>> {
  const { data } = await api.V2.get<Response<TransferDetail>>(`/transfers/${uuid}`);
  return data;
}

async function createTransfer(payload: CreateTransferRequest): Promise<Response<TransferDetail>> {
  const { data } = await api.V2.post<Response<TransferDetail>>('/transfers', payload);
  return data;
}

async function updateTransfer(
  uuid: string,
  payload: UpdateTransferRequest
): Promise<Response<TransferDetail>> {
  const { data } = await api.V2.put<Response<TransferDetail>>(`/transfers/${uuid}`, payload);
  return data;
}

async function getTransferFinish(uuid: string): Promise<Response<TransferFinishDetail>> {
  const { data } = await api.V2.get<Response<TransferFinishDetail>>(`/transfers/${uuid}/finish`);
  return data;
}

async function finishTransfer(
  uuid: string,
  payload: TransferFinishPayload
): Promise<Response<TransferDetail>> {
  const { data } = await api.V2.put<Response<TransferDetail>>(`/transfers/${uuid}/finish`, payload);
  return data;
}

export {
  createTransfer,
  deleteTransfer,
  finishTransfer,
  getTransfer,
  getTransferFinish,
  listTransfers,
  updateTransfer,
};
