// src/services/v2/Cbo/cbo-service.ts
// -----------------------------------------------------------------------------
// Cbo Service — API v1 do backend Laravel GB.Cerne. Service NOVO e MÍNIMO
// (DA-FN-05, TASK-FN-FE-01) — só o necessário para popular o
// `SelectAsyncPaginate` de `cbo_uuid` (filtro da listagem de Funções e,
// futuramente, formulário create/edit da Tarefa irmã TASK-FN-FE-02). Mirror
// estrutural de `function-service.ts::listFunctionOptions` (adaptação do
// envelope paginado real para `ResponsePagination`).
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { PaginationQueryParams } from '@/@types/pagination';
import type { ResponsePagination } from '@/@types/response-api';
import type { CboOption, CboOptionsListEnvelope } from '@/@types/v2/Cbo';

export interface ListCboOptionsParams extends PaginationQueryParams {
  search?: string;
}

async function listCboOptions(
  params: ListCboOptionsParams
): Promise<ResponsePagination<CboOption[]>> {
  const { data } = await api.V2.get<CboOptionsListEnvelope>('/cbos/options', {
    page: params.page,
    per_page: params.per_page,
    search: params.search || undefined,
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

export { listCboOptions };
