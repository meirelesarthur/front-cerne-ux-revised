// src/services/v2/Fiscal/dfe-service.ts
// -----------------------------------------------------------------------------
// Dfe Service — API v1 do backend Laravel GB.Cerne (DFe Recebidas, domínio
// Fiscal, execução 044, TASK-DFE-FE-03). Contrato: `CONTRATO-API-DFE.md §6`.
// Mirror estrutural de `nfse-service.ts` (mesmo domínio, mesmo tipo de tela —
// documento fiscal de terceiro, sem CRUD).
//
// Contrato (envelope ApiResponse): { success, message, data, errors, meta }.
//   GET  /dfes                    → data: DfeListItem[] + meta REAL de
//                                    paginação (ApiResponse::paginated).
//   GET  /dfes/{uuid}             → data: DfeDetail.
//   POST /dfes/sync               → SÍNCRONO (GAP-DFE-02, opção A — DECISOES-
//                                    DONO.md). Resposta: `data: null` + `message`
//                                    (UT-000752: NÃO devolve a Collection).
//   GET  /dfes/manifest-events    → lookup estático (LOOK-04).
//   POST /dfes/manifest           → `data: null` + `message`.
//   GET  /dfes/{uuid}/return-candidates → candidatos do Retorno (UT-000752).
//   PUT  /dfes/{uuid}/personal    → toggle sem body.
//   PUT  /dfes/{uuid}/shipment    → toggle sem body.
//   GET  /dfes/{uuid}/danfe       → binário application/pdf.
//   GET  /dfes/{uuid}/xml         → binário application/xml (reusado por
//                                    TASK-DFE-FE-08).
//   GET  /dfes-report             → binário (pdf|xlsx conforme `type`).
//
// `listDfes` ADAPTA o envelope paginado real do backend para o shape
// `ResponsePagination` que a infra de grid do projeto (useCustomGridQuery/
// TableProvider) consome — mesmo adaptador de `listNfses`/`listIssuers`.
// Downloads usam `responseType: 'blob'` (binário puro, SEM envelope
// ApiResponse) — mirror `downloadNfseXml`/`generateNfseDanfe`.
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { PaginationQueryParams } from '@/@types/pagination';
import type { Response, ResponsePagination } from '@/@types/response-api';
import type {
  DfeDetail,
  DfeFilterForm,
  DfeListItem,
  DfeManifestPayload,
  DfeReportFilterForm,
  DfeReturnCandidate,
  DfeReturnCandidatesEnvelope,
  DfeReturnCandidatesParams,
  DfeReturnContext,
  DfesListEnvelope,
  DfeSyncPayload,
} from '@/@types/v2/Fiscal/dfe';

// Params aceitos pela listagem — paginação real + filtros de `DfeFilterForm`
// (contrato §6 #1, `DfeIndexRequest`).
export interface ListDfesParams extends PaginationQueryParams, DfeFilterForm {}

