// src/services/v2/Ncms/ncm-service.ts
// -----------------------------------------------------------------------------
// Ncm Service — lookup de apoio para o campo `ncm_uuid` do formulário de
// Produto (`TASK-FE-503`/`TASK-FE-762`). `GET /ncms/options` devolve
// `{uuid, code, description}` (`NcmOptionResource` real, confirmado). NÃO É
// MOCK: a chamada é real, contra a rota documentada — se o backend não
// responder, o `SelectAsyncPaginate` já exibe o toast de erro honesto do
// componente compartilhado (`strings.status.loadingError`), sem fallback
// fabricado.
//
// Busca OBRIGATÓRIA `min:3` (achado do contrato, D-especial §17.4: a tabela
// `ncms` tem 10.678 linhas — sem o mínimo de 3 caracteres o backend
// rejeitaria com 422 ou devolveria uma lista grande demais). Este service
// CURTO-CIRCUITA client-side abaixo de 3 caracteres (devolve página vazia,
// sem round-trip) — nem "fingir" um filtro que o backend ainda não aplica,
// nem golpear a rota com buscas de 1-2 caracteres que ela vai rejeitar.
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { PaginationQueryParams } from '@/@types/pagination';
import type { ResponsePagination } from '@/@types/response-api';
import type { NcmOption, NcmOptionsEnvelope } from '@/@types/v2/Ncms';

export interface ListNcmOptionsParams extends PaginationQueryParams {
  search?: string;
}

/** Teto mínimo de caracteres exigido pelo backend (`ncms/options`, contrato
 *  §17.4) antes de disparar a busca — mirror do gate que o próprio backend
 *  aplica, para não gerar requisições que ele rejeitaria/ignoraria. */
const NCM_SEARCH_MIN_LENGTH = 3;

function emptyPage(): ResponsePagination<NcmOption[]> {
  return {
    success: true,
    message: '',
    data: {
      items: [],
      pagination: { total: 0, count: 0, per_page: 0, current_page: 1, total_pages: 1 },
    },
  };
}

async function listNcmOptions(
  params: ListNcmOptionsParams
): Promise<ResponsePagination<NcmOption[]>> {
  const search = params.search?.trim() ?? '';
  if (search.length < NCM_SEARCH_MIN_LENGTH) {
    return emptyPage();
  }

  const { data } = await api.V2.get<NcmOptionsEnvelope>('/ncms/options', {
    search,
    page: params.page,
    per_page: params.per_page,
  });

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

export { listNcmOptions, NCM_SEARCH_MIN_LENGTH };
