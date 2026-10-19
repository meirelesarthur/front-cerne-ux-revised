// src/services/v2/DocumentTypes/document-type-service.ts
// -----------------------------------------------------------------------------
// Document Type Service — API v1 do backend Laravel GB.Cerne (Tipo Documento —
// Administrativo / Gestão Documentos). Mesma classe estrutural de
// `AccountingGrouper` (nested-set, `code` gerado no servidor, sem paginação
// real) — ver `accounting-grouper-service.ts`.
//
// Contrato (envelope ApiResponse): { success, message, data, errors, meta }.
//   GET    /document-types           → SEM paginação — array COMPLETO, já
//                                       ordenado por `code`
//                                       (`ListDocumentTypesAction`). SEM
//                                       parâmetro de busca — diferente de
//                                       `AccountingGrouper` (que aceita
//                                       `search`); `DocumentTypeRepositoryInterface::listAll()`
//                                       só aceita `tenantId`. NÃO adicionar
//                                       `search` à chamada — o filtro desta
//                                       Tarefa é 100% CLIENT-SIDE
//                                       (ver `useDocumentTypes.tsx`).
//   DELETE /document-types/{uuid}     → 204; SEM 422 estruturado confirmado
//                                       para exclusão bloqueada (`DA-DT-05`/
//                                       `GAP-DT-05` só prometem `BusinessRuleException`
//                                       com `message` simples) — tratado com
//                                       fallback genérico no `onError` da
//                                       mutação (index.tsx), SEM diálogo
//                                       dedicado tipo `AccountingGrouperInUseDialog`
//                                       nesta rodada.
//
// Nota sobre `X-Farm-Id`: `DocumentType` é tenant_id-only (sem `farm_id` na
// migration, DA-DT-02) — o header continua anexado automaticamente pelo
// interceptor axios global, mas o backend o ignora (mesmo comportamento de
// `AccountingGrouper`/`Harvest`). Nenhuma ação especial necessária aqui.
//
// TASK-DT-FE-02 completa este arquivo com detalhe/create/update/lookup do
// Antecessor:
//   GET  /document-types/{uuid}    → show() — mesmo Resource do index()
//   POST /document-types           → store() — `parent_uuid` OMITIDO (não
//                                     `null`) quando raiz sem pai escolhido
//   PUT  /document-types/{uuid}    → update() — `parent_uuid` É processado
//                                     (diferente de `AccountingGrouper`,
//                                     `GAP-DT-02`) — reparenting válido,
//                                     `code` não é recalculado
//   GET  /document-types/options   → lookup dedicado do "Antecessor",
//                                     `?except=<uuid>` já resolve exclusão de
//                                     subárvore NO SERVIDOR (`GAP-DT-03`) —
//                                     sem filtro client-side de ciclo (
//                                     diferente de `listAccountingGroupersForParent`,
//                                     que precisa filtrar o próprio nó no
//                                     cliente por falta de endpoint dedicado).
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { Response } from '@/@types/response-api';
import type {
  DocumentTypeDetail,
  DocumentTypeListItem,
  DocumentTypeOption,
  DocumentTypePayload,
  DocumentTypesListEnvelope,
} from '@/@types/v2/DocumentTypes';

// SEM paginação, SEM parâmetro de busca — a API devolve o array COMPLETO, já
// ordenado por `code`. Filtro é aplicado DEPOIS, no componente, sobre `data`
// (ver "Diferenças reais" da TASK-DT-FE-01).
async function listDocumentTypes(): Promise<DocumentTypeListItem[]> {
  const { data } = await api.V2.get<DocumentTypesListEnvelope>('/document-types');
  return data.data;
}

async function deleteDocumentType(uuid: string) {
  const { data } = await api.V2.delete(`/document-types/${uuid}`);
  return data;
}

async function getDocumentType(uuid: string) {
  const { data } = await api.V2.get<Response<DocumentTypeDetail>>(`/document-types/${uuid}`);
  return data;
}

// `parent_uuid` OMITIDO (não enviado) quando o payload não o define — cabe ao
// chamador (CreateOrUpdateDocumentType.tsx) decidir se a chave entra ou não
// (raiz sem pai = chave ausente, nunca `null`).
async function createDocumentType(payload: DocumentTypePayload) {
  const { data } = await api.V2.post<Response<DocumentTypeDetail>>('/document-types', payload);
  return data;
}

// Verbo `PUT` (contrato de API registra PUT/PATCH via `apiResource`; `PUT`
// por consistência com `updateAccountingGrouper`). `parent_uuid` É processado
// pelo backend neste verbo (diferente de `AccountingGrouper`, `GAP-DT-02`) —
// o chamador inclui a chave só quando `dirtyFields.parent_uuid` (PATCH
// parcial disciplinado).
async function updateDocumentType(uuid: string, payload: DocumentTypePayload) {
  const { data } = await api.V2.put<Response<DocumentTypeDetail>>(
    `/document-types/${uuid}`,
    payload
  );
  return data;
}

// Lookup dedicado do Antecessor — SEM paginação/search reais no backend
// (`DocumentTypeRepositoryInterface::listOptions(tenantId, exceptUuid)` só
// aceita `except`). `except` = uuid do próprio nó em edição (o servidor
// exclui a subárvore inteira, `GAP-DT-03`) — ausente em modo criação (raiz ou
// descendente).
async function listDocumentTypeOptions(params: { except?: string }): Promise<DocumentTypeOption[]> {
  const { data } = await api.V2.get<Response<DocumentTypeOption[]>>('/document-types/options', {
    except: params.except || undefined,
  });
  return data.data;
}

export {
  createDocumentType,
  deleteDocumentType,
  getDocumentType,
  listDocumentTypeOptions,
  listDocumentTypes,
  updateDocumentType,
};
