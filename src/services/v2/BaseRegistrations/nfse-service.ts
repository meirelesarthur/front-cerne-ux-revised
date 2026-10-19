// src/services/v2/BaseRegistrations/nfse-service.ts
// -----------------------------------------------------------------------------
// Nfse Service — API v1 do backend Laravel GB.Cerne (NFSe Recebidas, domínio
// Fiscal, execução 033, TASK-FE-2730). Contrato lido direto do código real do
// backend já entregue (TASK-BE-973/974/975, `🔬 PARA TESTE`):
//   app/Http/Resources/V1/NfseResource.php, NfseIndexRequest.php,
//   NfseStoreRequest.php, app/Data/ExpenseDraftData.php,
//   app/Http/Controllers/Api/V1/NfseController.php.
//
// Contrato (envelope ApiResponse): { success, message, data, errors, meta }.
//   GET    /nfses                      → data: NfseListItem[] + meta REAL de
//                                         paginação (ApiResponse::paginated).
//   GET    /nfses/{uuid}               → data: NfseDetail.
//   POST   /nfses                      → SÍNCRONO (200, sem Job/202,
//                                         GAP-BE-519). Resposta: data =
//                                         NfseListItem[] SEM paginação (delta
//                                         sincronizado nesta chamada).
//   GET    /nfses/{uuid}/xml           → binário application/xml.
//   GET    /nfses/{uuid}/danfe         → binário application/pdf.
//   POST   /nfses/{uuid}/expense-draft → JSON, data = NfseExpenseDraft (NÃO
//                                         persiste Expense).
//
// `listNfses` ADAPTA o envelope paginado real do backend para o shape
// `ResponsePagination` que a infra de grid do projeto (useCustomGridQuery/
// TableProvider) consome — mesmo adaptador de `listIssuers`/
// `listIssueDfeSyncTimes`. `downloadNfseXml`/`generateNfseDanfe` usam
// `responseType: 'blob'` (binário puro, SEM envelope ApiResponse) — mirror
// `downloadOpeningBalanceImportTemplate`/`exportOpeningBalances`.
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { PaginationQueryParams } from '@/@types/pagination';
import type { Response, ResponsePagination } from '@/@types/response-api';
import type {
  NfseDetail,
  NfseExpenseDraft,
  NfseFilterForm,
  NfseListItem,
  NfsesListEnvelope,
  NfseSyncEnvelope,
  NfseSyncPayload,
} from '@/@types/v2/BaseRegistrations/nfse';

// Params aceitos pela listagem — paginação real + `issuer_uuid`/`search`/
// `launched`/`date_from`/`date_to` (contrato §1, `NfseIndexRequest`).
export interface ListNfsesParams extends PaginationQueryParams, NfseFilterForm {}

async function listNfses(params: ListNfsesParams): Promise<ResponsePagination<NfseListItem[]>> {
  const { data } = await api.V2.get<NfsesListEnvelope>('/nfses', {
    page: params.page,
    per_page: params.per_page,
    issuer_uuid: params.issuer_uuid || undefined,
    search: params.search || undefined,
    launched: params.launched || undefined,
    date_from: params.date_from || undefined,
    date_to: params.date_to || undefined,
  });

  // Adaptação envelope ApiResponse::paginated → ResponsePagination (grid) —
  // lê `meta.total`/`per_page`/`current_page`/`last_page` REAIS, mesmo
  // adaptador de `listIssuers`/`listIssueDfeSyncTimes`.
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

async function getNfseByUuid(uuid: string) {
  const { data } = await api.V2.get<Response<NfseDetail>>(`/nfses/${uuid}`);
  return data;
}

// Timeout próprio do `POST /nfses` (UT-000754): a sincronização é SÍNCRONA e o
// pior caso da API é ~90 s (loop de NSU no webservice nacional). O axios global
// (`VITE_API_TIMEOUT`, 30 s) cortaria a chamada antes — por isso o override é
// POR CHAMADA, só aqui.
const NFSE_SYNC_TIMEOUT_MS = 120_000;

// `POST /nfses` — "Buscar DFe" (síncrono, GAP-BE-519). Resposta é a
// Collection SINCRONIZADA NESTA CHAMADA (delta, RN-9 NSU incremental) mais
// `meta.synced_count`/`meta.environment` — NUNCA tipar como `ResponsePagination`
// (o `store` não pagina).
async function syncNfses(payload: NfseSyncPayload) {
  const { data } = await api.V2.post<NfseSyncEnvelope>('/nfses', payload, {
    timeout: NFSE_SYNC_TIMEOUT_MS,
  });
  return data;
}

// ---- Downloads (binário puro, SEM envelope ApiResponse) --------------------

async function downloadNfseXml(uuid: string): Promise<Blob> {
  const { data } = await api.V2.get<Blob>(`/nfses/${uuid}/xml`, undefined, {
    responseType: 'blob',
  });
  return data;
}

async function generateNfseDanfe(uuid: string): Promise<Blob> {
  const { data } = await api.V2.get<Blob>(`/nfses/${uuid}/danfe`, undefined, {
    responseType: 'blob',
  });
  return data;
}

// ---- Rascunho de Despesa (leitura calculada, NÃO persiste Expense) --------

async function buildNfseExpenseDraft(uuid: string) {
  const { data } = await api.V2.post<Response<NfseExpenseDraft>>(`/nfses/${uuid}/expense-draft`);
  return data;
}

export {
  buildNfseExpenseDraft,
  downloadNfseXml,
  generateNfseDanfe,
  getNfseByUuid,
  listNfses,
  NFSE_SYNC_TIMEOUT_MS,
  syncNfses,
};
