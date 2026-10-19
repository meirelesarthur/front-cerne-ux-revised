// src/@types/v2/MyServiceOrders/index.d.ts
// -----------------------------------------------------------------------------
// Tipos do módulo OPERACIONAL — Minhas OS (MyServiceOrder) — domínio PRÓPRIO
// (mirror `RatingServiceOrders`/`Monitoring`), esteira 063 (TASK-MOS-FE-01,
// fundação, SEM UI). API já materializada (Executor TASK-MOS-01..03,
// Tester ✅): `MyServiceOrderController`/`MyServiceOrderResource`/
// `MyServiceOrderDetailResource`/`MyServiceOrderExecutionRequest`.
//
//   GET /my-service-orders          → paginado (envelope `meta`), listagem
//                                      restrita ao executor logado
//                                      (`MyServiceOrderResource`)
//   GET /my-service-orders/{uuid}   → hidratação da execução
//                                      (`MyServiceOrderDetailResource`)
//   PUT /my-service-orders/{uuid}   → só o bloco de execução (escrita
//                                      multipart + `_method=PUT`, mirror
//                                      `updateEquipment`)
//
// Shape 1:1 do contrato de tela §3 (ground-truth já lido pelo Arquiteto
// diretamente do PHP) — NÃO reler o PHP nesta Tarefa. Fonte:
// `CORE_WORKSPACE/97-Esteiras/063/ROTEIROS/03-contrato-telas-my-service-orders.md`.
//
// CORREÇÃO DE FIDELIDADE (execução 063, gap de fidelidade do form de
// execução): `MyServiceOrderDetailResource` PASSA a expor `service_farm`
// (uuid+name) e `category` deixa de ser número cru — vira ref
// `{value,label}` (label = Uso: Ambos/Agricultura/Pecuária), mirror
// `ServiceOrderStatusRef`. Ajuste feito na MESMA esteira, API já materializada.
// -----------------------------------------------------------------------------

import type { Option } from '@/@types/option';
import type { ServiceOrderStatusRef, ServiceOrderStatusValue } from '@/@types/v2/ServiceOrders';

// Reexport de conveniência — NÃO redeclarar (mirror `RatingServiceOrders`).
export type { ServiceOrderStatusRef, ServiceOrderStatusValue };

// ============================================
// REFS ANINHADOS (leitura — sempre uuid+name)
// ============================================

export interface MyServiceOrderNamedRef {
  uuid: string;
  name: string;
}

// ============================================
// LISTAGEM (`GET /my-service-orders` — `MyServiceOrderResource`)
// ============================================

export interface MyServiceOrderListItem {
  uuid: string;
  code: string;
  dt_emission: string | null;
  deadline: string | null;
  status: ServiceOrderStatusRef;
  user?: MyServiceOrderNamedRef | null;
  executor?: MyServiceOrderNamedRef | null;
}

// ============================================
// FILTRO (drawer da listagem — mirror `MonitoringFilterForm`, 4 campos,
// MESMA ordem do contrato de tela §2 — `start_date`/`end_date` agora
// INTERVALO, DEF-01 corrigido na API).
// ============================================

export interface MyServiceOrderFilterForm {
  code?: string;
  /** ISO `YYYY-MM-DD` — aplicado a `dt_emission >= start_date`. */
  start_date?: string;
  /** ISO `YYYY-MM-DD` — aplicado a `dt_emission <= end_date`. */
  end_date?: string;
  /** Whitelist `[10,30,50,80,100,200]` — nome literal do parâmetro de
   *  querystring, mirror `MonitoringFilterForm` — NÃO renomear para
   *  `per_page`. */
  pagination_quantity?: number;
}

// ============================================
// ENVELOPE PAGINADO (`ApiResponse::paginated`)
// ============================================

export interface MyServiceOrdersApiPaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface MyServiceOrdersListEnvelope {
  success: boolean;
  message: string;
  data: MyServiceOrderListItem[];
  errors: Record<string, string[]> | null;
  meta: MyServiceOrdersApiPaginationMeta | null;
}

// ============================================
// CHECKLIST (FLD-26..32 — 5 blocos, `id` é a PK interna do pivot, `label` já
// resolvido pelo backend, `resolveEmployeeLineLabel`/`resolveProductLineLabel`
// — front NUNCA recalcula o rótulo). Mão de Obra é 1 ÚNICO array unificado
// (RN-08, `employees[]`), NÃO 3 blocos separados (achado §1 do contrato).
// ============================================

export interface MyServiceOrderChecklistLine {
  id: number;
  label: string | null;
  is_checked: boolean;
}

/** Linha de Mão de obra (execução 086): `type` 1=Funcionário, 2=Função,
 *  3=Fornecedor; só o uuid do tipo correspondente vem preenchido. */
export interface MyServiceOrderEmployeeLine extends MyServiceOrderChecklistLine {
  type?: 1 | 2 | 3 | null;
  employee_uuid?: string | null;
  function_uuid?: string | null;
  provider_uuid?: string | null;
}

export interface MyServiceOrderArea extends MyServiceOrderNamedRef {
  description?: string | null;
  /** Área produtiva em hectares. */
  productive_area?: number | null;
}

// ============================================
// ANEXOS (FLD-38..40 — leitura, mirror `EquipmentAttachmentRow`)
// ============================================

export interface MyServiceOrderAttachment {
  uuid: string;
  name: string;
  filename: string;
  url: string;
}

// ============================================
// DETALHE (`GET /my-service-orders/{uuid}` — `MyServiceOrderDetailResource`,
// shape 1:1 do contrato de tela §3 — 23 campos readonly (2 seções:
// Identificação/Condições) + bloco de execução (FLD-33..37) + 5 blocos de
// checklist (FLD-26..32) + anexos (FLD-38..40)).
// ============================================

export interface MyServiceOrderDetail {
  uuid: string;

  // -- Identificação (CollapsibleSection aberta por padrão) --
  code: string;
  dt_emission: string | null;
  /** Data planejada (legado FLD-05) — distinta de `execution_start_date`/
   *  `execution_end_date` (bloco de execução, abaixo). */
  execution_date: string | null;
  deadline: string | null;
  /** Fazenda de execução (FLD-07) — agora exposta pelo Resource. */
  service_farm?: MyServiceOrderNamedRef | null;
  /** Uso (Ambos/Agricultura/Pecuária) — ref `{value,label}`, mirror
   *  `ServiceOrderStatusRef`. `value`/`label` podem vir `null` quando a OS
   *  não tem categoria de uso definida. */
  category: { value: number | null; label: string | null };
  /** Execução 086: rótulo direto da categoria (Ambos/Agricultura/Pecuária). */
  category_label?: string | null;
  /** Execução 086: ganhou `description` e `productive_area` (hectares). */
  area?: MyServiceOrderArea | null;
  cultivation?: MyServiceOrderNamedRef | null;
  batch?: MyServiceOrderNamedRef | null;
  category_animal?: MyServiceOrderNamedRef | null;
  operation?: MyServiceOrderNamedRef | null;
  activity?: MyServiceOrderNamedRef | null;
  /** Solicitante. */
  user?: MyServiceOrderNamedRef | null;
  /** Encarregado. */
  executor?: MyServiceOrderNamedRef | null;

  // -- Condições e Instruções (CollapsibleSection fechada por padrão) --
  weather_requirements: string | null;
  minimum_temperature: number | null;
  maximum_temperature: number | null;
  allowed_working_period_start: string | null;
  allowed_working_period_end: string | null;
  environmental_restrictions: string | null;
  legal_compliance: string | null;
  service_description: string | null;
  expected_result_description: string | null;
  success_criteria_description: string | null;
  roadmap_description: string | null;

