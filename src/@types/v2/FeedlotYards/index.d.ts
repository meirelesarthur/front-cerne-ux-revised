// src/@types/v2/FeedlotYards/index.d.ts
// -----------------------------------------------------------------------------
// Tipos do módulo OPERACIONAL — Pátio (FeedlotYard) — API v1 do backend
// Laravel GB.Cerne. Fonte: leitura direta de `FeedlotYardResource.php`/
// `FeedlotYardRequest.php`/`FeedlotYardFilterData.php`/
// `DestroyFeedlotYardAction.php` (TASK-PT-02/03/04, camada `api` desta
// execução 046) — ver `07-Tarefas_Frontend/FeedlotYard-contrato-tela.md §2`.
//
//   GET    /feedlot-yards          → paginado (ApiResponse::paginated, meta REAL)
//   POST   /feedlot-yards          → 201, feedlot-yards_create
//   GET    /feedlot-yards/{uuid}   → detalhe completo
//   PUT/PATCH /feedlot-yards/{uuid} → 200, feedlot-yards_edit
//   DELETE /feedlot-yards/{uuid}   → 204; 422 (message simples, sem
//                                    `errors.in_use[]`) se houver setores
//                                    vinculados (`BusinessRuleException`)
//
// `code`/`priority`/`area` são SEMPRE só-leitura — nunca entram em nenhum
// payload de escrita (`FeedlotYardData::from()` não os declara; `area` nem
// é persistida, é `round(width*length, 2)` calculada em runtime pelo
// Resource). `priority` (rótulo "Ordem", `CLM-17`) só é EXIBIDO na tela de
// Detalhe — nunca na listagem nem no formulário (grep de fidelidade do
// Tester cobre esta regra).
// -----------------------------------------------------------------------------

import type { Option } from '@/@types/option';

// ============================================
// FEEDLOT YARD (resposta da API — FeedlotYardResource)
// ============================================

export interface FeedlotYardListItem {
  uuid: string;
  /** Sequencial gerado no servidor — SÓ LEITURA, nunca um `<Input>`. */
  code: string;
  name: string;
  /** Exposto pela API mas NÃO exibido na listagem/formulário — só no Detalhe (rótulo "Ordem"). */
  priority: number;
  width: number | null;
  length: number | null;
  /** `round(width*length, 2)` calculada em RUNTIME pelo backend — SÓ LEITURA, nunca no payload. `null` se `width`/`length` forem `null`. */
  area: number | null;
  observation: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/** `show`/`store`/`update` devolvem o mesmo shape de `index` — sem subcadastro aninhado. */
export type FeedlotYardDetail = FeedlotYardListItem;

// ============================================
// ENVELOPE PAGINADO (ApiResponse::paginated)
// ============================================

export interface FeedlotYardsApiPaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface FeedlotYardsListEnvelope {
  success: boolean;
  message: string;
  data: FeedlotYardListItem[];
  errors: Record<string, string[]> | null;
  meta: FeedlotYardsApiPaginationMeta | null;
}

// ============================================
// REQUEST TYPES (FeedlotYardRequest::rules()) — `code`/`priority`/`area`/
// `farm_id` NUNCA entram aqui (o DTO `FeedlotYardData` não os declara).
// ============================================

export interface CreateFeedlotYardRequest {
  name: string;
  width: number;
  length: number;
  is_active: boolean;
  observation?: string;
}

export interface UpdateFeedlotYardRequest {
  name?: string;
  width?: number;
  length?: number;
  is_active?: boolean;
  observation?: string;
}

// ============================================
// REACT HOOK FORM (TASK-PT-FE-02)
// ============================================

export interface FeedlotYardForm {
  name: string;
  /** `string` durante a digitação no `NumberInput`, `number` no submit (`Number(...)`). */
  width: number | string;
  length: number | string;
  is_active: Option<boolean>;
  observation: string;
}

// ============================================
// FILTRO (drawer da listagem — FeedlotYardFilterData)
// ============================================

export interface FeedlotYardFilterForm {
  code?: string;
  name?: string;
  is_active?: Option<boolean>;
}

export interface FeedlotYardFilterRequest {
  code?: string;
  name?: string;
  is_active?: boolean;
}
