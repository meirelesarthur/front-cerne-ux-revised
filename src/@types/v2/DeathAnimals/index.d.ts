// src/@types/v2/DeathAnimals/index.d.ts
// -----------------------------------------------------------------------------
// Tipos do módulo OPERACIONAL — Mortes (DeathAnimal — Pecuária). RECONCILIADO
// contra o backend REAL (`GB.Cerne.Api`, TASK-DA-02/03, já materializado
// nesta sessão — leitura direta de `DeathAnimalResource.php`/
// `DeathAnimalRequest.php`/`DeathAnimalCheckDateRequest.php`/
// `DeathAnimalFilterData.php`/`CheckDeathAnimalDateAction.php`), NÃO apenas o
// contrato de tela `DeathAnimal-contrato-tela.md` (que assumia o shape antes
// da camada `api` existir — 2 divergências reais corrigidas aqui):
//
// 1) `batch` é `{uuid, description}` — NÃO `{uuid, label}` como o contrato de
//    tela assumia (`DeathAnimalResource::toArray()`, linha `batch`).
// 2) `DeathAnimalResource` NÃO tem `updated_at` — só `created_at`.
// 3) `animal_uuid`/`batch_uuid` são `required` em AMBOS os verbos no
//    `DeathAnimalRequest::rules()` (mesmo em `update`) — o servidor os
//    IGNORA ao montar o `UpdateDeathAnimalAction` (imutabilidade pós-criação,
//    `OQ-04`), mas a VALIDAÇÃO do Form Request exige a chave presente e
//    válida em ambos os verbos. Por isso `UpdateDeathAnimalRequest`/
//    `DeathAnimalPayload` de escrita SEMPRE incluem `animal_uuid`/
//    `batch_uuid` (full-resource-replace, mirror `BirthAnimalPayload`) — o
//    front nunca omite esses campos no PATCH, mesmo sendo `isDisabled` no UI.
//
//   GET    /api/v1/death-animals            → paginado (ApiResponse::paginated, meta REAL)
//   POST   /api/v1/death-animals            → multipart (photo opcional), death_animals_create
//   GET    /api/v1/death-animals/{uuid}     → detalhe completo, death_animals_view
//   PUT    /api/v1/death-animals/{uuid}     → multipart, death_animals_edit — animal_uuid/
//                                              batch_uuid IGNORADOS pela Action (mas exigidos
//                                              pela validação do Request)
//   DELETE /api/v1/death-animals/{uuid}     → 204; reverte Animal.status para ACTIVE
//   GET    /api/v1/death-animals/check-date → guarda não-bloqueante (Seção "check-date")
//
// `code`/`farm_id`/`user_id`(`user_uuid`)/`tenant_id`/`employee_id` NUNCA
// entram no payload de escrita — `code` gerado no servidor, `farm_id` vem do
// header `X-Farm-Id`, `user_id` vem de `Auth::id()`, `tenant_id`/`employee_id`
// são campos mortos.
// -----------------------------------------------------------------------------

import type { Option } from '@/@types/option';

// ============================================
// DEATH ANIMAL (resposta da API — DeathAnimalResource)
// ============================================

export interface DeathAnimalAnimalRef {
  uuid: string;
  identification: string;
}

/** Chave real do Resource é `description` (não `label`, GAP reconciliado contra o backend real). */
export interface DeathAnimalBatchRef {
  uuid: string;
  description: string;
}

/** `cause_id` é `NOT NULL` na tabela — sem fallback de nulidade necessário no front. */
export interface DeathAnimalCauseRef {
  uuid: string;
  description: string;
}

export interface DeathAnimalUserRef {
  uuid: string;
  name: string;
}

export interface DeathAnimalListItem {
  uuid: string;
  /** Sequencial gerado no servidor — SÓ LEITURA, nunca um `<Input>`. */
  code: string;
  /** ISO `Y-m-d`. */
  date: string;
  photo_url: string | null;
  note: string | null;
  /** `animal_id`/`batch_id` continuam FK reais — `null` defensivo (Resource usa `whenLoaded` + guard). */
  animal: DeathAnimalAnimalRef | null;
  batch: DeathAnimalBatchRef | null;
  cause: DeathAnimalCauseRef;
  user: DeathAnimalUserRef;
  created_at: string;
}

/** `show`/`store`/`update` devolvem o mesmo shape de `index` (sem subcadastro aninhado). */
export type DeathAnimalDetail = DeathAnimalListItem;

// ============================================
// ENVELOPE PAGINADO (ApiResponse::paginated)
// ============================================

export interface DeathAnimalsApiPaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface DeathAnimalsListEnvelope {
  success: boolean;
  message: string;
  data: DeathAnimalListItem[];
  errors: Record<string, string[]> | null;
  meta: DeathAnimalsApiPaginationMeta | null;
}

// ============================================
// REQUEST TYPES (wire — DeathAnimalRequest::rules())
// ============================================

export interface CreateDeathAnimalRequest {
  date: string;
  animal_uuid: string;
  batch_uuid: string;
  cause_uuid: string;
  note?: string;
  photo?: File;
}

/**
 * `animal_uuid`/`batch_uuid` continuam OBRIGATÓRIOS aqui (validação do
 * `DeathAnimalRequest` não diferencia por verbo) — a imutabilidade pós-
 * criação é responsabilidade da `UpdateDeathAnimalAction` no servidor, não
 * deste tipo. O front sempre reenvia os valores já hidratados (campos
 * `isDisabled` no formulário, nunca editáveis pelo usuário).
 */
export interface UpdateDeathAnimalRequest {
  date: string;
  animal_uuid: string;
  batch_uuid: string;
  cause_uuid: string;
  note?: string;
  photo?: File;
}

/** Payload interno do service — usado para montar o `FormData` de `store`/`update`. */
export interface DeathAnimalPayload {
  date: string;
  animal_uuid: string;
  batch_uuid: string;
  cause_uuid: string;
  note?: string | null;
  photo?: File | null;
}

// ============================================
// CHECK-DATE (guarda não-bloqueante — CheckDeathAnimalDateAction::handle())
// ============================================

export interface CheckDeathAnimalDateParams {
  animal_uuid?: string;
  batch_uuid?: string;
  date: string;
}

/**
 * `checks.animal`/`checks.batch` só aparecem quando o respectivo uuid foi
 * enviado (`CheckDeathAnimalDateAction::handle()` só popula a chave quando o
 * parâmetro não é `null`) — por isso `Partial`, nunca os dois presentes
 * incondicionalmente.
 */
export interface CheckDeathAnimalDateResult {
  valid: boolean;
  checks: Partial<Record<'animal' | 'batch', { valid: boolean; message: string | null }>>;
}

// ============================================
// REACT HOOK FORM (TASK-DA-FE-02)
// ============================================

export interface DeathAnimalForm {
  date: string;
  batch_uuid: Option<string> | null;
  animal_uuid: Option<string> | null;
  cause_uuid: Option<string> | null;
  note: string;
}

// ============================================
// FILTRO (drawer da listagem — DeathAnimalFilterData)
// ============================================

export interface DeathAnimalFilterForm {
  animal_identification?: string;
  cause_uuid?: string;
  start_date?: string;
  end_date?: string;
}

export interface DeathAnimalFilterRequest extends DeathAnimalFilterForm {}
