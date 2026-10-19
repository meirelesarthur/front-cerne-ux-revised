// src/services/v2/Fiscal/nfe-service.ts
// -----------------------------------------------------------------------------
// Nfe Service — API v1 do backend Laravel GB.Cerne ("NFe Emitidas", domínio
// Fiscal). TASK-FE-036-401 (contrato-frontend-nfe-emitidas.md §2).
//
// Contrato (envelope ApiResponse): { success, message, data, errors, meta }.
//   GET    /nfes           → paginado; eager-load `client`/`nature` (SEM
//                             `items[]`/`departure_date`/`delivery_date` —
//                             `NfeListResource`, mirror `mode_matrix.index`).
//   GET    /nfes/{uuid}    → detalhe completo (`items[]` + bloco fiscal).
//   POST   /nfes           → cria cabeçalho+itens; quando `has_financial=true`,
//                             também cria os títulos financeiros reais
//                             (`Income`/`Expense` conforme `tipo`, TASK-BE-036-D2A/
//                             B/C) a partir de `financial_installments[]`/
//                             `financial_categories[]`/`financial_type_title_uuid`/
//                             `financial_proprietary_uuid` — bloco PROCESSADO de
//                             verdade (TASK-FE-036-D2-2 supera a warning-only
//                             `TASK-FE-036-D2`; `meta.warnings` não é mais
//                             emitido por este endpoint).
//   PUT    /nfes/{uuid}    → apaga e recria os itens integralmente (mirror
//                             legado, `mode_matrix.update.strategy`).
//   DELETE /nfes/{uuid}    → 204.
//
// Rota dentro de `farm.context` ESTRITO — `X-Farm-Id` é anexado
// automaticamente pelo interceptor genérico de `@/services/api.ts`.
//
// `listNfes` ADAPTA o envelope paginado do backend para o shape
// `ResponsePagination` que a infra de grid (useCustomGridQuery/TableProvider)
// consome — mesmo adaptador de `listInvoices`/`listWarehouses`.
//
// Sem endpoint de preview/simulação de totais — decisão de arquitetura do
// contrato de tela §2/§6.4 (fórmula duplicada no client, mirror `Invoices`).
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { PaginationQueryParams } from '@/@types/pagination';
import type { Response, ResponsePagination } from '@/@types/response-api';
import type {
  NfeDetail,
  NfeEmissionResult,
  NfeEmitPayload,
  NfeEventPayload,
  NfeIssuerOption,
  NfeListItem,
  NfePayload,
  NfesListEnvelope,
  NfeSefazConsultResult,
} from '@/@types/v2/Nfes';

export interface ListNfesParams extends PaginationQueryParams {
  client_id?: string;
  estado?: string;
  emission_from?: string;
  emission_to?: string;
  // Correção NFE-R2-002 (REAUDITORIA-036-2a-rodada.md) — `NfeIndexRequest`
  // real já aceita estes 5 filtros, mirror legado (`index.blade.php:41-76`).
  numero_nfe?: string;
  product_id?: string;
  issuer_id?: string;
  amount?: number;
  harvest_id?: string;
}

