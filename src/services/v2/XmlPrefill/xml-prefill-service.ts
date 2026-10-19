// src/services/v2/XmlPrefill/xml-prefill-service.ts
// -----------------------------------------------------------------------------
// XML Prefill Service — API v1 do backend Laravel GB.Cerne, módulo
// COMPARTILHADO de import/download de XML — esteira 036, Onda 3 sub-onda 3f
// (B-05), TASK-FE-036-340. Consumido tanto por Contas a Pagar (Expense,
// `segment='expenses'`) quanto por Contas a Receber (Income,
// `segment='incomes'`) — mesmo racional de `services/v2/ImportExport/
// import-export-service.ts` (parametrizado por segmento, NÃO duplicado por
// módulo).
//
// Mirror direto de `parseInvoiceXml`/`downloadInvoiceXml`
// (`services/v2/Invoices/invoice-service.ts`, TASK-FE-628/DF-03 — já em
// produção para Nota de Entrada), generalizado para os 2 segmentos que NUNCA
// tiveram esse fluxo na SPA (confirmado pela Doc Bruta B-05, seção G).
//
// Contrato (leitura direta do backend já commitado):
//   POST /{segment}/xml                    → multipart, campo `file`
//        (`required, file, mimes:xml,txt, max:10240` = 10MB, mirror
//        `parseInvoiceXml`). Permissão `{expenses|incomes}_create`. Resposta
//        200 (nada persistido) — envelope `Response<ExpenseXmlDraft |
//        IncomeXmlDraft>` (shape resolvido pelo `segment` via overload,
//        zero type-cast do lado do caller).
//   GET  /{segment}/{uuid}/download-xml    → binário do XML definitivo, SEM
//        o envelope `ApiResponse` (mirror `downloadInvoiceXml`,
//        `responseType: 'blob'`); 403/404 conforme permissão/tenant/ausência
//        de `xml_key` ("XML não encontrado.").
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { Response } from '@/@types/response-api';
import type { ExpenseXmlDraft, IncomeXmlDraft, XmlPrefillSegment } from '@/@types/v2/XmlPrefill';

// Overloads por segmento literal — o caller (`XmlPrefillModal`, Tarefa 341)
// recebe o draft já tipado a partir do `segment` passado, sem `as`/type-cast
// manual. Nenhuma suposição de shape idêntico entre os 2 drafts (cada um
// mantém seus próprios campos extras).
async function parseXml(segment: 'expenses', file: File): Promise<Response<ExpenseXmlDraft>>;
async function parseXml(segment: 'incomes', file: File): Promise<Response<IncomeXmlDraft>>;
async function parseXml(
  segment: XmlPrefillSegment,
  file: File
): Promise<Response<ExpenseXmlDraft | IncomeXmlDraft>> {
  const fd = new FormData();
  fd.append('file', file);
  const { data } = await api.V2.post<Response<ExpenseXmlDraft | IncomeXmlDraft>>(
    `/${segment}/xml`,
    fd
  );
  return data;
}

// GET /{segment}/{uuid}/download-xml — download puro, NÃO desembrulha
// `ApiResponse` (este endpoint não usa esse envelope), mirror
// `downloadInvoiceXml`/`downloadImportTemplate` (`import-export-service.ts`).
async function downloadXml(segment: XmlPrefillSegment, titleUuid: string): Promise<Blob> {
  const { data } = await api.V2.get<Blob>(`/${segment}/${titleUuid}/download-xml`, undefined, {
    responseType: 'blob',
  });
  return data;
}

export { downloadXml, parseXml };
