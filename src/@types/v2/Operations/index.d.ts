// src/@types/v2/Operations/index.d.ts
// -----------------------------------------------------------------------------
// Tipos do módulo de OPERAÇÕES (Operation) — API v1 do backend Laravel
// GB.Cerne. Criado em TASK-FE-035 (escopo mínimo, só listagem) — ESTENDIDO em
// TASK-FE-041 para o CRUD completo (Operation-contrato.md v2.1 §8-§15),
// consumido pela tela dedicada de Operações (TASK-FE-042/043).
//
// Contrato (envelope ApiResponse { success, message, data, errors, meta }),
// fonte: `01-Arquitetura_e_Contratos/Operation/Operation-contrato.md` v2.1:
//   GET    /operations             → data: OperationListItem[] + meta REAL de
//                                     paginação (ApiResponse::paginated()).
//   GET    /operations/{uuid}      → data: OperationDetail (mesmo shape flat).
//   POST   /operations             → payload OperationPayload (create).
//   PUT    /operations/{uuid}      → payload OperationPayload (update).
//   DELETE /operations/{uuid}      → 204; OU 500 genérico se a Operação
//                                     estiver vinculada a alguma Atividade
//                                     via `operation_activities` (D8, sem
//                                     tratamento especial no front).
//
// ⚠️ D4 do contrato (supera a exceção D3 do v1.0): `Operation` GANHOU `uuid`
// — a tela dedicada de Operações usa `uuid` como identificador de negócio
// (rota/edição/exclusão/chave da grid). `id` numérico CONTINUA exposto
// (compat. `Activity.operations[]`, TASK-BE-048, congelado) — é ignorável
// por esta tela nova, só relevante para quem já o consome (Atividades) via
// `useOperationsChecklist`/`CreateOrUpdateAtividade.tsx`.
//
// `OperationUseSlug` é um enum PRÓPRIO (3 valores: ambos/agricultura/
// pecuaria) — D5 do contrato corrigiu a divergência de rótulo criada quando
// a fatia mínima (TASK-FE-035) reaproveitou `ActivityUseSlug` (4 valores,
// rótulo 3 = "Fruticultura", errado para Operation). NÃO reaproveitar
// `ActivityUseSlug` aqui.
//
// `grouper_uuid` (`GAP-FE-006` resolvido, Opção B, D10/§10-A do contrato v2.1)
// — substitui `grouper_id` na SUPERFÍCIE DE ESCRITA e no FILTRO server-side.
// `grouper_id`/`grouper_name` de LEITURA são MANTIDOS (compat. retroativa),
// mas ignoráveis por esta tela — o Select "Agrupador" trabalha 100% por
// `grouper_uuid`.
// -----------------------------------------------------------------------------

import type { Option } from '@/@types/option';

// ============================================
// ENUMS (slugs — contrato de API, Operation-contrato.md §9, D5)
// ============================================

/** Enum PRÓPRIO de Operation — NÃO confundir com `ActivityUseSlug` (4 valores). */
export type OperationUseSlug = 'ambos' | 'agricultura' | 'pecuaria';

// ============================================
// OPERATION (resposta da API)
// ============================================

export interface OperationListItem {
  /** id numérico — mantido por compat. (`Activity.operations[]`), ignorável nesta tela. */
  id: number;
  /** Chave de rota/edição/exclusão da tela dedicada de Operações (D4). */
  uuid: string;
  name: string;
  description: string | null;
  is_enabled: boolean;
  /** API devolve string (coluna física é string). */
  order: string;
  use: OperationUseSlug;
  /** Rótulo pronto do Resource — "Ambos" | "Agricultura" | "Pecuária". */
  use_label: string;
  /** Mantido por compat. (Activity.operations[]) — ignorável pela tela de Operações. */
  grouper_id: number | null;
  /** NOVO (GAP-FE-006 resolvido, Opção B) — chave canônica do Select "Agrupador". */
  grouper_uuid: string | null;
  /** Nome do Agrupador (join de conveniência) — não uma relação aninhada. */
  grouper_name: string | null;
}

// GET /operations/{uuid} devolve o mesmo Resource do index(), sem campos
// extras só-de-detalhe (mesmo shape flat).
export type OperationDetail = OperationListItem;

// ============================================
// ENVELOPE PAGINADO (ApiResponse::paginated — REAL)
// ============================================

export interface OperationsListEnvelope {
  success: boolean;
  message: string;
  data: OperationListItem[];
  errors: Record<string, string[]> | null;
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  } | null;
}

// ============================================
// PRÓXIMA ORDEM (GET /operations/next-order — ajuste pós-E2E)
// ============================================
// Backend virou AUTORITATIVO sobre `order`: recalcula no create (ignora o
// valor enviado) e preserva no update. O campo "Ordem" da tela vira
// read-only nos dois modos — em CRIAÇÃO exibe este valor (próxima ordem
// disponível); em EDIÇÃO exibe `OperationDetail.order` (já exposto pelo
// Resource), sem chamada extra.
export interface OperationNextOrder {
  next_order: number;
}

// ============================================
// REQUEST TYPES
// ============================================

export interface OperationPayload {
  name: string;
  description?: string | null;
  /** GAP-FE-006 resolvido — substitui `grouper_id` no payload de escrita; `null` desvincula. */
  grouper_uuid?: string | null;
  is_enabled: boolean;
  order: number;
  use: OperationUseSlug;
}

// ============================================
// REACT HOOK FORM
// ============================================

export interface OperationForm {
  name: string;
  description: string;
  /**
   * Select `SelectAsyncPaginate` (contra `listGroupers({search})`) — o campo
   * guarda o par `{ label, value }` completo (`Option`), NÃO o uuid cru,
   * mesma convenção de `BreedForm.specie_uuid` (`CreateOrUpdateRaca.tsx`).
   * Opcional/nullable (diferente de Breed — Operação pode nascer/ficar sem
   * Agrupador). Conversão pro payload cru (`grouper_uuid: string | null`) só
   * no submit (`TASK-FE-043`).
   */
  grouper_uuid: Option<string> | null;
  is_enabled: boolean;
  /**
   * FIX (TASK-FE-147): estreitado de `number | string` para `number` — a
   * união com `string` era vestigial, existia só para acomodar o contrato
   * ANTIGO de `NumberInput` (`value={String(value ?? '')}`, Chakra
   * `NumberInput.Root`/Ark/Zag). O novo `NumberInput` (TASK-FE-143) já
   * entrega/recebe número puro (`value: number | null`), e `order` sempre
   * chega como número (`defaultValues.order = 0`, `next_order: number` da
   * API, `Number(data.order)` no `fillForm`) — não há caminho de dado que
   * produza `string` aqui.
   */
  order: number;
  use: OperationUseSlug | '';
}

// ============================================
// FILTRO (drawer da listagem)
// ============================================

export interface OperationFilterForm {
  search?: string;
  is_enabled?: 'true' | 'false';
  use?: OperationUseSlug;
  /** Server-side (GAP-FE-006 resolvido) — vai à querystring de `GET /operations`. */
  grouper_uuid?: string;
  /**
   * DISPLAY-ONLY — label do Agrupador selecionado, só para re-hidratar o
   * `SelectAsyncPaginate` do drawer com o NOME (não o uuid cru) quando
   * reabre. NUNCA enviado à API. Mesmo padrão de `BreedFilterForm.specie_label`
   * (`FilterSideRacas.tsx`).
   */
  grouper_label?: string;
}
