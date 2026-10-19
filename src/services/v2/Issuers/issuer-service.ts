// src/services/v2/Issuers/issuer-service.ts
// -----------------------------------------------------------------------------
// Issuer Service — API v1 do backend Laravel GB.Cerne (Emissores NFe,
// execução 023). Mirror estrutural de services/v2/PaymentTerms (CRUD) +
// services/v2/FamilyEquipments (multipart, para o certificado digital).
//
// Contrato (envelope ApiResponse): { success, message, data, errors, meta }.
//   GET    /issuers                    → data: IssuerListItem[] + meta REAL de
//                                         paginação (ApiResponse::paginated()).
//   GET    /issuers/{uuid}              → data: IssuerDetail.
//   POST   /issuers                     → payload IssuerPayload (create).
//   PUT    /issuers/{uuid}               → payload IssuerPayload — full-resource
//                                         (IssuerController::update() já mescla
//                                         com os valores atuais no servidor).
//   DELETE /issuers/{uuid}               → 204; 422 estruturado possível
//                                         (GAP-BE-052, ainda aguardando aprovação
//                                         no backend) — onError GENÉRICO do
//                                         useRequest já exibe a mensagem real.
//   GET/POST/DELETE /issuers/{uuid}/certificate → status / upload (multipart) /
//                                         remoção do certificado digital A1.
//
// `listIssuers` ADAPTA o envelope paginado real do backend para o shape
// `ResponsePagination` que a infra de grid do projeto (useCustomGridQuery/
// TableProvider) consome — mesmo adaptador de `listPaymentTerms`.
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { PaginationQueryParams } from '@/@types/pagination';
import type { Response, ResponsePagination } from '@/@types/response-api';
import type {
  IssuerCertificateInfo,
  IssuerCertificatePayload,
  IssuerDetail,
  IssuerFilterForm,
  IssuerListItem,
  IssuerPayload,
  IssuersListEnvelope,
} from '@/@types/v2/Issuers';
import type { NfeIssuerOption } from '@/@types/v2/Nfes';

// Params aceitos pela listagem — paginação real + `search`/`is_enabled`/
// `issues_nfe` (contrato §3.1/`IssuerIndexRequest`). SEM `ambiente`
// (GAP-FE-114 — o backend não valida esse filtro no índice).
export interface ListIssuersParams extends PaginationQueryParams, IssuerFilterForm {}

async function listIssuers(
  params: ListIssuersParams
): Promise<ResponsePagination<IssuerListItem[]>> {
  const { data } = await api.V2.get<IssuersListEnvelope>('/issuers', {
    page: params.page,
    per_page: params.per_page,
    search: params.search || undefined,
    is_enabled: params.is_enabled || undefined,
    issues_nfe: params.issues_nfe || undefined,
  });

  // Adaptação envelope ApiResponse::paginated → ResponsePagination (grid) —
  // lê `meta.total`/`per_page`/`current_page`/`last_page` REAIS, mesmo
  // adaptador de `listPaymentTerms`/`listFamilyEquipments`.
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

async function getIssuerByUuid(issuerUuid: string) {
  const { data } = await api.V2.get<Response<IssuerDetail>>(`/issuers/${issuerUuid}`);
  return data;
}

async function createIssuer(payload: IssuerPayload) {
  const { data } = await api.V2.post<Response<IssuerDetail>>('/issuers', payload);
  return data;
}

// UPDATE recebe o payload COMPLETO — o backend (IssuerController::update())
// já mescla com os valores atuais do registro para os campos omitidos, mas a
// tela deste projeto sempre envia o form inteiro (full-resource-replace),
// mesma convenção de PaymentTerm/FamilyEquipment.
async function updateIssuer(issuerUuid: string, payload: IssuerPayload) {
  const { data } = await api.V2.put<Response<IssuerDetail>>(`/issuers/${issuerUuid}`, payload);
  return data;
}

async function deleteIssuer(issuerUuid: string) {
  const { data } = await api.V2.delete(`/issuers/${issuerUuid}`);
  return data;
}

// ============================================
// CERTIFICADO DIGITAL (contrato §3.4/§8.2/§9) — write-only absoluto, NUNCA
// recebe/reenvia senha ou binário de volta.
// ============================================

// `data: null` quando o Emissor não tem certificado cadastrado (NÃO é erro —
// IssuerController::showCertificate() devolve success com data null nesse
// caso); `data: IssuerCertificateInfo` quando há certificado legível.
// Certificado corrompido/senha ilegível vira 422 (tratado pelo onError
// genérico do useRequest, nunca chega a este retorno de sucesso).
async function viewIssuerCertificate(issuerUuid: string) {
  const { data } = await api.V2.get<Response<IssuerCertificateInfo | null>>(
    `/issuers/${issuerUuid}/certificate`
  );
  return data;
}

function buildIssuerCertificateFormData(payload: IssuerCertificatePayload): FormData {
  const fd = new FormData();
  fd.append('arquivo', payload.arquivo);
  fd.append('senha_certificado', payload.senha_certificado);
  return fd;
}

async function storeIssuerCertificate(issuerUuid: string, payload: IssuerCertificatePayload) {
  const fd = buildIssuerCertificateFormData(payload);
  const { data } = await api.V2.post<Response<null>>(`/issuers/${issuerUuid}/certificate`, fd);
  return data;
}

async function deleteIssuerCertificate(issuerUuid: string) {
  const { data } = await api.V2.delete(`/issuers/${issuerUuid}/certificate`);
  return data;
}

// ============================================
// Lookup de Emissor PARA RELATÓRIO (PLANO-FIX AUDIT-FILTROS-RELATORIOS
// §2.7/§3 F-286/F-255) — `GET /issuers/report-options`, ROTA NOVA e
// DISTINTA de `/nfes/issuer-options` (emissão, força `issues_nfe=true`) e do
// index CRUD de Issuer (management vê todos). Escopo: tenant + `is_enabled`
// + elegibilidade por fazenda (pivot `farm_issue`), SEM `issues_nfe` — os
// dois relatórios (Faturamento/DFe) convergem no mesmo lookup. Reusa o shape
// `NfeIssuerOption` (mesmos campos `uuid`/`razao_social`/`nome_fantasia`).
async function getIssuerReportOptions(): Promise<Response<NfeIssuerOption[]>> {
  const { data } = await api.V2.get<Response<NfeIssuerOption[]>>('/issuers/report-options', {
    farm_scoped: true,
    is_enabled: true,
  });
  return data;
}

export {
  buildIssuerCertificateFormData,
  createIssuer,
  deleteIssuer,
  deleteIssuerCertificate,
  getIssuerByUuid,
  getIssuerReportOptions,
  listIssuers,
  storeIssuerCertificate,
  updateIssuer,
  viewIssuerCertificate,
};
