// src/services/v2/OpeningBalances/opening-balance-service.ts
// -----------------------------------------------------------------------------
// Opening Balance Service — API v1 do backend Laravel GB.Cerne (Estoque
// Inicial). Fundação de dados (TASK-FE-1040, execução 026).
//
// PREMISSA DE PATH (documentada, mesmo padrão já usado em `product-service.ts`
// antes do `ProductController` existir): contrato de API paralelo
// (`gb-cerne-api-architect-v2`) especifica `/opening-balances` (kebab-case,
// mirror `plan-accounts`) em OpeningBalance-contrato.md §3 (APROVADO, ciclo
// 1) — path já confirmado no momento em que este arquivo foi escrito. Se o
// endpoint publicado divergir, RECONCILIAR SÓ ESTE ARQUIVO — types/hooks/UI
// não referenciam o path fora daqui.
//
// Contrato (envelope ApiResponse): { success, message, data, errors, meta }.
//   GET    /opening-balances                  → data: OpeningBalanceListItem[] + meta (paginação, per_page default 10 — Doc Bruta §8, DIFERENTE do default 15 de Warehouse)
//   GET    /opening-balances/{uuid}            → data: OpeningBalanceDetail (alias estrutural, mirror Warehouse)
//   POST   /opening-balances                   → payload OpeningBalancePayload
//   PUT    /opening-balances/{uuid}             → payload OpeningBalancePayload
//   DELETE /opening-balances/{uuid}             → 204; 422 (BusinessRuleException) se estoque atual < quantidade do saldo (RN-8)
//   GET    /opening-balances/download            → binário .xlsx (responseType blob, template) — CORRIGIDO
//                                                   TASK-FE-1047 contra o contrato de API publicado
//                                                   (OpeningBalance-contrato.md §3/§7.1): path real é
//                                                   `/opening-balances/download`, NÃO
//                                                   `/opening-balances/import/template` (path só existia
//                                                   como PREMISSA em TASK-FE-1040, antes do contrato de API
//                                                   paralelo ser publicado — nenhuma tela consumia ainda,
//                                                   fundação pura, sem consumidor a quebrar).
//   GET    /opening-balances/export             → binário .xlsx (responseType blob, dados reais)
//   POST   /opening-balances/import             → multipart FormData, mirror `importPlanAccounts`
//                                                   (gate DUPLO `openingbalances_create` E `_edit`, §3/§7.2)
//
// `listOpeningBalances` ADAPTA o envelope paginado do backend ({ data: [],
// meta: {} }) para o shape `ResponsePagination` ({ data: { items, pagination
// } }) que a infra de grid do projeto (useCustomGridQuery/TableProvider)
// consome — mesmo truque de `listWarehouses`/`listPlanAccounts`. Nenhum hook
// global precisa mudar.
//
// Fundação pura (TASK-FE-1040) — nenhuma tela/hook consome ainda (consumo
// começa em TASK-FE-1042/1043/1045/1047).
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { PaginationQueryParams } from '@/@types/pagination';
import type { Response, ResponsePagination } from '@/@types/response-api';
import type {
  OpeningBalanceDetail,
  OpeningBalanceImportResult,
  OpeningBalanceListItem,
  OpeningBalancePayload,
  OpeningBalancesListEnvelope,
} from '@/@types/v2/OpeningBalances';

// Params aceitos pela listagem — paginação (default 10, fiel ao legado) +
// busca + os 2 filtros reais do backend (contrato §4).
export interface ListOpeningBalancesParams extends PaginationQueryParams {
  search?: string;
  product_uuid?: string;
  warehouse_uuid?: string;
}

async function listOpeningBalances(
  params: ListOpeningBalancesParams
): Promise<ResponsePagination<OpeningBalanceListItem[]>> {
  const { data } = await api.V2.get<OpeningBalancesListEnvelope>('/opening-balances', {
    page: params.page,
    per_page: params.per_page ?? 10,
    search: params.search || undefined,
    product_uuid: params.product_uuid || undefined,
    warehouse_uuid: params.warehouse_uuid || undefined,
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

async function getOpeningBalance(openingBalanceUuid: string) {
  const { data } = await api.V2.get<Response<OpeningBalanceDetail>>(
    `/opening-balances/${openingBalanceUuid}`
  );
  return data;
}

async function createOpeningBalance(payload: OpeningBalancePayload) {
  const { data } = await api.V2.post<Response<OpeningBalanceDetail>>('/opening-balances', payload);
  return data;
}

async function updateOpeningBalance(openingBalanceUuid: string, payload: OpeningBalancePayload) {
  const { data } = await api.V2.put<Response<OpeningBalanceDetail>>(
    `/opening-balances/${openingBalanceUuid}`,
    payload
  );
  return data;
}

async function deleteOpeningBalance(openingBalanceUuid: string) {
  const { data } = await api.V2.delete(`/opening-balances/${openingBalanceUuid}`);
  return data;
}

// ---- Import/Export (Excel) — V3 blob canônico, mirror `plan-account-service.ts` ----
// Exceção ao envelope ApiResponse (resposta binária .xlsx, não JSON) —
// `responseType: 'blob'`, retorno `Blob` puro.
//
// TASK-FE-1047 (Roteiro item 1): path do template CORRIGIDO para
// `/opening-balances/download` (nome da função preservado —
// `downloadOpeningBalanceImportTemplate` — só o path mudou; nenhum
// consumidor pré-existente a atualizar, fundação pura até esta Tarefa).

async function downloadOpeningBalanceImportTemplate(): Promise<Blob> {
  const { data } = await api.V2.get<Blob>('/opening-balances/download', undefined, {
    responseType: 'blob',
  });
  return data;
}

async function exportOpeningBalances(): Promise<Blob> {
  const { data } = await api.V2.get<Blob>('/opening-balances/export', undefined, {
    responseType: 'blob',
  });
  return data;
}

async function importOpeningBalances(file: File): Promise<Response<OpeningBalanceImportResult>> {
  const fd = new FormData();
  fd.append('file', file);
  const { data } = await api.V2.post<Response<OpeningBalanceImportResult>>(
    '/opening-balances/import',
    fd
  );
  return data;
}

export {
  createOpeningBalance,
  deleteOpeningBalance,
  downloadOpeningBalanceImportTemplate,
  exportOpeningBalances,
  getOpeningBalance,
  importOpeningBalances,
  listOpeningBalances,
  updateOpeningBalance,
};
