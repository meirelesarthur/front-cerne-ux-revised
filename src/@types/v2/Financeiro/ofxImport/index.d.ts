// src/@types/v2/Financeiro/ofxImport/index.d.ts
// -----------------------------------------------------------------------------
// Tipos do módulo "Importação OFX" (OfxImport — Financeiro, F-114,
// 97-Esteiras/064, TASK-064-OFX-FE-01). Mirror estrutural de
// `@types/v2/Movements/index.d.ts` (mesmo domínio Financeiro,
// `financial.context` estrito, sem `farm_id` próprio — tenant-only) e
// `@types/v2/CadastrosBase/account/index.d.ts` (shape de listagem/paginação).
//
// Fonte de verdade: `arquitetura-ofx-db-api.md §6` (Model/DTO/Request) +
// `OfxImportResource::toArray()` (api_root, leitura direta) +
// `arquitetura-ofx-frontend.md §6` (camadas do front).
//
// `account_id` (GAP-OFX-FE-01): o backend exige `account_id` (PK interna,
// integer) no create/update — o front só tem `account.uuid` (nunca `id`,
// `AccountResource` nunca expõe). `CreateOfxImportForm`/`UpdateOfxImportPayload`
// abaixo usam `account_uuid` (o valor real disponível no SPA); o submit
// FALHA (422) até o Gap ser corrigido pela API — ver
// `CORE_WORKSPACE/04-Gaps_Frontend_UI/GAP-OFX-FE-01-*.md`. Não é mock: é o
// payload semanticamente correto do ponto de vista do front, aguardando a
// API aceitar `account_uuid` em vez de `account_id`.
// -----------------------------------------------------------------------------

import { Option } from '@/@types/option';

// ============================================
// OFX IMPORT — LISTAGEM (mirror `OfxImportResource`, sem `attachments` —
// `OfxImportRepository::listPaginated()` só eager-loada `account`, NUNCA
// `attachments`, arquitetura-ofx-db-api.md §6).
// ============================================

export interface OfxImportAccountSummary {
  uuid: string;
  code: string; // TASK-065-OFX-FE-04 — `OfxImportResource` (backend) agora expõe `account.code`.
  description: string;
  bank: string;
}

export interface OfxImportAttachment {
  uuid: string;
  name: string;
}

export interface OfxImportListItem {
  uuid: string;
  code: string;
  description: string;
  account: OfxImportAccountSummary | null;
  start_date: string; // ISO date "YYYY-MM-DD" (Model::casts, Resource `->toDateString()`)
  end_date: string;
  created_at: string;
  updated_at: string;
}

// ============================================
// OFX IMPORT — DETALHE (`GET /ofx-imports/{uuid}` — `findByUuidOrFail()`
// eager-loada `account` E `attachments`, mirror `OfxImportResource`).
// ============================================

export interface OfxImportDetail extends OfxImportListItem {
  attachments: OfxImportAttachment[];
}

// ============================================
// FORM (RHF, `CreateOrUpdateOfxImport.tsx`) — Decisão F1 (form único
// create/edit/view) + Decisão F2 (SEM `code` em modo criação — o campo só
// existe em modo edição/visualização, populado pela resposta do GET,
// NUNCA calculado/previsto no front).
// ============================================

export interface OfxImportForm {
  description: string;
  account_uuid: Option<string> | null;
  start_date: string; // ISO "YYYY-MM-DD", <DateInput> controlado
  end_date: string;
  /** Novo arquivo `.ofx` selecionado nesta sessão — obrigatório só na
   *  criação (Yup `.when(mode)`); na edição, ausente preserva o anexo
   *  atual (SE-02, `UpdateOfxImportAction` não reprocessa parse). */
  ofx_file: File | null;
}

// ============================================
// PAYLOAD DE ESCRITA — multipart (mirror `CreateOfxImportRequest`/
// `UpdateOfxImportRequest` do backend, `arquitetura-ofx-db-api.md §6`).
// `account_uuid` (GAP-OFX-FE-01, ver cabeçalho do arquivo) — NÃO é
// `account_id`: o backend exige `account_id` (int) hoje; o front envia o
// valor real que tem disponível, aguardando a resolução do Gap.
// ============================================

export interface CreateOfxImportPayload {
  description: string;
  account_uuid: string;
  start_date: string;
  end_date: string;
  ofx_file: File;
}

export interface UpdateOfxImportPayload {
  description: string;
  account_uuid: string;
  start_date: string;
  end_date: string;
  /** Omitido (não multipart) quando nenhum arquivo novo foi selecionado —
   *  preserva o anexo atual (SE-02). */
  ofx_file?: File;
}

// ============================================
// FILTRO (Hub, Decisão F3 — `ListToolbar`/busca textual do protótipo UX +
// `FilterSide` aditivo, Contrato B). Mirror `MovementFilterForm` (campos
// persistidos com `*_label` companion para re-hidratação do drawer, nunca
// enviados à API).
// ============================================

export interface OfxImportFilterForm {
  description?: string;
  account_uuid?: string;
  account_label?: string;
  start_date?: string;
  end_date?: string;
}

// ============================================
// QUERY PARAMS (`GET /ofx-imports` — mirror `OfxImportIndexRequest`).
// ============================================

export interface ListOfxImportsParams {
  page?: number;
  per_page?: number;
  description?: string;
  account_uuid?: string;
  start_date?: string;
  end_date?: string;
}

// ============================================
// ENVELOPE (`ApiResponse::paginated`) — meta REAL, mirror
// `MovementsListEnvelope`/`AccountsListEnvelope`.
// ============================================

export interface OfxImportsApiPaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number | null;
  to: number | null;
}

export interface OfxImportsListEnvelope {
  success: boolean;
  message: string;
  data: OfxImportListItem[];
  errors: Record<string, string[]> | null;
  meta: OfxImportsApiPaginationMeta | null;
}
