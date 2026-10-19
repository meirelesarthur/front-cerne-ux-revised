// src/@types/v2/Bonuses/index.d.ts
// -----------------------------------------------------------------------------
// Tipos do módulo de REGISTRO DE EVENTOS (Bonus) — API v1 do backend Laravel
// GB.Cerne. Esteira 037 (registro-eventos-front-roteiro.md, TASK-FE-01).
// Mirror de `@types/v2/Advances/index.d.ts`, SEM os blocos `installments`/
// `financial` (fora do contrato real de Bonus — `BonusRepository::list()` é
// `Bonus::query()->paginate(10)`, sem parcelas/dimensão financeira).
//
// Contratos (envelope ApiResponse { success, message, data, errors, meta }):
//   GET    /bonuses              → data: Bonus[] + meta (paginação real, SEM filtro)
//   GET    /bonuses/{uuid}       → data: Bonus
//   POST   /bonuses              → payload BonusPayload (201)
//   PUT    /bonuses/{uuid}       → payload BonusPayload — FULL REPLACE, os 4
//                                   campos núcleo são `required` em AMBOS os
//                                   verbos (`BonusRequest::rules()` não
//                                   distingue store/update, FE-FORM-MODE)
//   DELETE /bonuses/{uuid}       → 204 No Content puro (sem soft delete visível)
//
// Fonte: registro-eventos-front-roteiro.md §"Contrato real" + BonusController/
// BonusRequest/BonusResource/BonusData/Bonus/BonusRepository reais
// (feature/refactor-bonuses-for-api).
//
// `amount` chega como STRING (cast `decimal:2` no Model, exposto como float
// pelo Resource, mas alguns paths retornam string) — sempre `Number(...)`
// antes de formatar/popular o form (mesma nota já registrada em `Advance`).
// -----------------------------------------------------------------------------

// ============================================
// RELAÇÕES (whenLoaded — sempre {uuid,...})
// ============================================

export interface BonusEmployeeRef {
  uuid: string;
  name: string | null;
}

export interface BonusEventRef {
  uuid: string;
  name: string;
}

// ============================================
// BONUS (resposta da API)
// ============================================

export interface Bonus {
  uuid: string;
  /** 'YYYY-MM-DD'. */
  date: string;
  /** Cast `decimal:2` no Model, exposto como `float` pela Resource — chega
   *  string em alguns paths. Sempre convertido para `number` no client antes
   *  de popular o form/exibir. */
  amount: string | number;
  employee?: BonusEmployeeRef;
  event?: BonusEventRef;
  created_at: string;
  updated_at: string;
}

export type BonusListItem = Bonus;
export type BonusDetail = Bonus;

// ============================================
// ENVELOPE PAGINADO (ApiResponse::paginated)
// ============================================

export interface BonusesApiPaginationMeta {
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

export interface BonusesListEnvelope {
  success: boolean;
  message: string;
  data: Bonus[];
  errors: Record<string, string[]> | null;
  meta: BonusesApiPaginationMeta | null;
}

// ============================================
// REQUEST TYPES (payload wire-level — BonusData/BonusRequest)
// ============================================

// Full-replace (FE-FORM-MODE) — os 4 campos SEMPRE completos, tanto em
// create quanto em update (`BonusRequest::rules()` não distingue os verbos).
export interface BonusPayload {
  employee_uuid: string;
  event_uuid: string;
  /** 'YYYY-MM-DD'. */
  date: string;
  amount: number;
  // NUNCA no payload: uuid (só leitura), farm_id/criador (server-derived).
}

// ============================================
// REACT HOOK FORM (create/edit)
// ============================================

// Selects NÃO usam `Option<T>` no campo RHF — mirror `Advance`: cache local
// `useState<Option>` fora do form, `onChange` já faz `.value` unwrap antes de
// chamar `field.onChange`.
export interface BonusForm {
  employee_uuid: string;
  event_uuid: string;
  date: string;
  amount: number | null;
}

// Sem `BonusFilterForm` — `BonusRepository::list()` não aceita nenhum
// parâmetro de filtro (DEC-API-03, decisão #2 da Leitura do dev do roteiro).
