// src/@types/v2/AdvancedReproductive/index.d.ts
// -----------------------------------------------------------------------------
// Tipos do módulo "Gerenciamento Avançado" (AdvancedReproductive — Operacional
// / Reprodução, F-011, 97-Esteiras/056, TASK-AR-FE-01). Tela greenfield
// 100% LEITURA (sem CreateOrUpdate) — mirror estrutural de
// `@/@types/v2/BreedingBatch`/`@/@types/v2/BullSeedSeason` no que se aplica
// (mesmo envelope real `ApiResponse::paginated`), mas SEM os blocos de
// formulário/payload de escrita (não existem nesta feature).
//
// Contrato de API consumido (TASK-AR-01/02, roteiro-cirurgico-advanced-
// reproductive.md §3, já fechado — não redesenhado aqui):
//   GET /api/v1/advanced-reproductive                          (paginado + indicators)
//   GET /api/v1/advanced-reproductive/protocol-season-options  (plano, sem paginação)
// -----------------------------------------------------------------------------

// ============================================
// ENUM — reproductive_status (Animal::statusOptions, fiel ao legado)
// ============================================

/** 1=Prenha, 2=Vazia, 3=Parida (mirror `AnimalReproductiveStatus`, enum próprio
 *  desta feature — a listagem/filtro consomem o mesmo domínio de valores, mas
 *  o contrato de API desta tela não reexporta o tipo de `@/@types/v2/Animals`). */
export type ReproductiveStatus = 1 | 2 | 3;

// ============================================
// LOOKUP — protocol-season-options (resposta PLANA, sem paginação/meta)
// ============================================

export interface ProtocolSeasonOption {
  uuid: string;
  description: string;
}

// ============================================
// AÇÕES CONDICIONAIS POR LINHA (actions.can_*)
// -----------------------------------------------------------------------------
// Cada `can_*` já combina permissão do usuário autenticado E condição de
// dado (CL-20..25), calculado 100% no servidor (`AdvancedReproductiveResource`,
// roteiro de API §3.3). A SPA só CONSOME os booleanos — NUNCA recalcula a
// regra em JS (DEC-005, mesmo princípio de `CostCenterListItem.can_edit`).
// Nesta entrega, TODAS as 7 ações renderizam desabilitadas com tooltip
// quando `true` (FUP-AR-05/06 — nenhum dos 7 alvos existe como tela na SPA
// ainda) — decisão de UI da TASK-AR-FE-02, não desta camada.
// ============================================

export interface AdvancedReproductiveActions {
  can_view_animal_record: boolean;
  can_view_breeding_mating: boolean;
  can_edit_breeding_mating: boolean;
  can_advance_protocol_step: boolean;
  can_finish_breeding_mating: boolean;
  can_view_pregnancy_diagnosis: boolean;
  can_delete_breeding_mating: boolean;
}

// ============================================
// ADVANCED REPRODUCTIVE (item de linha da listagem)
// ============================================

export interface AdvancedReproductiveListItem {
  animal_uuid: string;
  identification: string;
  category_description: string;
  /** Label já formatado pelo backend (Natural/IATF/FIV) — consumido direto,
   *  SEM mapper/enum no front (não é campo de filtro, contrato de tela §2). */
  breeding_mating_type_label: string;
  /** Label já formatado pelo backend — consumido direto, SEM mapper no front. */
  last_update_label: string;
  /** Label já formatado pelo backend (Prenha/Vazia/Parida) — consumido
   *  direto na coluna. O ENUM `ReproductiveStatus` acima é usado só no
   *  campo de FILTRO (`reproductive_status`), nunca para reformatar esta
   *  string. */
  reproductive_status_label: string;
  actions: AdvancedReproductiveActions;
  /** Alvo de navegação futura (`breeding-matings.*`) — a feature ainda não
   *  existe na SPA nova (FUP-AR-05, não bloqueia esta entrega). */
  breeding_mating_uuid: string;
}

// ============================================
// INDICADORES (meta.indicators — MESMO envelope da listagem, extensão
// documentada, NUNCA uma segunda chamada de rede)
// ============================================

export interface AdvancedReproductiveIndicators {
  animals_count: number;
  /** Número puro (ex.: 12.34) — a formatação BR (vírgula) é responsabilidade
   *  exclusiva da SPA na apresentação (roteiro de API §3.1, decisão do
   *  Arquiteto de API). NUNCA consumir como string pré-formatada. */
  pregnancy_rate: number;
  birth_animals_count: number;
}

// ============================================
// FILTRO — 6 campos, ORDEM EXATA do contrato (decisões-maestro §"Fidelidade")
// ============================================

export interface AdvancedReproductiveFilterForm {
  search?: string;
  reproductive_status?: ReproductiveStatus;
  /** uuid */
  breeding_batch_id?: string;
  /** uuid */
  breeding_season_id?: string;
  /** uuid */
  protocol_id?: string;
  /** uuid */
  bull_seed_season_id?: string;
}

// ============================================
// ENVELOPE PAGINADO REAL (ApiResponse::paginated) — shape recebido do backend
// ============================================

export interface AdvancedReproductiveApiPaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  /** Extensão documentada do meta padrão de paginação (roteiro de API §3.1) —
   *  viaja no MESMO payload da listagem, nunca uma segunda chamada. */
  indicators: AdvancedReproductiveIndicators;
}

export interface AdvancedReproductiveListEnvelope {
  success: boolean;
  message: string;
  data: AdvancedReproductiveListItem[];
  errors: Record<string, string[]> | null;
  meta: AdvancedReproductiveApiPaginationMeta | null;
}
