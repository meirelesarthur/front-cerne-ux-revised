// src/services/v2/FinancialFreeze/financial-freeze-service.ts
// -----------------------------------------------------------------------------
// FinancialFreeze Service — API v1 do backend Laravel GB.Cerne
// ("Congelamentos Financeiros", F-110, esteira 97-Esteiras/008). Mirror
// estrutural de `@/services/v2/OfxImport/ofx-import-service.ts` (mesmo
// formato de cabeçalho, mesma adaptação de paginação `ResponsePagination`).
//
// Contrato (envelope ApiResponse): { success, message, data, errors, meta }.
//   GET    /financial-freezes            → data: FinancialFreezeListItem[],
//                                          meta paginação REAL.
//   GET    /financial-freezes/{uuid}      → data: FinancialFreezeDetail
//                                          (ÚNICO verbo que traz `movements`
//                                          junto com o `PUT`).
//   POST   /financial-freezes             → 201, data: FinancialFreezeListItem
//                                          (SEM `movements`).
//   PUT    /financial-freezes/{uuid}      → 200, data: FinancialFreezeDetail
//                                          (COM `movements` atualizados).
//   DELETE /financial-freezes/{uuid}      → 204, hard delete (SEM corpo útil
//                                          — não desempacotar `.data`).
//
// A API NÃO aceita `orderBy`/`groupBy`/`filter` — a ordenação é fixa no
// servidor (`year DESC, month DESC`). O `useCustomGridQuery` monta esses
// campos no `paginatedQuery`, mas só `page`/`per_page`/`month`/`year` são
// encaminhados aqui — os demais são descartados por construção (a função
// nem os lê do parâmetro `params`).
//
// Rota dentro do grupo `auth:sanctum` — `X-Farm-Id` é anexado
// automaticamente pelo interceptor genérico de `@/services/api.ts`.
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { PaginationQueryParams } from '@/@types/pagination';
import type { Response, ResponsePagination } from '@/@types/response-api';
import type {
  FinancialFreezeDetail,
  FinancialFreezeListItem,
  FinancialFreezePayload,
  FinancialFreezesListEnvelope,
} from '@/@types/v2/FinancialFreeze';

export interface ListFinancialFreezesParams extends PaginationQueryParams {
  month?: number;
  year?: string;
}

async function listFinancialFreezes(
  params: ListFinancialFreezesParams
): Promise<ResponsePagination<FinancialFreezeListItem[]>> {
  const { data } = await api.V2.get<FinancialFreezesListEnvelope>('/financial-freezes', {
    page: params.page,
    per_page: params.per_page,
    month: params.month,
    year: params.year,
  });

  // Adaptação envelope ApiResponse::paginated → ResponsePagination (grid) —
  // mirror `listOfxImports`. `total_pages` vem de `meta.last_page`, NÃO
  // `meta.total_pages` (armadilha confirmada, contrato de tela §2.2).
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

async function getFinancialFreeze(financialFreezeUuid: string) {
  const { data } = await api.V2.get<Response<FinancialFreezeDetail>>(
    `/financial-freezes/${financialFreezeUuid}`
  );
  return data;
}

// `POST` devolve o objeto SEM `movements` (o Action de criação não
// eager-loada a relação) — tipado como `FinancialFreezeListItem`, não
// `Detail` (contrato de tela §4/§7).
async function createFinancialFreeze(payload: FinancialFreezePayload) {
  const { data } = await api.V2.post<Response<FinancialFreezeListItem>>(
    '/financial-freezes',
    payload
  );
  return data;
}

// `PUT` é full-replace dos 3 campos (mirror fiel do legado, elimina a
// ambiguidade do merge parcial que a API também aceita via `sometimes`) e
// devolve `movements` atualizados.
async function updateFinancialFreeze(financialFreezeUuid: string, payload: FinancialFreezePayload) {
  const { data } = await api.V2.put<Response<FinancialFreezeDetail>>(
    `/financial-freezes/${financialFreezeUuid}`,
    payload
  );
  return data;
}

// 204 sem corpo útil — a exceção do servidor sobe ao Handler central
// (AD-07); o front exibe o erro tal como vem, sem mensagem de negócio
// fabricada.
async function deleteFinancialFreeze(financialFreezeUuid: string) {
  const { data } = await api.V2.delete(`/financial-freezes/${financialFreezeUuid}`);
  return data;
}

export {
  createFinancialFreeze,
  deleteFinancialFreeze,
  getFinancialFreeze,
  listFinancialFreezes,
  updateFinancialFreeze,
};
