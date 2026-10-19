// src/@types/v2/DeathLosses/index.d.ts
// -----------------------------------------------------------------------------
// Tipos do módulo de CAUSA MORTE/PERDA (DeathLoss — Cadastros Base / Pecuária).
// Mirror `@types/v2/Breeds/breed.d.ts` (FK `specie` aninhada + envelope paginado
// REAL), com o campo extra `cause`/`cause_label` (shape do `DeathLossResource`,
// ver `DeathLoss-contrato.md §11`).
//
//   GET    /api/v1/death-losses          → data: DeathLossListItem[] + meta:
//                                           paginação REAL (ApiResponse::paginated)
//   GET    /api/v1/death-losses/{uuid}   → data: DeathLossData
//   POST   /api/v1/death-losses          → payload DeathLossPayload
//   PUT    /api/v1/death-losses/{uuid}   → payload DeathLossPayload —
//                                           `DeathLossRequest::rules()` NÃO
//                                           diferencia store/update, payload
//                                           SEMPRE completo
//   DELETE /api/v1/death-losses/{uuid}   → 204; 422 estruturado se em uso
//                                           (`death_animals.cause_id`)
//
// `specie` é `{ uuid, description } | null` — NUNCA `specie_id`/`id` sequencial.
// `cause` é o valor cru `'M'|'P'`; `cause_label` já vem traduzido do backend,
// mas a UI usa rótulos hardcoded do enum no cliente (Select do formulário e
// Badge da grid) por consistência com o padrão de i18n do projeto —
// `cause_label` fica disponível só para debug/uso futuro, sem consumidor
// obrigatório.
// -----------------------------------------------------------------------------

import type { Option } from '@/@types/option';

// ============================================
// DEATH LOSS (resposta da API)
// ============================================

export interface DeathLossSpecieRef {
  uuid: string;
  description: string;
}

export type DeathLossCauseValue = 'M' | 'P';

export interface DeathLossListItem {
  uuid: string;
  description: string;
  specie: DeathLossSpecieRef | null;
  is_enabled: boolean;
  cause: DeathLossCauseValue;
  cause_label: string;
}

// `show` devolve o mesmo shape de `index` (DeathLossResource não acrescenta
// campos exclusivos de detalhe) — alias nomeado por simetria com o restante
// do projeto (BreedData/LowReasonData).
export interface DeathLossData extends DeathLossListItem {}

// ============================================
// ENVELOPE PAGINADO (ApiResponse::paginated — REAL)
// ============================================

export interface DeathLossesApiPaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number | null;
  to: number | null;
}

export interface DeathLossesListEnvelope {
  success: boolean;
  message: string;
  data: DeathLossListItem[];
  errors: Record<string, string[]> | null;
  meta: DeathLossesApiPaginationMeta | null;
}

// ============================================
// REQUEST TYPES
// ============================================

export interface DeathLossPayload {
  description: string;
  is_enabled: boolean;
  /** Obrigatório — backend rejeita (422) null/ausente. Nunca `specie_id`. */
  specie_uuid: string;
  cause: DeathLossCauseValue;
}

// ============================================
// FILTRO — aditivo no backend (search/specie_uuid/cause/is_enabled), NENHUM
// consumido pela UI nesta rodada (fidelidade ao legado, TASK-FE-050). Os 4
// campos existem por consistência de assinatura com `useCustomGridQuery`.
// ============================================

export interface DeathLossFilterForm {
  search?: string;
  is_enabled?: '' | 'true' | 'false';
  specie_uuid?: string;
  cause?: DeathLossCauseValue | '';
}

// ============================================
// REACT HOOK FORM (formulário create/edit)
// ============================================

export interface DeathLossForm {
  description: string;
  is_enabled: boolean;
  /** Guarda o Option { label, value } inteiro (SelectAsyncPaginate) — mirror `BreedForm.specie_uuid`. */
  specie_uuid: Option<string> | null;
  /** Guarda o Option { label, value } inteiro (Select nativo 2 opções) — mirror `LowReasonForm.do_movement`. */
  cause: Option<DeathLossCauseValue> | null;
}

// ============================================
// LOOKUP — `GET /death-losses/options?cause=&search=&page=&per_page=`
// (unificação pós-merge da 040 com o develop: os dois lados definiam um
// `listActiveDeathLosses` incompatível contra `/death-losses/active`; o
// contrato novo, paralelo a esta unificação, consolida ambos em
// `/death-losses/options` — envelope PAGINADO real, `is_enabled=true` fixo
// no backend, filtro opcional `cause`). `specie` continua omitido do tipo
// (o Resource só o inclui via `whenLoaded`, que a Action de options não
// carrega) — nenhum consumidor precisa dele aqui. `cause` é devolvido pelo
// Resource e opcional no tipo (debug/uso futuro, sem consumidor obrigatório
// hoje, mirror da nota de `cause_label` acima).
// ============================================

export interface DeathLossOptionRef {
  uuid: string;
  description: string;
  cause?: string;
}