async function listNfes(params: ListNfesParams): Promise<ResponsePagination<NfeListItem[]>> {
  const { data } = await api.V2.get<NfesListEnvelope>('/nfes', {
    page: params.page,
    per_page: params.per_page,
    client_id: params.client_id || undefined,
    estado: params.estado || undefined,
    emission_from: params.emission_from || undefined,
    emission_to: params.emission_to || undefined,
    numero_nfe: params.numero_nfe || undefined,
    product_id: params.product_id || undefined,
    issuer_id: params.issuer_id || undefined,
    amount: params.amount ?? undefined,
    harvest_id: params.harvest_id || undefined,
  });

  // Adaptação envelope ApiResponse::paginated → ResponsePagination (grid) —
  // mesmo adaptador de listInvoices/listWarehouses (meta REAL, vem do
  // backend: current_page/last_page/per_page/total).
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

async function getNfe(nfeUuid: string) {
  const { data } = await api.V2.get<Response<NfeDetail>>(`/nfes/${nfeUuid}`);
  return data;
}

async function createNfe(payload: NfePayload) {
  const { data } = await api.V2.post<Response<NfeDetail>>('/nfes', payload);
  return data;
}

// PUT — payload SEMPRE completo (mirror `updateInvoice`); o backend apaga e
// recria os itens integralmente a cada update (§9 do contrato de API).
async function updateNfe(nfeUuid: string, payload: NfePayload) {
  const { data } = await api.V2.put<Response<NfeDetail>>(`/nfes/${nfeUuid}`, payload);
  return data;
}

async function deleteNfe(nfeUuid: string) {
  const { data } = await api.V2.delete(`/nfes/${nfeUuid}`);
  return data;
}

// -----------------------------------------------------------------------------
// Emissão/eventos SEFAZ — `NfeEmissionController` (TASK-BE-036-509), Controller
// NOVO e DISTINTO de `NfeController` (cadastro, acima). TASK-FE-036-510.
// -----------------------------------------------------------------------------

async function emitNfe(nfeUuid: string, payload: NfeEmitPayload) {
  const { data } = await api.V2.post<Response<NfeEmissionResult>>(`/nfes/${nfeUuid}/emit`, payload);
  return data;
}

async function cancelNfe(nfeUuid: string, payload: NfeEventPayload) {
  const { data } = await api.V2.post<Response<NfeEmissionResult>>(
    `/nfes/${nfeUuid}/cancel`,
    payload
  );
  return data;
}

async function correctNfe(nfeUuid: string, payload: NfeEventPayload) {
  const { data } = await api.V2.post<Response<NfeEmissionResult>>(
    `/nfes/${nfeUuid}/correct`,
    payload
  );
  return data;
}

// `consult` devolve um shape DISTINTO (`NfeSefazConsultResult`, confirmado
// por leitura direta de `NfeEmissionController::consult()`) — nunca
// `NfeEmissionResult`. Sem payload (route-model binding só pelo `{uuid}`).
async function consultNfe(nfeUuid: string) {
  const { data } = await api.V2.post<Response<NfeSefazConsultResult>>(`/nfes/${nfeUuid}/consult`);
  return data;
}

// -----------------------------------------------------------------------------
// Status de emissão — `NfeDocumentController::emissionStatus()`
// (GAP-FE-036-402, TASK-FE-036-511). Leitura PURA dos campos satélite JÁ
// PERSISTIDOS — nunca chama a SEFAZ. Hidrata a tela de Detalhe com o mesmo
// `NfeEmissionResource` de emit/cancel/correct, sem depender do usuário
// disparar uma ação para ver número/chave/recibo de novo após um F5.
// -----------------------------------------------------------------------------

async function getNfeEmissionStatus(nfeUuid: string) {
  const { data } = await api.V2.get<Response<NfeEmissionResult>>(
    `/nfes/${nfeUuid}/emission-status`
  );
  return data;
}

// -----------------------------------------------------------------------------
// Options de Emissor para a cascata Emissor→IE do `NfeEmitModal`
// (GAP-FE-036-516). Endpoint NOVO e DISTINTO de `GET /issuers` (CRUD,
// paginado, gated por `issue_view`) — sem paginação, gate `nfe_view`,
// farm-scoped, só emissores elegíveis p/ emissão. `state_registrations[]`
// vem EMBUTIDO em cada item (mirror `listBranchesByProvider`): a cascata
// deriva as opções de IE do próprio item selecionado desta lista, sem uma
// 2ª requisição por emissor.
// -----------------------------------------------------------------------------

async function getNfeIssuerOptions(): Promise<Response<NfeIssuerOption[]>> {
  const { data } = await api.V2.get<Response<NfeIssuerOption[]>>('/nfes/issuer-options');
  return data;
}

// -----------------------------------------------------------------------------
// Downloads de documento (binário puro, SEM envelope ApiResponse) —
// `NfeDocumentController` (TASK-FE-036-560/561/562), Controller NOVO e
// DISTINTO de `NfeController`/`NfeEmissionController` acima. Farm-scoped,
// permissão `nfe_view`. `xml`/`danfe` são o documento FINAL (só faz sentido
// depois de transmitido, `estado` aprovado/cancelado); `xml-preview`/
// `danfe-preview` são o rascunho ANTES/DEPOIS de uma rejeição (`estado`
// novo/rejeitado) — o caller decide qual par chamar pelo `estado` atual
// (mirror `downloadNfseXml`/`generateNfseDanfe`, mesmo padrão `responseType:
// 'blob'`).
// -----------------------------------------------------------------------------

async function downloadNfeXml(nfeUuid: string): Promise<Blob> {
  const { data } = await api.V2.get<Blob>(`/nfes/${nfeUuid}/xml`, undefined, {
    responseType: 'blob',
  });
  return data;
}

async function downloadNfeXmlPreview(nfeUuid: string): Promise<Blob> {
  const { data } = await api.V2.get<Blob>(`/nfes/${nfeUuid}/xml-preview`, undefined, {
    responseType: 'blob',
  });
  return data;
}

async function downloadNfeDanfe(nfeUuid: string): Promise<Blob> {
  const { data } = await api.V2.get<Blob>(`/nfes/${nfeUuid}/danfe`, undefined, {
    responseType: 'blob',
  });
  return data;
}

async function downloadNfeDanfePreview(nfeUuid: string): Promise<Blob> {
  const { data } = await api.V2.get<Blob>(`/nfes/${nfeUuid}/danfe-preview`, undefined, {
    responseType: 'blob',
  });
  return data;
}

// PDF de evento — só existe depois de Cancelar/Corrigir (CC-e) terem sido
// transmitidos com sucesso; o caller gateia pela combinação `estado`/
// `sequencia_evento` (ver `NfeEmissionPanel.tsx`).
async function downloadNfeCancellationPdf(nfeUuid: string): Promise<Blob> {
  const { data } = await api.V2.get<Blob>(`/nfes/${nfeUuid}/cancellation-pdf`, undefined, {
    responseType: 'blob',
  });
  return data;
}

async function downloadNfeCorrectionPdf(nfeUuid: string): Promise<Blob> {
  const { data } = await api.V2.get<Blob>(`/nfes/${nfeUuid}/correction-pdf`, undefined, {
    responseType: 'blob',
  });
  return data;
}

export {
  cancelNfe,
  consultNfe,
  correctNfe,
  createNfe,
  deleteNfe,
  downloadNfeCancellationPdf,
  downloadNfeCorrectionPdf,
  downloadNfeDanfe,
  downloadNfeDanfePreview,
  downloadNfeXml,
  downloadNfeXmlPreview,
  emitNfe,
  getNfe,
  getNfeEmissionStatus,
  getNfeIssuerOptions,
  listNfes,
  updateNfe,
};
