// src/services/v2/Document/document-service.ts
// -----------------------------------------------------------------------------
// Document Service — API v1 do backend Laravel GB.Cerne (Documentos Anexos,
// TASK-036-GB-04). Módulo COMPARTILHADO entre Contas a Receber e Contas a
// Pagar — TASK-FE-036-337, consumido pelo `DocumentPanel` (Tarefa 338) e pela
// integração de Contas a Receber (Tarefa 339). NÃO DUPLICAR: a fatia irmã de
// Contas a Pagar reusa este MESMO arquivo, nunca cria um
// `income-document-service.ts`/`expense-document-service.ts` próprio.
//
// Contrato (envelope ApiResponse: { success, message, data, errors, meta }):
//   GET    /{segment}/{titleUuid}/documents → data: DocumentListItem[], SEM
//          paginação (`meta: null` sempre).
//   POST   /{segment}/{titleUuid}/documents → multipart/form-data, campo do
//          arquivo é `file` (NÃO `anexo`) + `description` + `date` (opcional).
//   DELETE /{segment}/{titleUuid}/documents/{documentUuid} → 204 SEM CORPO.
//          Precisa dos DOIS uuids (título + documento) — diferente do
//          `cancelWriteOff` do módulo de Baixa (só o uuid da baixa).
//          Documento é COMPARTILHÁVEL entre títulos — este DELETE só faz
//          `detach()` do título corrente (ver `@types/v2/Document` para o
//          racional completo); o chamador NÃO deve tratar 204 como "arquivo
//          apagado para sempre".
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { Response } from '@/@types/response-api';
import type {
  DocumentListItem,
  DocumentPayload,
  DocumentSegment,
  DocumentsListEnvelope,
} from '@/@types/v2/Document';

// GET /{segment}/{titleUuid}/documents — lista TODOS os documentos anexados a
// este título (compartilhados ou não). Envelope `ApiResponse::success` (SEM
// paginação) — repassado cru, consumido por `useQuery` direto (mirror
// `listActiveWriteOffs`).
async function listDocuments(
  segment: DocumentSegment,
  titleUuid: string
): Promise<DocumentsListEnvelope> {
  const { data } = await api.V2.get<DocumentsListEnvelope>(`/${segment}/${titleUuid}/documents`);
  return data;
}

// POST /{segment}/{titleUuid}/documents — envia 1 documento novo. `FormData`
// (multipart/form-data) — o cliente HTTP (`api.V2`) repassa o payload direto
// ao `axios.post`, que detecta `FormData` e monta o `Content-Type` com
// boundary automaticamente (mirror `parseInvoiceXml`,
// `InvoiceXmlUploadModal.tsx` — mesmo precedente do projeto, sem config extra
// de header necessária). Campo do arquivo é `file` — NUNCA `anexo` (nome real
// da Form Request confirmado na Tarefa 337).
async function uploadDocument(
  segment: DocumentSegment,
  titleUuid: string,
  payload: DocumentPayload
): Promise<Response<DocumentListItem>> {
  const formData = new FormData();
  formData.append('file', payload.file);
  formData.append('description', payload.description);
  if (payload.date) formData.append('date', payload.date);

  const { data } = await api.V2.post<Response<DocumentListItem>>(
    `/${segment}/${titleUuid}/documents`,
    formData
  );
  return data;
}

// DELETE /{segment}/{titleUuid}/documents/{documentUuid} — desanexa o
// documento DESTE título (`detach()` do pivot). SEM CORPO na resposta (204).
// Precisa dos 3 parâmetros — NÃO simplificar para 2 como foi possível no
// `cancelWriteOff` do módulo de Baixa (lá o cancelamento é segmento-agnóstico
// por uuid único da baixa; aqui o documento é identificado pela combinação
// título+documento).
async function deleteDocument(
  segment: DocumentSegment,
  titleUuid: string,
  documentUuid: string
): Promise<void> {
  await api.V2.delete(`/${segment}/${titleUuid}/documents/${documentUuid}`);
}

export { deleteDocument, listDocuments, uploadDocument };
