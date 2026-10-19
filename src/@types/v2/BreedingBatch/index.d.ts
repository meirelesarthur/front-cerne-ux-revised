// src/@types/v2/BreedingBatch/index.d.ts
// -----------------------------------------------------------------------------
// Tipos do módulo "Lotes/Reprodução" (BreedingBatch — Operacional / Reprodução,
// 97-Esteiras/048, Tarefas 04/05/06/07). Mirror estrutural de
// `@/@types/v2/BreedingSeasons`/`@/@types/v2/BullSeedSeason` (mesmo submódulo,
// mesmo envelope paginado real `ApiResponse::paginated`).
//
// `BreedingBatchListItem` (índice) NÃO tem `breeding_season`/`batches` — só
// `BreedingBatchDetail` (show/store/update) os tem (mirror
// `BreedingBatchListResource`, que evita N+1 na listagem — contrato de API
// §7). `farm_id`/`tenant_id`/`user_id` NUNCA aparecem em interface de
// formulário/payload (contrato de tela §3 — nunca são decisão de UI,
// injetados pelo backend/header).
// -----------------------------------------------------------------------------

import type { Option } from '@/@types/option';

// ============================================
// LOOKUPS (options planas — resposta PLANA, sem paginação/meta)
// ============================================

export interface BreedingSeasonOptionRef {
  uuid: string;
  code: string;
  description: string;
}

export interface BatchOptionRef {
  uuid: string;
  code: string;
  description: string;
}

// ============================================
// BREEDING BATCH (resposta da API)
// ============================================

export interface BreedingBatchListItem {
  uuid: string;
  code: string;
  /** 'YYYY-MM-DD'. */
  date: string;
  description: string;
  /** `employee?.name ?? user?.name`, já resolvido pelo backend — string
   *  pronta, nunca objeto de relação. Pode ser `null` em registros legados
   *  sem `user_id` (contrato de tela §3 — sem fallback para o usuário da
   *  sessão atual, achado #6). */
  responsible_name: string | null;
  created_at: string;
  updated_at: string;
}

// `BreedingBatchResource` (show/store/update) — mesmos campos do índice +
// `breeding_season`/`batches` (só existem aqui, contrato de API §7).
export interface BreedingBatchDetail extends BreedingBatchListItem {
  breeding_season: BreedingSeasonOptionRef;
  batches: BatchOptionRef[];
}

// ============================================
// ENVELOPE PAGINADO (ApiResponse::paginated)
// ============================================

export interface BreedingBatchApiPaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface BreedingBatchesListEnvelope {
  success: boolean;
  message: string;
  data: BreedingBatchListItem[];
  errors: Record<string, string[]> | null;
  meta: BreedingBatchApiPaginationMeta | null;
}

// ============================================
// FILTRO (drawer da listagem, Tarefa 05)
// ============================================

export interface BreedingBatchFilterForm {
  start_date?: string;
  end_date?: string;
}

export interface BreedingBatchFilterRequest {
  start_date?: string;
  end_date?: string;
}

// ============================================
// REACT HOOK FORM (create/edit, Tarefa 06)
// ============================================

// Linha do subcadastro `batches[]` — shape de `useFieldArray`
// (`BatchesFieldArray.tsx`, contrato de tela §5.1).
export interface BreedingBatchBatchFieldValue {
  batch: Option<string> | null;
}

export interface BreedingBatchForm {
  code: string;
  /** 'YYYY-MM-DD'. */
  date: string;
  description: string;
  breeding_season: Option<string> | null;
  batches: BreedingBatchBatchFieldValue[];
}

// ============================================
// REQUEST TYPES (payload wire-level — BreedingBatchData/BreedingBatchRequest)
// ============================================

// Payload real enviado à API (POST/PUT) — NUNCA `user_id`/`farm_id`/
// `tenant_id` (contrato de tela §3/§5, contrato de API §5). `batch_uuids`
// sempre o array INTEIRO desejado (o backend faz `sync()`, nunca um delta).
export interface BreedingBatchPayload {
  code: string;
  /** 'YYYY-MM-DD'. */
  date: string;
  description: string;
  breeding_season_uuid: string;
  batch_uuids: string[];
}

// ============================================
// `check-date` (IG-03/IG-04, contrato de API §7/§5)
// ============================================

export interface BatchCheckDateResponse {
  valid: boolean;
  message?: string;
}
