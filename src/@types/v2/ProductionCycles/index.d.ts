// src/@types/v2/ProductionCycles/index.d.ts
// -----------------------------------------------------------------------------
// Tipos do módulo de CICLO DE PRODUÇÃO (ProductionCycle) — API v1 do backend
// Laravel GB.Cerne. TASK-FE-01 (97-Esteiras/033) — fundação de dados (LEITURA).
//
// Contratos (envelope ApiResponse { success, message, data, errors, meta }):
//   GET    /production-cycles              → data: ProductionCycle[] + meta (paginação real)
//                                             with([harvest,user,employee,culture,center]) — SEM areas
//   GET    /production-cycles/{uuid}       → data: ProductionCycle (com([...,areas]))
//   POST   /production-cycles              → payload ProductionCyclePayload (FE-02)
//   PUT    /production-cycles/{uuid}       → payload ProductionCyclePayload (FE-02)
//   DELETE /production-cycles/{uuid}       → 204 soft delete
//
// L2 (FID-G3F §2.3): `date`, `start_date`, `end_date` são 3 campos DISTINTOS —
// corrige o bug legado C49 (mesma `date` renderizada nos 2 rótulos de
// período). NUNCA colapsar um no outro.
//
// Fonte: FID-G3F-frontend-ciclo-producao.md §2.3/§2.4 (ProductionCycleResource/
// ProductionCycleRequest reais, batidos contra a API ✅). Mirror estrutural de
// `@types/v2/Harvests` (index e show retornam shapes distintos aqui — index
// NÃO eager-carrega `areas`, só o show).
// -----------------------------------------------------------------------------

// ============================================
// RELAÇÕES (whenLoaded — sempre {uuid,...})
// ============================================

export interface ProductionCycleHarvestRef {
  uuid: string;
  description: string;
}

export interface ProductionCycleCultureRef {
  uuid: string;
  name: string;
}

export interface ProductionCycleCenterRef {
  uuid: string;
  description: string;
}

export interface ProductionCyclePersonRef {
  uuid: string;
  name: string;
}

export interface ProductionCycleAreaRef {
  uuid: string;
  description: string;
}

// ============================================
// PRODUCTION CYCLE (resposta da API)
// ============================================

export interface ProductionCycle {
  uuid: string;
  /** Server-generated (MAX+1 zero-pad), nunca enviado no payload. */
  code: string;
  /** 'YYYY-MM-DD' — campo DISTINTO de start_date/end_date (L2). */
  date: string;
  /** 'YYYY-MM-DD' — campo DISTINTO de date/end_date (L2). */
  start_date: string;
  /** 'YYYY-MM-DD' — campo DISTINTO de date/start_date (L2, corrige bug legado C49). */
  end_date: string;
  description: string;
  harvest?: ProductionCycleHarvestRef;
  /** Relação 'culture' (Cultivation) — nome do campo no Resource, NÃO 'cultivation'. */
  culture?: ProductionCycleCultureRef;
  /** Centro de Custo ANALÍTICO (L4). */
  center?: ProductionCycleCenterRef;
  /** Nullable — quando ausente, "Responsável" cai em `user`. */
  employee: ProductionCyclePersonRef | null;
  /** Criador, server-derived (R7) — NUNCA enviado no payload. */
  user: ProductionCyclePersonRef | null;
  /** Só populado no `show` (index NÃO eager-carrega areas). */
  areas?: ProductionCycleAreaRef[];
  created_at: string;
  updated_at: string;
}

// index e show divergem em eager-load (`areas` só no show) — sem split de
// nome por ora: `areas` opcional cobre os dois casos (mirror do racional já
// documentado em Harvests, adaptado à divergência real desta entidade).
export type ProductionCycleListItem = ProductionCycle;
export type ProductionCycleDetail = ProductionCycle;

// ============================================
// ENVELOPE PAGINADO (ApiResponse::paginated)
// ============================================

export interface ProductionCyclesApiPaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number | null;
  to: number | null;
  links: {
    first: string | null;
    prev: string | null;
    next: string | null;
    last: string | null;
  };
}

export interface ProductionCyclesListEnvelope {
  success: boolean;
  message: string;
  data: ProductionCycle[];
  errors: Record<string, string[]> | null;
  meta: ProductionCyclesApiPaginationMeta | null;
}

// ============================================
// REQUEST TYPES (payload wire-level — ProductionCycleRequest)
// ============================================

export interface ProductionCyclePayload {
  date: string;
  start_date: string;
  end_date: string;
  harvest_uuid: string;
  /** Nome do campo no payload é `cultivation_uuid` (relação exposta como 'culture'). */
  cultivation_uuid: string;
  /** Centro de Custo ANALÍTICO (L4). */
  center_uuid: string;
  description: string;
  /** min 1 — uuid[] das áreas selecionadas. */
  areas: string[];
  /** nullable — omitir quando vazio, nunca enviar string vazia/null literal. */
  employee_uuid?: string | null;
  // NUNCA no payload: farm_id (R4), code (R5), user_id (R7) — derivados no servidor.
}

// ============================================
// REACT HOOK FORM (FE-02 — formulário de cadastro/edição)
// ============================================

export interface ProductionCycleForm {
  uuid?: string;
  date: string;
  start_date: string;
  end_date: string;
  harvest_uuid: string;
  cultivation_uuid: string;
  center_uuid: string;
  description: string;
  areas: string[];
  employee_uuid: string | null;
}

// ============================================
// FILTRO (drawer da listagem — Contrato B, se/quando materializado)
// ============================================

export interface ProductionCycleFilterForm {
  harvest_uuid?: string;
  /** Filtra pelo criador (`user`, server-derived) — NÃO confundir com `employee_uuid`. */
  user_uuid?: string;
  start_date?: string;
  end_date?: string;
}
