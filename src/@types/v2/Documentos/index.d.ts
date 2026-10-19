// src/@types/v2/Documentos/index.d.ts
// -----------------------------------------------------------------------------
// Tipos do módulo "Documentos" (DocumentManagement — Administrativo / Gestão
// Documentos). Módulo IRMÃO de `DocumentType` (mesmo grupo de menu), mas
// classe estrutural DIFERENTE: paginação REAL (`ApiResponse::paginated`), não
// árvore sem paginação. Reaproveita 100% a infraestrutura de anexo dinâmico
// já em produção por Equipment (`App\Models\Attachment`, mirror
// `@/@types/v2/Equipments`).
//
// Fonte: `01-Arquitetura_e_Contratos/Documentos-Frontend-Contrato.md` §2.2
// (`CONTRATO_APROVADO_PARA_TAREFAS`) + `Documentos-contrato.md` (backend).
//
// Tarefa 12 (fundação/listagem) declara o arquivo INTEIRO (permitido pelo
// task-packet, "para não fatiar o arquivo entre 2 Tarefas") — `DocumentManagementData`/
// `Payload`/`Form` só são CONSUMIDOS a partir da Tarefa 13 (formulário +
// anexos).
//
//   GET    /document-managements                    → data: DocumentManagementListItem[],
//                                                       meta com paginação REAL.
//   GET    /document-managements/{uuid}              → data: DocumentManagementData.
//   POST   /document-managements                     → multipart (DocumentManagementPayload,
//                                                       por causa de `attachments[].file`).
//   POST   /document-managements/{uuid} + _method=PUT → multipart via method-spoofing
//                                                       (mirror updateEquipment).
//   DELETE /document-managements/{uuid}               → Tarefa 12 (listagem).
//
// `uuid` sempre, nunca `id`. FKs expostas como `*_uuid`.
// -----------------------------------------------------------------------------

import type { Option } from '@/@types/option';

// ============================================
// REFS ANINHADOS
// ============================================

/** Mirror `EquipmentFamilyRef` (`{uuid, name}`) — FK relacional para Tipo de Documento. */
export interface DocumentManagementTypeRef {
  uuid: string;
  name: string;
}

/** Anexo dinâmico (mesma infraestrutura `App\Models\Attachment` de Equipment)
 *  — leitura. `file_url` pronto (front nunca monta a URL). */
export interface DocumentManagementAttachmentRow {
  uuid: string;
  name: string;
  file_url: string | null;
}

// ============================================
// DOCUMENT MANAGEMENT (resposta da API)
// ============================================

export interface DocumentManagementListItem {
  uuid: string;
  /** Gerado pelo servidor — sempre presente após a criação, nunca enviado no payload. */
  code: string;
  description: string;
  /** YYYY-MM-DD ou `null` (opcional). */
  validity: string | null;
  alert_days: number | null;
  document_type: DocumentManagementTypeRef | null;
}

/** `GET /document-managements/{uuid}` — acrescenta os campos que a listagem
 *  não precisa exibir, consumidos pelo formulário (Tarefa 13). */
export interface DocumentManagementData extends DocumentManagementListItem {
  observation: string | null;
  /** Sempre array, mesmo vazio. */
  attachments: DocumentManagementAttachmentRow[];
  created_at: string;
  updated_at: string;
}

// ============================================
// ENVELOPE PAGINADO (ApiResponse::paginated)
// ============================================

export interface DocumentManagementsApiPaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface DocumentManagementsListEnvelope {
  success: boolean;
  message: string;
  data: DocumentManagementListItem[];
  errors: Record<string, string[]> | null;
  meta: DocumentManagementsApiPaginationMeta | null;
}

// ============================================
// FILTRO (drawer da listagem — Tarefa 12)
// ============================================

/** Shape efetivamente PERSISTIDO em `paginatedQuery.filter`
 *  (`userPaginatedQuery<DocumentManagementFilterForm>`) — achatado, com o
 *  `document_type_label` companion para re-hidratar o `SelectAsyncPaginate`
 *  do drawer sem novo fetch ao reabrir (mirror `EquipmentFilterForm`). */
export interface DocumentManagementFilterForm {
  document_type_uuid?: string;
  /** DISPLAY-ONLY — nunca enviado à API, só re-hidrata o label do Select. */
  document_type_label?: string;
  start_date?: string;
  end_date?: string;
}

/** Shape achatado efetivamente enviado à querystring de `GET /document-managements`. */
export interface DocumentManagementFilterRequest {
  document_type_uuid?: string;
  start_date?: string;
  end_date?: string;
}

// ============================================
// REQUEST TYPES (create/update, Tarefa 13) — full payload, multipart (attachments)
// ============================================

/** Payload de escrita (store/update) — montado como `FormData` (multipart),
 *  full-resource (nunca um delta de `dirtyFields` — `DocumentManagementRequest`
 *  não distingue create/update), mirror `EquipmentPayload`/`buildEquipmentFormData`.
 *
 *  AUSENTE de propósito: `code` (somente-leitura, gerado pelo servidor). */
export interface DocumentManagementPayload {
  document_type_uuid: string;
  description: string;
  validity: string | null;
  alert_days: number | null;
  observation: string | null;
  /** `uuid` presente = mantido (possivelmente com `file` novo substituindo o
   *  antigo), `uuid` ausente/`null` = novo. Remoção = ausência do `uuid` no
   *  array — diff feito no backend, front nunca rastreia "removidos". */
  attachments: Array<{ uuid?: string | null; name: string; file?: File | null }>;
}

/** React Hook Form (mirror `EquipmentForm` — Select vira `Option<string>`). */
export interface DocumentManagementForm {
  document_type_uuid: Option<string> | null;
  description: string;
  validity: string | null;
  alert_days: number | null;
  observation: string | null;
  attachments: Array<{ uuid?: string | null; name: string; file?: File | null }>;
}

export type { Option };
