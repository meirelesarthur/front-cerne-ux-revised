// src/@types/v2/Operacional/Monitoring/index.d.ts
// -----------------------------------------------------------------------------
// Tipos do módulo OPERACIONAL — Monitoramento (MonitoringServiceOrder) —
// domínio PRÓPRIO (módulo `Monitoring`, NÃO sub-pasta de `ServiceOrders`),
// TASK-MO-FE-01 (fundação, esteira `97-Esteiras/057`). SÓ LEITURA — sem
// CRUD, sem escrita, grid de Ordens de Serviço do executor logado.
//
//   GET /api/v1/monitoring-service-orders → paginado (envelope `meta`),
//                                            listagem (`MonitoringServiceOrderResource`)
//
// Modelado por `CONTRATO-TELA-F046-monitoramento.md` §4 (espelha §2.2/§2.4
// do `CONTRATO-DESTINO-F046-monitoramento`, contrato de API `APROVADO`,
// contract_id `44745d88-9fdf-4249-bcfb-6aabf7d20d56`). `uuid` sempre presente
// nas entidades; `id` numérico NUNCA exposto no DTO de leitura.
//
// Namespace/queryKey `monitoring` — NÃO reaproveita `serviceOrders` (contrato
// de API/permissão distintos: `monitoring-service-orders_view` ≠
// `service-orders_view`, ver §3 do contrato de tela).
// -----------------------------------------------------------------------------

// ============================================
// STATUS (`status <= 3` — regra fixa de negócio da API; domínio completo do
// `ServiceOrderStatus` tem 5 valores, mas este endpoint só retorna 3).
// ============================================

/** API só retorna 1=Aberta, 2=Em Execução, 3=Concluída (regra fixa, §5.3 do
 *  contrato de tela). A legenda de tela renderiza os 5 status possíveis do
 *  domínio (fiel ao legado, CLM-24) reaproveitando
 *  `service-order-status-options.ts` — ver `serviceOrderStatus.ts` deste
 *  módulo. */
export type MonitoringStatusValue = 1 | 2 | 3;

export interface MonitoringStatusRef {
  value: MonitoringStatusValue;
  label: string;
  /** Hex cru do backend — NUNCA consumir direto (Passo UX). Mapear por
   *  `getMonitoringStatusBadgeColor` (`serviceOrderStatus.ts`, reaproveita
   *  `SERVICE_ORDER_STATUS_META` de `ServiceOrders`). */
  color: string;
}

// ============================================
// REFS ANINHADOS (leitura — sempre uuid+name)
// ============================================

export interface MonitoringNamedRef {
  uuid: string;
  name: string;
}

// ============================================
// LISTAGEM (`GET /monitoring-service-orders` — item de listagem)
// ============================================

export interface MonitoringServiceOrderListItem {
  uuid: string;
  code: string;
  dt_emission: string | null;
  deadline: string | null;
  status: MonitoringStatusRef;
  /** `user_id` — Resource expõe `{uuid, name}` (§2.4 do contrato de API). */
  solicitante: MonitoringNamedRef;
  /** `executor_id` — Resource expõe `{uuid, name}` (§2.4 do contrato de API). */
  responsavel: MonitoringNamedRef;
}

// ============================================
// FILTRO (drawer da listagem) — os 4 campos, MESMA ordem do contrato de API
// (fidelidade mandatória, §5.1 do contrato de tela).
// ============================================

export interface MonitoringFilterForm {
  code?: string;
  /** ISO `YYYY-MM-DD`. */
  start_date?: string;
  /** ISO `YYYY-MM-DD` — faixa (`<=`), NÃO igualdade. */
  end_date?: string;
  /** Whitelist `[10,30,50,80,100,200]` — controla o `per_page` real. Nome
   *  literal do parâmetro de querystring (mandato do dono, §4 nota de
   *  nomeação do contrato de tela) — NÃO renomear para `per_page` na
   *  chamada HTTP. */
  pagination_quantity?: number;
}

// ============================================
// ENVELOPE PAGINADO (`ApiResponse::paginated`)
// ============================================

export interface MonitoringApiPaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface MonitoringServiceOrdersListEnvelope {
  success: boolean;
  message: string;
  data: MonitoringServiceOrderListItem[];
  errors: Record<string, string[]> | null;
  meta: MonitoringApiPaginationMeta | null;
}
