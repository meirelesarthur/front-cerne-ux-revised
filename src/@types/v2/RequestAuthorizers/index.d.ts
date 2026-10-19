// src/@types/v2/RequestAuthorizers/index.d.ts
// -----------------------------------------------------------------------------
// Tipos do módulo de AUTORIZADORES (RequestAuthorizer — Cadastros Base /
// Pessoas). SLICE 1 (Lote 06 / esteira 089, Frente C, F-141) cobriu Lista +
// visibilidade (campos da listagem/exclusão). SLICE 2 (mesmo lote/esteira,
// frente C) ACRESCENTA os tipos de FORM (criação/edição) — `RequestAuthorizerForm`/
// `RequestAuthorizerPayload`/sub-tipos `*Form` — de forma ADITIVA, sem alterar
// os tipos de listagem do Slice 1.
//
// Fonte: `RequestAuthorizerResource` do backend Laravel (lido via
// `request-authorizer-service.ts`, cabeçalho — Controller/rotas/Resource
// confirmados em `GB.Cerne.Api/routes/api.php`). Mirror EXATO dos campos
// reais — NUNCA `id`/`description`/`min_value`/`is_manager` (Lei 10/
// DA-AU-05/DA-AU-07): esses campos NÃO existem no Resource.
//
// CORREÇÃO SLICE 2: `RequestAuthorizerRuleRef.value` estava tipado como
// `number` no Slice 1 (não consumido por nenhuma tela até aqui) — o
// `RequestAuthorizerRequest` real do backend valida `rules.*.value` como
// `string` (`required_with:rules, string`) e o `RuleType` só tem o case
// `tipo_chamado`, cujo valor esperado é um CÓDIGO de tipo de chamado de
// Solicitação de Compra (string). Corrigido aqui — nenhum consumidor do
// Slice 1 lia este campo (grep confirmado), então não há regressão.
// -----------------------------------------------------------------------------

import type { Option } from '@/@types/option';

// ============================================
// SUB-RECURSOS (embutidos no Resource — sem endpoint próprio)
// ============================================

export interface RequestAuthorizerFarmRef {
  farm_uuid: string;
  name: string;
  level: number;
}

export interface RequestAuthorizerRuleRef {
  type: string;
  value: string;
  apply_on: string;
}

// ============================================
// REQUEST AUTHORIZER (resposta da API — listagem/detalhe)
// ============================================

export interface RequestAuthorizerListItem {
  uuid: string;
  user: { uuid: string; name: string };
  /** Quem cadastrou (`auth` do legado) — null é possível (dado histórico sem responsável). */
  auth: { uuid: string; name: string } | null;
  /** Alçada máxima — `null` = sem limite (ver `maxValueUnlimited` no i18n). */
  max_value: number | null;
  is_active: boolean;
  number_quotes: number | null;
  expense_organizer: boolean;
  is_conditional: boolean;
  farms: RequestAuthorizerFarmRef[];
  rules: RequestAuthorizerRuleRef[];
  created_at: string;
  updated_at: string;
}

// ============================================
// ENVELOPE PAGINADO (ApiResponse::paginated)
// ============================================

export interface RequestAuthorizersApiPaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface RequestAuthorizersListEnvelope {
  success: boolean;
  message: string;
  data: RequestAuthorizerListItem[];
  errors: Record<string, string[]> | null;
  meta: RequestAuthorizersApiPaginationMeta | null;
}

// ============================================
// FILTRO (drawer da listagem — Slice 1: só `search`)
// ============================================

export interface RequestAuthorizerFilterForm {
  /** Busca por nome do usuário vinculado (param `search` do backend, ILIKE em `user.name`). */
  search?: string;
}

// ============================================
// FORM (SLICE 2 — criação/edição, react-hook-form)
// ============================================

// GET /request-authorizers/{uuid} — mesmo shape do item de listagem (`show()`
// e `index()` usam o mesmo `RequestAuthorizerResource`, sem campos extras
// só-de-detalhe).
export type RequestAuthorizerData = RequestAuthorizerListItem;

export interface RequestAuthorizerFarmFormItem {
  farm_uuid: string;
  /** 1-4. */
  level: number | null;
}

export interface RequestAuthorizerRuleFormItem {
  /** Enum `RuleType` — hoje só `'tipo_chamado'` (Select com 1 opção). */
  type: string;
  /**
   * Código string livre (backend valida só `required_with|string`, sem enum
   * fechado nesta versão do fork — `RuleType`/RequestPurchase não expõem um
   * catálogo de tipos de chamado consultável). UX-GAP/§10.4 do contrato:
   * degradado para input de texto (não Select fechado) — fonte de opções
   * fiel ao legado (`agro365 RequestPurchase::types()`) não confirmada
   * neste backend; não fabricar enum sem fonte.
   */
  value: string;
  apply_on: 'A' | 'D' | '';
}

export interface RequestAuthorizerForm {
  /** Option do `SelectAsyncPaginate` (§7.2, `/users/authorizer-options`) — resolvido para uuid cru só no payload. */
  user_uuid: Option<string> | null;
  max_value: number | null;
  is_active: boolean;
  number_quotes: number | null;
  expense_organizer: boolean;
  is_conditional: boolean;
  farms: RequestAuthorizerFarmFormItem[];
  rules: RequestAuthorizerRuleFormItem[];
}

// Payload de envio — `user_uuid` já resolvido para string (nunca o Option inteiro).
export interface RequestAuthorizerPayload {
  user_uuid: string;
  max_value: number | null;
  is_active: boolean;
  number_quotes: number;
  expense_organizer: boolean;
  is_conditional: boolean;
  farms: { farm_uuid: string; level: number }[];
  /** SEMPRE enviado — `[]` explícito quando `is_conditional=false`, NUNCA omitido (DA-AU-13/GAP-19). */
  rules: { type: string; value: string; apply_on: 'A' | 'D' }[];
}
