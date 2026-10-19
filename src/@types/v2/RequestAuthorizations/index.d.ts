// src/@types/v2/RequestAuthorizations/index.d.ts
// -----------------------------------------------------------------------------
// Tipos do módulo "Autorização" (RequestAuthorization — Administrativo /
// Suprimentos, esteira 97-Esteiras/038, TASK-AUTH-FE-01). Fundação de dados —
// nenhuma tela, só shapes. Transporte tipado 1:1 com o Resource/DTOs reais do
// backend (`GB.Cerne.Api`, branch `feature/refactor-request-authorization-and-my-processes-for-api`):
//
//   - `RequestAuthorizationResource::toArray()` — composição por `array_merge`
//     de `RequestPurchaseResource` (reusado de `@/@types/v2/RequestPurchases`)
//     + `authorization_context`.
//   - `ResolveAuthorizationContextAction::handle()` — shape exato de
//     `authorization_context` (7 chaves, nenhuma opcional — a Action SEMPRE
//     retorna as 7; `authorization_context` em si é SEMPRE presente no
//     `show()` real, o `when()` do backend controla só o VALOR computado,
//     nunca a ausência da CHAVE — NÃO tornar `authorization_context?:`).
//   - `app/Data/RequestPurchase/RequestAuthorization*.php` (10 DTOs) —
//     payloads exatos dos 10 endpoints de escrita.
//
// ⚠️ Rateio (`categories`/`centers`/`category_percent_values`) é 3 ARRAYS
// PARALELOS POR ÍNDICE no payload real — NÃO um array de objetos
// `{category_uuid, center_uuid, percent}[]`. A conversão de/para linhas de UI
// (useFieldArray) é responsabilidade das Tarefas 03/04 (telas de detalhe),
// não desta fundação.
//
// `per_page` default do filtro de listagem é 10 (mirror
// `RequestAuthorizationFilterData::per_page = 10`), distinto do default 15 do
// resto do módulo `RequestPurchase` (CLM-02) — aplicado no service, não aqui.
// -----------------------------------------------------------------------------

import type { RequestAuthorizerOptionItem } from '@/services/v2/RequestAuthorizers/request-authorizer-service';

import type {
  RequestAttachmentRow,
  RequestItemRow,
  RequestMovementRow,
  RequestPurchaseData,
  TransferOption,
} from '@/@types/v2/RequestPurchases';
import type { RequestQuotationData } from '@/@types/v2/RequestQuotations';

/** Composição 1:1 de `RequestAuthorizationResource::toArray()` — `array_merge`
 *  de `RequestPurchaseResource` + `authorization_context`. `authorization_context`
 *  SEMPRE presente no `show()` real (o `when()` do backend controla o VALOR
 *  computado, não a ausência da chave) — NÃO tornar opcional. */
export interface RequestAuthorizationData extends RequestPurchaseData {
  authorization_context: RequestAuthorizationContext;
  /** ADITIVO (esteira 112, F-088 Autorização) — o payload de detalhe da
   *  Autorização agora inclui as cotações da solicitação (gateado por
   *  `request-authorization_view`), mesmo shape de
   *  `listRequestQuotationsByPurchase` (`quotes()`, ver nota de eager-loading
   *  em `@/@types/v2/RequestQuotations`). A tela de Autorização lê daqui em
   *  vez de chamar `GET /request-purchases/{uuid}/quotations` (módulo
   *  Cotações, gate `request-quotation_view` — 403 para o Autorizador). */
  quotations: RequestQuotationData[];
}

/** Autorizador elegível (Enviar para Autorização): campos do
 *  `RequestAuthorizerResource` + `name` e `level` (T-081-API-01). */
export type RequestAuthorizationEligibleAuthorizer = RequestAuthorizerOptionItem & {
  name: string;
  level: number;
};

/** Shape de `ResolveAuthorizationContextAction::handle()` (T-081-API-01, execução
 *  081) — todas as chaves sempre presentes. `next_status_candidates` tem um único
 *  valor (`next_status`). `transfer_candidates` são usuários do mesmo nível. */
