// src/services/v2/Fiscal/xml-document-service.ts
// -----------------------------------------------------------------------------
// XmlDocument Service — API v1 do backend Laravel GB.Cerne ("Arquivos XML",
// F-133, Gestão Fiscal, esteira 97-Esteiras/008, Tarefa 36). Contrato:
// `spa-contract-arquivos-xml.md §3/§5.2` + `api-contract-arquivos-xml.md §2`.
// Mirror estrutural de `dfe-service.ts`/`financial-freeze-service.ts` (mesmo
// cabeçalho, mesma convenção de adaptador de resposta).
//
// Contrato (envelope ApiResponse): { success, message, data, errors, meta }.
//   GET  /xml-documents           → NÃO pagina, NÃO aceita orderBy/groupBy.
//                                   `data: { groups: [...] }` + `meta` com
//                                   totais quando os 5 filtros vieram;
//                                   `data: null` + `meta.query_executed:
//                                   false` (200, NUNCA 422) quando faltou
//                                   qualquer um dos 5. `listXmlDocuments`
//                                   ADAPTA os dois formatos num único
//                                   `XmlDocumentsListResult` — mesma
//                                   convenção de `listFinancialFreezes`/
//                                   `listDfes` (que adaptam `meta` →
//                                   `pagination`), mas SEM inventar
//                                   paginação onde a API não pagina (AD-09).
//   GET  /xml-documents/issuers   → data: XmlDocumentIssuerOption[], SEM
//                                   paginação (E2, AD-F09 — não confundir
//                                   com o `/issuers` do CRUD de Emissores).
//   POST /xml-documents/download  → binário application/zip no sucesso; JSON
//                                   (422) quando nenhum documento resolve
//                                   para arquivo — `responseType: 'blob'`
//                                   (AD-F07, a Tarefa 37 trata o 422-em-blob
//                                   no `onError` da mutation).
//   POST /xml-documents/send-email → 202, envelope JSON, `data: null`
//                                   ("enfileirado", nunca "enviado" — AD-F08).
//
// Só `listXmlDocuments`/`listXmlDocumentIssuers` são CONSUMIDOS nesta Tarefa
// (36); `downloadXmlDocumentsZip`/`sendXmlDocumentsEmail` nascem aqui para a
// Tarefa 37 (seleção + exportação), já com a assinatura fechada pelo
// contrato de API §2 (E3/E4) — sem invenção de shape.
//
// Rota dentro do grupo `auth:sanctum` — `X-Farm-Id` é anexado
// automaticamente pelo interceptor genérico de `@/services/api.ts`.
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { Response } from '@/@types/response-api';
import type {
  XmlDocumentExportPayload,
  XmlDocumentFilterQuery,
  XmlDocumentIssuerOption,
  XmlDocumentsListEnvelope,
  XmlDocumentsListResult,
} from '@/@types/v2/Fiscal/xml-document';

// Só os 6 params do contrato são encaminhados — nada de `page`/`per_page`/
// `orderBy`/`groupBy`/`filter` (a API não os aceita, armadilha confirmada).
async function listXmlDocuments(params: XmlDocumentFilterQuery): Promise<XmlDocumentsListResult> {
  const { data } = await api.V2.get<XmlDocumentsListEnvelope>('/xml-documents', {
    issue: params.issue,
    start_date: params.start_date,
    end_date: params.end_date,
    document: params.document,
    status: params.status,
    launched: params.launched ?? undefined,
  });

  // Adaptação envelope → view model: `data:null`+`query_executed:false` (200,
  // faltou algum dos 5 filtros — AD-F03) normaliza para `groups: []` sem
  // NUNCA ser tratado como erro/vazio pelo consumidor.
  return {
    queryExecuted: data.meta?.query_executed ?? false,
    groups: data.data?.groups ?? [],
    totalCount: data.meta?.total_count ?? 0,
    totalAmount: data.meta?.total_amount ?? 0,
  };
}

// Lookup PRÓPRIO desta tela (E2, AD-F09) — sem paginação, sem busca. `data`
// já vem no formato de `Option` (via `full_description`), consumido direto
// pelo `useXmlDocumentIssuers`.
async function listXmlDocumentIssuers(): Promise<XmlDocumentIssuerOption[]> {
  const { data } = await api.V2.get<Response<XmlDocumentIssuerOption[]>>('/xml-documents/issuers');
  return data.data;
}

// ---- Exportação (Tarefa 37 — seleção + baixar ZIP + enviar e-mail) --------

// Binário no sucesso, JSON (422) quando nenhum documento resolve para
// arquivo em disco — `responseType: 'blob'` (AD-F07, assinatura confirmada
// em `services/api.ts`, mesmo padrão de `dfe-service.ts::downloadDfeXml`).
async function downloadXmlDocumentsZip(payload: XmlDocumentExportPayload): Promise<Blob> {
  const { data } = await api.V2.post<Blob>('/xml-documents/download', payload, {
    responseType: 'blob',
  });
  return data;
}

// 202 Accepted, `data: null` — envio assíncrono (1 Job por contador
// vinculado); a resposta NÃO prova que algum e-mail saiu (AD-F08).
async function sendXmlDocumentsEmail(payload: XmlDocumentExportPayload): Promise<Response<null>> {
  const { data } = await api.V2.post<Response<null>>('/xml-documents/send-email', payload);
  return data;
}

export { downloadXmlDocumentsZip, listXmlDocumentIssuers, listXmlDocuments, sendXmlDocumentsEmail };
