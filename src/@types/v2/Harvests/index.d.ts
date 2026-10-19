// src/@types/v2/Harvests/index.d.ts
// -----------------------------------------------------------------------------
// Tipos do módulo de SAFRAS (Harvest) — API v1 do backend Laravel GB.Cerne.
//
// Contratos (envelope ApiResponse { success, message, data, errors, meta }):
//   GET    /harvests                       → data: Harvest[] + meta (paginação REAL — per_page honrado, default 15)
//   GET    /harvests/{uuid}                → data: Harvest (MESMO shape do index — index e show fazem with(['weeks','periods']))
//   POST   /harvests                       → payload HarvestPayload
//   PUT    /harvests/{uuid}                → payload HarvestPayload
//   DELETE /harvests/{uuid}                → 204 (hard delete transacional; 422 de negócio se referenciada)
//   GET    /harvests/active                → data: Harvest[] sem paginação (só is_enabled=true COM semana) — popula selects em outros módulos
//   GET    /harvests/{uuid}/weeks/current   → data: WeekVintage (404 é resultado esperado quando nenhuma semana cobre a data)
//
// Tenant-scoped SEM farm_id (contrato DA-H-02 — safra compartilhada por todas
// as farms do tenant); o header X-Farm-Id continua obrigatório mesmo assim —
// é ele que resolve o tenant via farm.context/ResolveFarmContext.
//
// Fonte: HarvestRequest/HarvestData/HarvestResource/WeekVintageResource/
// HarvestRepository/HarvestHerdControl do `GB.Cerne.Api` batidos linha a linha
// nesta rodada de planejamento (TASK-FE-006). NÃO usar `safras.types.ts` do
// design system como fonte de tipo — diverge em `herd_control` (3 valores no
// mock vs 2 reais) e em `auto_evolution` (real: boolean; mock: Select).
// -----------------------------------------------------------------------------

// ============================================
// ENUM
// ============================================

/** Enum real do backend (HarvestHerdControl.php) — SÓ 2 valores. */
export type HarvestHerdControl = 'individual' | 'lote';

// ============================================
// HARVEST (resposta da API)
// ============================================

export interface WeekVintage {
  uuid: string;
  number_week: number;
  start_date: string; // YYYY-MM-DD
  end_date: string; // YYYY-MM-DD
  /**
   * Backend aceita qualquer string ≤20 chars (HarvestRequest:
   * 'weeks.*.color' => required|string|max:20 — SEM enum server-side). O
   * fechamento em paleta de 9 cores nomeadas é decisão do FRONT (ver
   * TASK-FE-009/safra-weeks.ts), não uma regra do backend.
   */
  color: string;
}

export interface HarvestPeriodRef {
  uuid: string;
  name: string;
  start_date: string;
  end_date: string;
}

export interface Harvest {
  uuid: string;
  description: string;
  start_date: string;
  end_date: string;
  is_enabled: boolean;
  herd_control: HarvestHerdControl;
  /** Vem pronto do backend (Enum::label()). */
  herd_control_label: string;
  /** 1-12; DEFAULT no banco = 5 (Maio). */
  first_month: number | null;
  /** 1-12; DEFAULT no banco = 9 (Setembro). */
  second_month: number | null;
  /** DEFAULT no banco = false. */
  auto_evolution: boolean;
  weeks: WeekVintage[];
  /**
   * v1: nunca populado a partir de escolha do usuário — sem endpoint
   * `/periods` no `routes/api.php` para popular um seletor no front (ver
   * nota "periods fora do escopo v1" em harvest-service.ts).
   */
  periods: HarvestPeriodRef[];
  created_at: string;
  updated_at: string;
}

// index e show retornam o MESMO shape — HarvestRepository::listWithFilters e
// ::findByUuidOrFail fazem with(['weeks', 'periods']) os dois (diferente de
// CostCenters, cujo index só eager-load `parent`). Por isso, sem split
// ListItem/Detail aqui — aliases só por paridade de nomenclatura com o resto
// do projeto.
export type HarvestListItem = Harvest;
export type HarvestDetail = Harvest;

// ============================================
// ENVELOPE PAGINADO (ApiResponse::paginated)
// ============================================

export interface HarvestsApiPaginationMeta {
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

export interface HarvestsListEnvelope {
  success: boolean;
  message: string;
  data: Harvest[];
  errors: Record<string, string[]> | null;
  meta: HarvestsApiPaginationMeta | null;
}

// ============================================
// REQUEST TYPES
// ============================================

export interface WeekVintagePayload {
  number_week: number;
  start_date: string;
  end_date: string;
  color: string;
}

export interface HarvestPayload {
  description: string;
  start_date: string;
  end_date: string;
  is_enabled: boolean;
  herd_control: HarvestHerdControl;
  first_month?: number;
  second_month?: number;
  auto_evolution?: boolean;
  /** required, min 1, item a item (number_week/start_date/end_date/color). */
  weeks: WeekVintagePayload[];
  // `periods` NUNCA enviado no v1 — ver nota em harvest-service.ts.
}

// ============================================
// REACT HOOK FORM (TASK-FE-008/009 — formulário de cadastro/edição)
// ============================================

export interface HarvestForm {
  uuid?: string;
  description: string;
  start_date: string;
  end_date: string;
  is_enabled: boolean;
  herd_control: HarvestHerdControl;
  first_month: number | null;
  second_month: number | null;
  auto_evolution: boolean;
  /**
   * useFieldArray (TASK-FE-009); upsert no backend é por `number_week`
   * (DA-H-07), NÃO por uuid — por isso o form não precisa guardar uuid de
   * semana.
   */
  weeks: WeekVintagePayload[];
}

// ============================================
// FILTRO (drawer da listagem)
// ============================================

export interface HarvestFilterForm {
  /** Busca por descrição (param `search` do backend, ILIKE). */
  search?: string;
  is_enabled?: '' | 'true' | 'false';
  // SEM filtro de herd_control/type — HarvestFilterData só aceita search + is_enabled + per_page.
}