  // -- Bloco "Execução" (FLD-33..37 — editável nesta feature) --
  status: ServiceOrderStatusRef;
  execution_start_date: string | null;
  execution_end_date: string | null;
  execution_problems: string | null;
  corrective_actions: string | null;
  /** Execução 086: `true` só com status 1/2 e usuário executor; `false` =
   *  MODO LEITURA (sem iniciar/concluir/marcar itens). */
  can_execute: boolean;
  /** Cancelamento (só status 9) — presente se a API expuser. */
  cancellation_reason?: string | null;
  cancellation_date?: string | null;
  cancellation_user?: MyServiceOrderNamedRef | null;

  // -- 5 blocos de checklist (FLD-26..32 — editáveis via `*_checked_ids`) --
  employees: MyServiceOrderEmployeeLine[];
  equipments: MyServiceOrderChecklistLine[];
  products: MyServiceOrderChecklistLine[];
  productions: MyServiceOrderChecklistLine[];
  protections: MyServiceOrderChecklistLine[];

  // -- Anexos (FLD-38..40) --
  attachments: MyServiceOrderAttachment[];
}

// ============================================
// FORM (`useForm<MyServiceOrderExecutionForm>`) — SEMPRE modo execução
// (one-shot), NUNCA criação (`mode_matrix.criar = NAO_APLICAVEL`).
// ============================================

/** Linha de anexo do form — `uuid: null` para anexo novo (ainda sem PK),
 *  mirror `EquipmentAttachmentRow`/`buildEquipmentFormData`. */
export interface MyServiceOrderAttachmentRow {
  uuid: string | null;
  name: string;
  file: File | null;
}

export interface MyServiceOrderExecutionForm {
  /** LK-01 — restrito a `[2,3]` (`getMyServiceOrderExecutionStatusOptions`). */
  status: Option<2 | 3> | null;
  /** `datetime-local` nativo (`yyyy-MM-ddTHH:mm`), mirror `RatingServiceOrderForm`. */
  execution_start_date: string | null;
  /** `required` somente quando `status.value===3` (DEF-02, replicado no
   *  client só para feedback imediato — fonte de verdade é o backend). */
  execution_end_date: string | null;
  execution_problems: string | null;
  corrective_actions: string | null;
  /** Sempre presentes, mesmo vazios (RN-07 — "desmarcar tudo" é operação
   *  válida). Semeados no `fillForm` a partir de
   *  `bloco.filter(l => l.is_checked).map(l => l.id)`. */
  employees_checked_ids: number[];
  equipments_checked_ids: number[];
  products_checked_ids: number[];
  productions_checked_ids: number[];
  protections_checked_ids: number[];
  /** Front sempre envia o array COMPLETO e atual — diff por uuid é
   *  responsabilidade do backend (`SyncMyServiceOrderAttachmentsAction`). */
  attachments: MyServiceOrderAttachmentRow[];
}

// ============================================
// PAYLOAD DE ESCRITA (`PUT`, mirror 1:1 `MyServiceOrderExecutionRequest::
// rules()`) — multipart + method-spoofing (`_method=PUT`), NUNCA
// `api.V2.put` (mirror `updateEquipment`/`equipment-service.ts`).
// ============================================

export interface MyServiceOrderExecutionAttachmentPayload {
  uuid: string | null;
  name?: string;
  file?: File | null;
}

export interface MyServiceOrderExecutionPayload {
  status: 2 | 3;
  execution_start_date: string;
  execution_end_date?: string | null;
  execution_problems?: string | null;
  corrective_actions?: string | null;
  employees_checked_ids: number[];
  equipments_checked_ids: number[];
  products_checked_ids: number[];
  productions_checked_ids: number[];
  protections_checked_ids: number[];
  attachments: MyServiceOrderExecutionAttachmentPayload[];
}

// Reexport de conveniência (mirror `ServiceOrders`/`RatingServiceOrders`).
export type { Option };
