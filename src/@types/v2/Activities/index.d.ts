// src/@types/v2/Activities/index.d.ts
// -----------------------------------------------------------------------------
// Tipos do módulo de ATIVIDADES (Activity) — API v1 do backend Laravel
// GB.Cerne. Criado em TASK-FE-025 (fundação de dados: types + service + hooks,
// sem UI — telas em TASK-FE-026/027).
//
// Contrato (envelope ApiResponse { success, message, data, errors, meta }),
// fonte: `01-Arquitetura_e_Contratos/Activity/Activity-contrato.md` §9/§10/§13
// (TASK-BE-048 implementa o CRUD real em `/api/v1/activities`):
//   GET    /activities             → data: ActivityListItem[] + meta REAL de
//                                     paginação (ApiResponse::paginated(),
//                                     current_page/last_page/per_page/total —
//                                     mesmo padrão de TypeTitle, NÃO o truque
//                                     `meta:null` de DiagnosticTechnique/Species).
//   GET    /activities/{uuid}      → data: ActivityData (mesmo shape flat).
//   POST   /activities             → payload ActivityPayload (create).
//   PUT    /activities/{uuid}      → payload ActivityPayload.
//   DELETE /activities/{uuid}      → 204; pode retornar erro de negócio (FK em
//                                     uso, ex. activity_cost_centers) — o
//                                     `onError` genérico do `useRequest` exibe
//                                     a `message` do envelope, mesmo tratamento
//                                     de TypeTitles/Warehouse.
//
// `type`/`use` são ENUMS de STRING (slug) no backend (ActivityType/ActivityUse,
// Rule::in nos 2), nunca int. `type_label`/`use_label` vêm PRONTOS do
// ActivityResource — não recriar o mapeamento Custeio/Investimento/Á Definir
// ou Ambos/Agricultura/Fruticultura/Pecuária de Corte no client.
//
// `Activity` é escopada por TENANT (não Farm) — compartilhada entre todas as
// Farms do mesmo Tenant (Activity-contrato.md §4/D1). O interceptor axios
// global ainda anexa `X-Farm-Id` automaticamente quando há fazenda ativa; o
// backend resolve o tenant a partir do FarmContext já populado por
// `ResolveFarmContextOptional` — nenhum header extra é necessário aqui.
// -----------------------------------------------------------------------------

// ============================================
// ENUMS (slugs — contrato de API, Activity-contrato.md §7/D4)
// ============================================

export type ActivityTypeSlug = 'custeio' | 'investimento' | 'a_definir';

export type ActivityUseSlug = 'ambos' | 'agricultura' | 'fruticultura' | 'pecuaria_corte';

// ============================================
// RELAÇÃO COM Operation (módulo irmão AINDA NÃO MIGRADO no backend)
// ============================================
// `Operation` continua 100% legado (`App\Operation`, sem `uuid`) — a pivô
// `operation_activities` referencia `operations.id` (bigint interno), NÃO
// `uuid`. Isto é a ÚNICA exceção do módulo Activity ao padrão uuid-first do
// resto do projeto (Activity-contrato.md §13, "Nota para o front").
//
// Trocar para `operation_uuid: string` quando `Operation` migrar — até lá o
// front trata como número puro, sem tentar validar/formatar como GUID.
export interface ActivityOperationRef {
  id: number;
  name: string;
}

// ============================================
// ACTIVITY (resposta da API)
// ============================================

export interface ActivityListItem {
  uuid: string;
  name: string;
  description: string | null;
  is_enabled: boolean;
  /** JSON number puro — nunca string formatada pt-BR (isso era só do Blade legado). */
  vl_hectare: number;
  type: ActivityTypeSlug;
  /** Rótulo pronto do Resource — "Custeio" | "Investimento" | "Á Definir". */
  type_label: string;
  use: ActivityUseSlug;
  /** Rótulo pronto do Resource — "Ambos" | "Agricultura" | "Fruticultura" | "Pecuária de Corte". */
  use_label: string;
  operations: ActivityOperationRef[];
}

// GET /activities/{uuid} devolve o mesmo Resource do index(), sem campos
// extras só-de-detalhe (mesmo shape flat).
export interface ActivityData extends ActivityListItem {
  uuid: string;
}

// ============================================
// ENVELOPE PAGINADO (ApiResponse::paginated — REAL)
// ============================================

export interface ActivitiesListEnvelope {
  success: boolean;
  message: string;
  data: ActivityListItem[];
  errors: Record<string, string[]> | null;
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  } | null;
}

// ============================================
// REQUEST TYPES
// ============================================

export interface ActivityPayload {
  name: string;
  description?: string | null;
  is_enabled: boolean;
  vl_hectare: number;
  type: ActivityTypeSlug;
  use: ActivityUseSlug;
  /** ids numéricos de Operation — ver nota em ActivityOperationRef acima. */
  operations?: number[];
}

// ============================================
// REACT HOOK FORM
// ============================================

export interface ActivityForm {
  uuid?: string;
  name: string;
  description?: string;
  is_enabled: boolean;
  vl_hectare: number;
  type: ActivityTypeSlug | '';
  use: ActivityUseSlug | '';
  operations: number[];
}

// ============================================
// FILTRO (drawer da listagem)
// ============================================
// `search` vira o param `search` do backend (ILIKE em `name`). `is_enabled`
// vai como STRING crua na querystring (mesma convenção de outros módulos) —
// o backend (ActivityFilterData, Spatie Data) coage. `operation_id` filtra
// por Activities que possuem aquela Operation associada (id numérico).

export interface ActivityFilterForm {
  search?: string;
  type?: ActivityTypeSlug;
  use?: ActivityUseSlug;
  is_enabled?: 'true' | 'false';
  operation_id?: number;
}
