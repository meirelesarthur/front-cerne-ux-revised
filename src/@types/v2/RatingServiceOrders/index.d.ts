// src/@types/v2/RatingServiceOrders/index.d.ts
// -----------------------------------------------------------------------------
// Tipos do módulo OPERACIONAL — Avaliações de Ordem de Serviço
// (RatingServiceOrder) — domínio PRÓPRIO (mirror `ServiceOrders`), esteira
// 041 (TASK-FE-041-AVL-01). API JÁ CONSTRUÍDA (commit `194a5b0e`,
// `plano-api-avaliacoes.md` CONSUMIVEL):
//
//   GET /rating-service-orders          → paginado (envelope `meta`),
//                                          listagem enxuta
//                                          (`RatingServiceOrderListResource`)
//   GET /rating-service-orders/{uuid}   → hidratação de edição, REAPROVEITA
//                                          o shape `ServiceOrderDetail`
//                                          (`ServiceOrderDetailResource`
//                                          reusado no backend — mesmos 4
//                                          campos de avaliação + contexto
//                                          readonly da OS)
//   PUT  /rating-service-orders/{uuid}  → só os 4 campos de avaliação
//
// Sem POST/DELETE (mode_matrix `criar`/`excluir` = NAO_APLICAVEL,
// `plano-front-avaliacoes.md` §3). `RatingServiceOrderListItem` é um DTO
// PRÓPRIO (achado #12 do plano) — `ServiceOrderListItem` não tem
// `user`/`executor`, e o índex desta feature precisa dos dois nomes
// (solicitante + responsável).
// -----------------------------------------------------------------------------

import type { Option } from '@/@types/option';
import type { ServiceOrderDetail, ServiceOrderStatusRef } from '@/@types/v2/ServiceOrders';

// ============================================
// LISTAGEM (`GET /rating-service-orders` — `RatingServiceOrderListResource`)
// ============================================

export interface RatingServiceOrderNamedRef {
  uuid: string;
  name: string;
}

export interface RatingServiceOrderListItem {
  uuid: string;
  code: string;
  dt_emission: string | null;
  deadline: string | null;
  status: ServiceOrderStatusRef;
  user?: RatingServiceOrderNamedRef | null;
  executor?: RatingServiceOrderNamedRef | null;
}

// ============================================
// DETALHE (`GET /rating-service-orders/{uuid}` — reaproveita
// `ServiceOrderDetailResource`/`ServiceOrderDetail`, mesmo shape 1:1, ver
// achado #5 do plano). Reexport de conveniência — NÃO redeclarar os ~30
// campos de contexto.
// ============================================

export type RatingServiceOrderDetail = ServiceOrderDetail & {
  /** Execução 086 (API-06): `true` somente com status 3 (Concluída) e usuário
   *  solicitante. `false` = tela em MODO LEITURA (sem submit). Em status 4 o
   *  detalhe traz `assessment_grade`/`rating_date`/`feedback`/
   *  `recommendations`; em 9, os campos `cancellation_*`. */
  can_rate: boolean;
};

// ============================================
// FILTRO (drawer da listagem — `RatingServiceOrderFilterData`)
// ============================================

export interface RatingServiceOrderFilterForm {
  code?: string;
  /** Execução 086: INTERVALO sobre `dt_emission` (`>= start_date`). */
  start_date?: string;
  /** Execução 086: INTERVALO sobre `dt_emission` (`<= end_date`). */
  end_date?: string;
}

// ============================================
// ENVELOPE PAGINADO (`ApiResponse::paginated`)
// ============================================

export interface RatingServiceOrdersApiPaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface RatingServiceOrdersListEnvelope {
  success: boolean;
  message: string;
  data: RatingServiceOrderListItem[];
  errors: Record<string, string[]> | null;
  meta: RatingServiceOrdersApiPaginationMeta | null;
}

// ============================================
// FORM (`useForm<RatingServiceOrderForm>`) — SEMPRE modo edição (one-shot),
// NUNCA criação (`mode_matrix.criar = NAO_APLICAVEL`).
// ============================================

export interface RatingServiceOrderForm {
  assessment_grade: Option<number> | null;
  rating_date: string | null;
  feedback: string | null;
  recommendations: string | null;
}

// ============================================
// PAYLOAD DE ESCRITA (`PUT`, mirror 1:1 `RatingServiceOrderRequest::rules()`/
// `RatingServiceOrderData`) — só os 4 campos, SEM `status` (o backend infere
// a transição `3→4` internamente, `UpdateServiceOrderRatingAction`).
// ============================================

export interface RatingServiceOrderPayload {
  assessment_grade: number;
  rating_date: string;
  feedback: string;
  recommendations?: string | null;
}

// Reexport de conveniência (mirror `ServiceOrders`).
export type { Option };