export interface RequestAuthorizationContext {
  /** Próxima etapa da Ciência: 2 (cotação), 3 (autorização) ou 4 (condicional pendente). */
  next_status: number;
  next_status_candidates: number[];
  last_status: number | null;
  /** Valor da alçada (D-07): maior cotação, senão soma dos itens. */
  request_value: number;
  has_pending_conditional: boolean;
  /** Promoção automática 4 para 3 (legado `second`): o front chama `acknowledge {auto_promote:true}` uma vez. */
  auto_promote_available: boolean;
  eligible_authorizers: RequestAuthorizationEligibleAuthorizer[];
  is_farm_authorizer: boolean;
  can_transfer: boolean;
  transfer_candidates: TransferOption[];
  can_approve_first_level: boolean;
  can_acknowledge_second_level: boolean;
  requires_ratio_block: boolean;
}

// ============================================
// FILTRO (GET /request-authorizations) — RequestAuthorizationFilterData real
// ============================================
export interface RequestAuthorizationFilterForm {
  search?: string;
  status?: number;
  type?: string;
  start_date?: string;
  end_date?: string;
}

export interface RequestAuthorizationFilterRequest extends RequestAuthorizationFilterForm {}

// ============================================
// LISTAGEM (GET /request-authorizations) — SEM authorization_context (o
// Resource só inclui esse bloco no show(), docblock "só aparece na rota show")
// ============================================
export interface RequestAuthorizationListItem extends Omit<
  RequestPurchaseData,
  'items' | 'movements'
> {}

// ============================================
// PAYLOADS — mirror 1:1 dos DTOs PHP (Optional|T vira campo opcional aqui)
// ============================================

/** POST /request-authorizations/{uuid}/approve — `final_justification` obrigatória (máx. 600).
 *  Rateio em 3 ARRAYS PARALELOS POR ÍNDICE (categories[i]/centers[i]/category_percent_values[i]). */
export interface RequestAuthorizationApprovePayload {
  final_justification: string;
  items?: string[];
  quotations?: string[];
  classification?: string;
  harvest_uuid?: string;
  categories?: string[];
  centers?: string[];
  category_percent_values?: number[];
}

/** POST /request-authorizations/{uuid}/reject-partial ("Voltar Etapa" da Aprovação,
 *  T-081-API-02) — `justify` obrigatória (máx. 600); classificação e safra são gravadas
 *  também ao voltar (legado `update`). */
export interface RequestAuthorizationRejectPartialPayload {
  justify: string;
  classification?: string;
  harvest_uuid?: string;
}

/** POST /request-authorizations/{uuid}/reject-final — `final_justification` obrigatória (máx. 600). */
export interface RequestAuthorizationRejectFinalPayload {
  final_justification: string;
}

/** POST /request-authorizations/{uuid}/acknowledge — Ciência. Duas formas:
 *  `{ auto_promote: true }` (promoção 4 para 3 ao abrir) ou `{ status: 2|3|4, ... }`.
 *  `justify` máx. 400, obrigatória fora do status 3. */
export interface RequestAuthorizationAcknowledgePayload {
  auto_promote?: boolean;
  status?: number;
  authorizer_uuid?: string;
  responsible_uuid?: string;
  justify?: string;
  classification?: string;
  harvest_uuid?: string;
  categories?: string[];
  centers?: string[];
  category_percent_values?: number[];
}

/** POST /request-authorizations/{uuid}/return — `justify` obrigatória (máx. 400); só `{ justify }` (D-100-22). */
export interface RequestAuthorizationReturnPayload {
  justify: string;
}

/** POST /request-authorizations/{uuid}/reject (Ciência) — só `{ justify }` obrigatória (máx. 400, D-100-22). */
export interface RequestAuthorizationRejectSecondLevelPayload {
  justify: string;
}

/** POST /request-authorizations/{uuid}/reassign — novo responsável do mesmo nível (`transfer_candidates`). */
export interface RequestAuthorizationReassignPayload {
  responsible_uuid: string;
  justify?: string;
}

/** Resposta do `PUT .../items/{itemUuid}` (T-081-API-02): o item + cotações recalculadas. */
export type RequestAuthorizationItemUpdateResult = RequestItemRow & {
  quotations: RequestQuotationData[];
};

/** PUT /request-authorizations/{uuid}/items/{itemUuid} — único campo editável */
export interface RequestAuthorizationItemUpdatePayload {
  quantity: number;
}

/** POST /request-authorizations/{uuid}/comments — campo `comment`, NÃO `justify`
 *  (justify é o nome da coluna física, comment é o nome do payload público) */
export interface RequestAuthorizationCommentPayload {
  comment: string;
}

export type { RequestAttachmentRow, RequestItemRow, RequestMovementRow };
