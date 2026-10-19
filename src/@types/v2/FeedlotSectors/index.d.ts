// src/@types/v2/FeedlotSectors/index.d.ts
// -----------------------------------------------------------------------------
// Tipos do módulo OPERACIONAL — Setor (FeedlotSector) — API v1 do backend
// Laravel GB.Cerne. Fonte: leitura direta de `FeedlotSectorResource.php`/
// `FeedlotSectorRequest.php`/`FeedlotSectorFilterData.php`/
// `DestroyFeedlotSectorAction.php` (TASK-FS-01/02/03) — ver
// `07-Tarefas_Frontend/FeedlotSector-contrato-tela.md §2`.
//
//   GET    /feedlot-sectors          → paginado (ApiResponse::paginated, meta REAL)
//   POST   /feedlot-sectors          → 201, feedlot-sectors_create
//   GET    /feedlot-sectors/{uuid}   → detalhe completo
//   PUT/PATCH /feedlot-sectors/{uuid} → 200, feedlot-sectors_edit
//   DELETE /feedlot-sectors/{uuid}   → 204; 422 (message simples) se houver
//                                      currais/componentes vinculados
//                                      (`BusinessRuleException`)
//
// `code`/`priority`/`area`/`farm_id` são SEMPRE só-leitura — nunca entram em
// nenhum payload de escrita (`FeedlotSectorData::from()` não os declara;
// `area` nem é persistida, é `round(width*length, 2)` calculada em runtime
// pelo Resource). `priority` (rótulo "Ordem") só é EXIBIDO na tela de
// Detalhe — nunca na listagem nem no formulário (grep de fidelidade do
// Tester cobre esta regra). `feedlot_yard_uuid` é IMUTÁVEL em edição
// (`prohibited` no PUT/PATCH, `DA-FS-06`) — `UpdateFeedlotSectorRequest`
// nunca a declara.
// -----------------------------------------------------------------------------

import type { Option } from '@/@types/option';

// ============================================
// FEEDLOT SECTOR (resposta da API — FeedlotSectorResource)
// ============================================

export interface FeedlotSectorListItem {
  uuid: string;
  /** Sequencial gerado no servidor — SÓ LEITURA, nunca um `<Input>`. */
  code: string;
  name: string;
  /** FK aninhada (`with('feedlotYard')` no Repository) — SÓ LEITURA, ler `feedlot_yard.name` direto, sem round-trip extra. */
  feedlot_yard: {
    uuid: string;
    name: string;
  };
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
export type FeedlotSectorDetail = FeedlotSectorListItem;

// ============================================
// ENVELOPE PAGINADO (ApiResponse::paginated)
// ============================================

export interface FeedlotSectorsApiPaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface FeedlotSectorsListEnvelope {
  success: boolean;
  message: string;
  data: FeedlotSectorListItem[];
  errors: Record<string, string[]> | null;
  meta: FeedlotSectorsApiPaginationMeta | null;
}

// ============================================
// REQUEST TYPES (FeedlotSectorRequest::rules()) — `code`/`priority`/`area`/
// `farm_id` NUNCA entram aqui (o DTO `FeedlotSectorData` não os declara).
// `feedlot_yard_uuid`: `required` SÓ no POST; `prohibited` no PUT/PATCH
// (imutável, `DA-FS-06`) — por isso ausente de `UpdateFeedlotSectorRequest`.
// ============================================

export interface CreateFeedlotSectorRequest {
  name: string;
  feedlot_yard_uuid: string;
  width: number;
  length: number;
  is_active: boolean;
  observation?: string;
}

export interface UpdateFeedlotSectorRequest {
  // feedlot_yard_uuid NUNCA aparece aqui — imutável (DA-FS-06).
  name?: string;
  width?: number;
  length?: number;
  is_active?: boolean;
  observation?: string;
}

// ============================================
// REACT HOOK FORM (TASK-FS-FE-02)
// ============================================

export interface FeedlotSectorForm {
  name: string;
  /** Desabilitado (`isReadOnly`) em edição, mas presente no form state — nunca refeito via rede nesse modo. */
  feedlot_yard_uuid: Option<string> | null;
  /** `string` durante a digitação no `NumberInput`, `number` no submit (`Number(...)`). */
  width: number | string;
  length: number | string;
  is_active: Option<boolean>;
  observation: string;
}

// ============================================
// FILTRO (drawer da listagem — FeedlotSectorFilterData)
// ============================================

export interface FeedlotSectorFilterForm {
  code?: string;
  name?: string;
  feedlot_yard_id?: Option<string>;
  is_active?: Option<boolean>;
}

export interface FeedlotSectorFilterRequest {
  code?: string;
  name?: string;
  feedlot_yard_id?: string;
  is_active?: boolean;
}
