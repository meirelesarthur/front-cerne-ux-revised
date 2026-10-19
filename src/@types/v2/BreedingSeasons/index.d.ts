// src/@types/v2/BreedingSeasons/index.d.ts
// -----------------------------------------------------------------------------
// Tipos do módulo "Estação de Monta" (BreedingSeason — Operacional /
// Reprodução). CRUD completo (Tarefas 12/13, 97-Esteiras/003). Fonte:
// `01-Arquitetura_e_Contratos/spa-contract-estacao-de-monta.md` §7 +
// `api-contract-estacao-de-monta.md` §8, mirror estrutural de
// `@/@types/v2/Absences` (mesmo envelope paginado real).
//
// `BreedingSeasonListItem` (índice) NÃO tem `days`/`weeks` — só
// `BreedingSeasonDetail` (show/store/update) os tem, computados no SERVIDOR
// (fonte única, `GAP-EM-05` do backend). O formulário calcula sua PRÓPRIA
// prévia client-side (nunca lê esses campos do Resource, nunca os envia no
// payload — ver `BreedingSeasonPayload` abaixo).
// -----------------------------------------------------------------------------

// ============================================
// BREEDING SEASON (resposta da API)
// ============================================

export interface BreedingSeasonListItem {
  uuid: string;
  code: string;
  /** 'YYYY-MM-DD' — data de cadastro. */
  date: string;
  /** 'YYYY-MM-DD'. */
  start_date: string;
  /** 'YYYY-MM-DD'. */
  end_date: string;
  description: string;
  /** `employee?.name ?? user?.name`, já resolvido pelo backend — string
   *  pronta, nunca objeto de relação. */
  responsible_name: string;
}

// `BreedingSeasonResource` (show/store/update) — mesmos campos do índice +
// `days`/`weeks` (computados no servidor, `GAP-EM-05`) + timestamps. NUNCA
// usar `days`/`weeks` daqui no formulário de criação/edição — só no Detalhe
// (read-only, fonte única no servidor).
export interface BreedingSeasonDetail extends BreedingSeasonListItem {
  days: number;
  weeks: number;
  created_at: string;
  updated_at: string;
}

// ============================================
// ENVELOPE PAGINADO (ApiResponse::paginated)
// ============================================

export interface BreedingSeasonsApiPaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface BreedingSeasonsListEnvelope {
  success: boolean;
  message: string;
  data: BreedingSeasonListItem[];
  errors: Record<string, string[]> | null;
  meta: BreedingSeasonsApiPaginationMeta | null;
}

// ============================================
// OPTIONS (`GET /breeding-seasons/user-options`) — resposta PLANA (sem
// paginação, sem `meta`) — NUNCA `SelectAsyncPaginate`, sempre `Select` +
// `useQuery` (mirror `listProprietaryOptions`).
// ============================================

export interface UserOption {
  uuid: string;
  name: string;
}

// ============================================
// REQUEST TYPES (payload wire-level — BreedingSeasonData/BreedingSeasonRequest)
// ============================================

// Payload real enviado à API (POST/PUT) — NUNCA `user_id`/`user_uuid`/
// `employee_id`/`farm_id`/`days`/`weeks` (contrato de tela §5.4, §8).
export interface BreedingSeasonPayload {
  code: string;
  /** 'YYYY-MM-DD'. */
  date: string;
  description: string;
  /** 'YYYY-MM-DD'. */
  start_date: string;
  /** 'YYYY-MM-DD'. */
  end_date: string;
}

// ============================================
// REACT HOOK FORM (create/edit, Tarefa 13)
// ============================================

export interface BreedingSeasonForm {
  code: string;
  date: string;
  description: string;
  start_date: string | null;
  end_date: string | null;
}

// ============================================
// FILTRO (drawer da listagem, Tarefa 12)
// ============================================

export interface BreedingSeasonFilterForm {
  user_uuid?: string;
}
