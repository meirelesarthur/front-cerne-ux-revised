// src/@types/v2/Operacional/Pecuaria/lossAnimal/index.d.ts
// -----------------------------------------------------------------------------
// Tipos do módulo de PERDAS (LossAnimal — Operacional / Pecuária). Feature
// F-043, execução 040 (TASK-FE-2770..2776). CRUD de lista farm-scoped,
// single-table, sem subcadastro — mirror estrutural de `@types/v2/DeathLosses`
// (FK `cause` aninhada), com os campos extra `animal`/`batch`/`user`/
// `employee` do domínio Operacional (mesmo racional de campo de
// `Nascimentos`/`Weaning`).
//
//   GET    /api/v1/loss-animals          → data: LossAnimalData[] + meta
//                                           (paginação real)
//   GET    /api/v1/loss-animals/{uuid}   → data: LossAnimalData
//   POST   /api/v1/loss-animals          → payload CreateOrUpdateLossAnimalRequest
//   PUT    /api/v1/loss-animals/{uuid}   → payload CreateOrUpdateLossAnimalRequest
//                                           (SEMPRE completo — contrato de
//                                           tela §7.5.2/API §3.6, mirror
//                                           `DeathLossRequest`)
//   DELETE /api/v1/loss-animals/{uuid}   → 204
//
// `animal`/`batch`/`cause`/`user`/`employee` são objetos `{ uuid, ... } | null`
// — NUNCA `*_id` sequencial. `employee` é leitura-somente (DEC-LA-01,
// contrato de tela §7.3): nunca aparece no form, só na Visualização.
// -----------------------------------------------------------------------------

import type { Option } from '@/@types/option';

// ============================================
// LOSS ANIMAL (resposta da API — LossAnimalResource, contrato §3.4)
// ============================================

export interface LossAnimalAnimalRef {
  uuid: string;
  identification: string;
  /**
   * FID-G5 (execução 040) — legado exibe `animal->category->description` na
   * listagem. Trabalho paralelo no backend expõe `category` aninhado
   * (`whenLoaded`); pode vir ausente/`null` até a API publicar o campo —
   * NUNCA inventar dado, só optional chaining + fallback na UI.
   */
  category?: { uuid: string; description: string } | null;
}

export interface LossAnimalCauseRef {
  uuid: string;
  description: string;
  cause: string;
  cause_label: string;
}

export interface LossAnimalBatchRef {
  uuid: string;
  description: string;
}

export interface LossAnimalUserRef {
  uuid: string;
  name: string;
}

export interface LossAnimalEmployeeRef {
  uuid: string;
  name: string | null;
}

export interface LossAnimalData {
  uuid: string;
  code: string;
  date: string;
  note: string | null;
  animal: LossAnimalAnimalRef | null;
  cause: LossAnimalCauseRef;
  batch: LossAnimalBatchRef | null;
  /**
   * `whenLoaded` + guarda de nulo no servidor (`LossAnimalResource.php:39-49`)
   * — registros legados migrados podem trazer `user: null` (responsável só
   * via `employee`). NUNCA acessar `.uuid`/`.name` sem guarda (TASK-FE-2777).
   */
  user?: LossAnimalUserRef | null;
  /** Leitura-somente — DEC-LA-01, NUNCA no formulário (só na Visualização). */
  employee?: LossAnimalEmployeeRef | null;
  created_at: string;
  updated_at: string;
}

// ============================================
// ENVELOPE PAGINADO (ApiResponse::paginated)
// ============================================

export interface LossAnimalsApiPaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number | null;
  to: number | null;
}

export interface LossAnimalsListEnvelope {
  success: boolean;
  message: string;
  data: LossAnimalData[];
  errors: Record<string, string[]> | null;
  meta: LossAnimalsApiPaginationMeta | null;
}

// ============================================
// REACT HOOK FORM (formulário create/edit) — 8 campos (contrato §7.3,
// linhas 10-17). `code`/`user_uuid`/`user_name` NÃO são inputs livres do
// usuário (readonly/derivados), mas participam do form para hidratação.
// ============================================

export interface LossAnimalForm {
  code: string;
  /** ISO `yyyy-mm-dd`. */
  date: string;
  user_uuid: string;
  /** Display-only — NUNCA enviado no payload. */
  user_name: string;
  batch_uuid: Option<string> | null;
  animal_uuid: Option<string> | null;
  cause_uuid: Option<string> | null;
  note: string;
}

// ============================================
// FILTRO da listagem — FLD-001..004 (contrato §7.3, linhas 1-4).
// ============================================

export interface LossAnimalFilterForm {
  animal_uuid: Option<string> | null;
  cause_uuid: Option<string> | null;
  start_date: string | null;
  end_date: string | null;
}

export interface LossAnimalFilterRequest {
  animal_uuid?: string;
  cause_uuid?: string;
  /** ISO `yyyy-mm-dd`. */
  start_date?: string;
  /** ISO `yyyy-mm-dd`. */
  end_date?: string;
}

// ============================================
// PAYLOAD de criação/atualização — mirror `LossAnimalRequest` (contrato API
// §3.3). `farm_id`/`tenant_id`/`user_uuid`/`code`/`employee_id` NUNCA aqui —
// todos server-derivados ou fora do escopo desta tela (DEC-LA-01/FID-LA-002/
// 008/010).
//
// ⚠️ Payload de UPDATE é o MESMO tipo, ENVIADO POR INTEIRO
// (full-resource-replace, contrato §7.5.2/API §3.6 passo 3 — mirror
// `DeathLossRequest`). NÃO existe variante `Partial<>`/PATCH parcial.
// ============================================

export interface CreateOrUpdateLossAnimalRequest {
  animal_uuid: string;
  cause_uuid: string;
  batch_uuid: string | null;
  date: string;
  note: string | null;
}

// ============================================
// check-date — TASK-BE-1078/TASK-FE-2780 (FID-043-03). Restaura a checagem de
// coerência temporal do legado (`CheckDatesController::checkDate()`), só os 2
// ramos usados por Perdas. XOR real no backend (`animal_uuid`/`batch_uuid`,
// `prohibits`/`required_without`) — o CALLER decide qual dos dois envia,
// nunca os dois juntos. Contrato: 200 = válido; 422 com
// `errors.{animal_uuid|batch_uuid}[0]` = inválido (mensagem do legado,
// verbatim). Erro de rede/500 é responsabilidade do CALLER (não limpar o
// campo — só a resposta 422 significa "data inválida").
// ============================================

export interface CheckLossAnimalDateParams {
  /** ISO `yyyy-mm-dd`. */
  date: string;
  animal_uuid?: string;
  batch_uuid?: string;
}

export interface CheckLossAnimalDateResult {
  valid: boolean;
  /** Mensagem do legado (verbatim) — presente só quando `valid` é `false`. */
  message?: string;
}
