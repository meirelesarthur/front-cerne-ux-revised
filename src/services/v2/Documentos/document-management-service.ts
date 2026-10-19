// src/services/v2/Documentos/document-management-service.ts
// -----------------------------------------------------------------------------
// Document Management Service — API v1 do backend Laravel GB.Cerne
// (Administrativo / Gestão Documentos — módulo "Documentos"). Contrato:
// Documentos-Frontend-Contrato.md §2.3 (`CONTRATO_APROVADO_PARA_TAREFAS`) +
// Documentos-contrato.md (backend, APROVADO) §3.5.
//
//   GET    /document-managements                    → listDocumentManagements(params) —
//                                                       adapta o envelope paginado para
//                                                       `ResponsePagination` (mirror
//                                                       `listEquipments`), TODOS os filtros
//                                                       (`document_type_uuid`/`start_date`/
//                                                       `end_date`/`page`/`per_page`) repassados
//                                                       explicitamente na querystring
//                                                       (armadilha ERRO-FE-016).
//   GET    /document-managements/{uuid}              → getDocumentManagement(uuid) (Tarefa 13).
//   POST   /document-managements                     → createDocumentManagement(payload) —
//                                                       multipart, `buildDocumentManagementFormData`
//                                                       (mirror `buildEquipmentFormData`,
//                                                       Tarefa 13).
//   POST   /document-managements/{uuid} + _method=PUT → updateDocumentManagement(uuid, payload) —
//                                                       method-spoofing (mirror `updateEquipment`,
//                                                       PUT nativo não é confiável com multipart,
//                                                       Tarefa 13).
//   DELETE /document-managements/{uuid}               → deleteDocumentManagement(uuid) (Tarefa 12,
//                                                       consumido pela listagem).
//
// Lookup de Tipo de Documento (filtro + form) REAPROVEITA
// `listDocumentTypeOptions` de `@/services/v2/DocumentTypes/document-type-service.ts`
// — SEM duplicar endpoint (ver GAP-DOCUMENTOS-FE-02 para o risco residual de
// gate em perfil só-`_view`, tratado no consumidor com degradação graciosa).
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { PaginationQueryParams } from '@/@types/pagination';
import type { Response, ResponsePagination } from '@/@types/response-api';
import type {
  DocumentManagementData,
  DocumentManagementFilterRequest,
  DocumentManagementListItem,
  DocumentManagementPayload,
  DocumentManagementsListEnvelope,
} from '@/@types/v2/Documentos';

export interface ListDocumentManagementsParams
  extends PaginationQueryParams, DocumentManagementFilterRequest {}

async function listDocumentManagements(
  params: ListDocumentManagementsParams
): Promise<ResponsePagination<DocumentManagementListItem[]>> {
  const { data } = await api.V2.get<DocumentManagementsListEnvelope>('/document-managements', {
    page: params.page,
    per_page: params.per_page,
    document_type_uuid: params.document_type_uuid || undefined,
    start_date: params.start_date || undefined,
    end_date: params.end_date || undefined,
  });

  // Adaptação envelope ApiResponse::paginated → ResponsePagination (grid) —
  // idêntico a `listEquipments`/`listMeasurements` (meta REAL, não fallback fake).
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

async function getDocumentManagement(uuid: string) {
  const { data } = await api.V2.get<Response<DocumentManagementData>>(
    `/document-managements/${uuid}`
  );
  return data;
}

// buildDocumentManagementFormData — monta o FormData COMPLETO (full-resource,
// nunca um delta de dirtyFields) — mirror `buildEquipmentFormData`. `attachments`
// é serializado com a notação de índice `campo[i][chave]`, convenção padrão do
// Laravel para parsear arrays de objetos vindos de multipart/form-data.
function buildDocumentManagementFormData(payload: DocumentManagementPayload): FormData {
  const fd = new FormData();

  fd.append('document_type_uuid', payload.document_type_uuid);
  fd.append('description', payload.description);
  if (payload.validity) fd.append('validity', payload.validity);
  if (payload.alert_days !== null && payload.alert_days !== undefined) {
    fd.append('alert_days', String(payload.alert_days));
  }
  if (payload.observation) fd.append('observation', payload.observation);

  payload.attachments.forEach((row, index) => {
    if (row.uuid) fd.append(`attachments[${index}][uuid]`, row.uuid);
    fd.append(`attachments[${index}][name]`, row.name);
    if (row.file) fd.append(`attachments[${index}][file]`, row.file);
  });

  return fd;
}

async function createDocumentManagement(payload: DocumentManagementPayload) {
  const fd = buildDocumentManagementFormData(payload);
  const { data } = await api.V2.post<Response<DocumentManagementData>>('/document-managements', fd);
  return data;
}

// ⚠️ Mirror `updateEquipment` (PUT nativo + multipart não é parseado de forma
// confiável pelo Laravel). Envia como POST + `_method=PUT` dentro do próprio
// FormData (method spoofing padrão do Laravel) — NUNCA `api.V2.put(...)` aqui.
async function updateDocumentManagement(uuid: string, payload: DocumentManagementPayload) {
  const fd = buildDocumentManagementFormData(payload);
  fd.append('_method', 'PUT');
  const { data } = await api.V2.post<Response<DocumentManagementData>>(
    `/document-managements/${uuid}`,
    fd
  );
  return data;
}

async function deleteDocumentManagement(uuid: string) {
  const { data } = await api.V2.delete(`/document-managements/${uuid}`);
  return data;
}

export {
  buildDocumentManagementFormData,
  createDocumentManagement,
  deleteDocumentManagement,
  getDocumentManagement,
  listDocumentManagements,
  updateDocumentManagement,
};