async function listDfes(params: ListDfesParams): Promise<ResponsePagination<DfeListItem[]>> {
  const { data } = await api.V2.get<DfesListEnvelope>('/dfes', {
    page: params.page,
    per_page: params.per_page,
    issue_uuid: params.issue_uuid || undefined,
    search: params.search || undefined,
    start_date: params.start_date || undefined,
    end_date: params.end_date || undefined,
    // '0' é string não vazia (truthy): `||` NÃO descarta o "Não" do filtro.
    launched: params.launched || undefined,
    status: params.status ?? undefined,
    is_personal: params.is_personal || undefined,
    is_shipment: params.is_shipment || undefined,
  });

  // Adaptação envelope ApiResponse::paginated → ResponsePagination (grid) —
  // lê `meta.total`/`per_page`/`current_page`/`last_page` REAIS, mesmo
  // adaptador de `listNfses`/`listIssuers`.
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

async function getDfeByUuid(uuid: string) {
  const { data } = await api.V2.get<Response<DfeDetail>>(`/dfes/${uuid}`);
  return data;
}

// `POST /dfes/sync` — "Buscar DFe" (síncrono, GAP-DFE-02 opção A). Resposta é
// `data: null` (UT-000752) — o front usa só `message` da API.
async function syncDfe(payload: DfeSyncPayload) {
  const { data } = await api.V2.post<Response<null>>('/dfes/sync', payload);
  return data;
}

// ---- Lookup de eventos de manifestação (LOOK-04) --------------------------

export interface DfeManifestEventLookupItem {
  value: 1 | 2 | 3 | 4;
  label: string;
}

async function getManifestEvents() {
  const { data } =
    await api.V2.get<Response<DfeManifestEventLookupItem[]>>('/dfes/manifest-events');
  return data;
}

// ---- Manifestação (individual/lote) + toggles -----------------------------

async function manifestDfes(payload: DfeManifestPayload) {
  const { data } = await api.V2.post<Response<null>>('/dfes/manifest', payload);
  return data;
}

async function toggleDfePersonal(uuid: string) {
  const { data } = await api.V2.put<Response<DfeDetail>>(`/dfes/${uuid}/personal`);
  return data;
}

async function toggleDfeShipment(uuid: string) {
  const { data } = await api.V2.put<Response<DfeDetail>>(`/dfes/${uuid}/shipment`);
  return data;
}

// ---- Retorno (UT-000752, T-752-FE-03) ---------------------------------------
// `GET /dfes/{uuid}/return-candidates` — só Abate pendente da fazenda atual
// com o mesmo CNPJ/CPF da nota. ADAPTA `meta` → `ResponsePagination` (grid) e
// expõe o cabeçalho/sugestões em `context` (mesmo adaptador de `listDfes`).
export interface ListDfeReturnCandidatesResult extends ResponsePagination<DfeReturnCandidate[]> {
  context: DfeReturnContext;
}

async function listDfeReturnCandidates(
  uuid: string,
  params: DfeReturnCandidatesParams
): Promise<ListDfeReturnCandidatesResult> {
  const { data } = await api.V2.get<DfeReturnCandidatesEnvelope>(
    `/dfes/${uuid}/return-candidates`,
    {
      page: params.page,
      per_page: params.per_page,
      date: params.date || undefined,
      search: params.search || undefined,
    }
  );

  const items = data.data.items;

  return {
    success: data.success,
    message: data.message,
    data: {
      items,
      pagination: {
        total: data.meta?.total ?? items.length,
        count: items.length,
        per_page: data.meta?.per_page ?? params.per_page ?? items.length,
        current_page: data.meta?.current_page ?? params.page ?? 1,
        total_pages: data.meta?.last_page ?? 1,
      },
    },
    context: { dfe: data.data.dfe, suggestions: data.data.suggestions },
  };
}

// ---- Downloads (binário puro, SEM envelope ApiResponse) --------------------

async function downloadDfeXml(uuid: string): Promise<Blob> {
  const { data } = await api.V2.get<Blob>(`/dfes/${uuid}/xml`, undefined, {
    responseType: 'blob',
  });
  return data;
}

async function generateDfeDanfe(uuid: string): Promise<Blob> {
  const { data } = await api.V2.get<Blob>(`/dfes/${uuid}/danfe`, undefined, {
    responseType: 'blob',
  });
  return data;
}

// ---- Relatório (síncrono, GAP-DFE-02 opção A) ------------------------------
// TODO GAP-DFE-02: se o dono decidir assíncrono (opção B/C), este endpoint
// passa a devolver 202 + uuid de job — trocar para o padrão de polling
// AsyncJob (`get_spa_api_client_pattern §4`, `refetchInterval` até
// `is_terminal`) sem reescrever o restante da tela de Relatório
// (TASK-DFE-FE-10). Enquanto síncrono, o binário volta direto neste GET.
async function listDfesForReport(params: DfeReportFilterForm): Promise<Blob> {
  const { data } = await api.V2.get<Blob>('/dfes-report', { ...params }, { responseType: 'blob' });
  return data;
}

export {
  downloadDfeXml,
  generateDfeDanfe,
  getDfeByUuid,
  getManifestEvents,
  listDfes,
  listDfeReturnCandidates,
  listDfesForReport,
  manifestDfes,
  syncDfe,
  toggleDfePersonal,
  toggleDfeShipment,
};
