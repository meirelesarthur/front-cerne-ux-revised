// src/services/v2/Dashboards/overviewPanel-service.ts
// Service da dashboard "Painel de Controle" / Visão Geral (F-211, execução
// 062 — Fase B, wiring real + fix-up GAP-FE-251).
//
//   GET /api/v1/dashboards/home/overview            → data: OverviewPanelOverviewData (sem filtro)
//   GET /api/v1/dashboards/home/financial-summary    → data: OverviewPanelFinancialSummaryData (month?/year?)
//   GET /api/v1/dashboards/home/stock-coverage       → data: OverviewPanelStockCoverageData (sem filtro)
//   GET /api/v1/dashboards/home/product-result       → data: OverviewPanelProductResultData (area_id? opcional)
//
// Backend JÁ EXISTE para os 4 endpoints acima (`HomeOverviewDashboardController`/
// `HomeFinancialSummaryDashboardController`/`HomeStockCoverageDashboardController`/
// `HomeProductResultDashboardController`, confirmado por leitura direta do
// fork `GB.Cerne.Api`, branch `feature/062-painel-controle`) — `X-Farm-Id`
// anexado automaticamente pelo interceptor de `@/services/api.ts`
// (`get_spa_api_client_pattern §2`).
//
// GAP-FE-251 RESOLVIDO (ver `04-Gaps_Frontend_UI/GAP-FE-251-*.md`):
// `stock-coverage` (TASK-F211-API-03) e `product-result` (TASK-F211-API-04)
// foram materializados nesta correção — as 2 funções abaixo deixam de lançar
// erro explícito e passam a chamar a API real, mirror exato de
// `getOverviewPanelOverview`/`getOverviewPanelFinancialSummary`.
//
// GAP-FE-255 nível B (contrato `GAP-FE-255-periodo-global-contrato.md`):
// `overview`/`financial-summary`/`product-result` passam a aceitar
// `period_months` (1|2|3|6|12) opcional, propagado pelo filtro global do
// topo (`index.tsx`). `stock-coverage` NÃO recebe o parâmetro (decisão
// explícita do contrato §6.3 — o card é snapshot, não reage ao período).

import api from '@/services/api';

import type { Response } from '@/@types/response-api';
import type {
  OverviewPanelFinancialSummaryData,
  OverviewPanelFinancialSummaryFilterRequest,
  OverviewPanelOverviewData,
  OverviewPanelOverviewFilterRequest,
  OverviewPanelProductResultData,
  OverviewPanelProductResultFilterRequest,
  OverviewPanelStockCoverageData,
} from '@/@types/v2/Dashboards/overviewPanel';

/**
 * `GET /api/v1/dashboards/home/overview` — blocos #1 (casca)/#2 (mapa)/#3 (KPIs)/#12 (exceções).
 * @param {OverviewPanelOverviewFilterRequest} params - `period_months` opcional (default: mês corrente resolvido pelo backend). Honra somente `kpis.*`.
 * @return {Promise<Response<OverviewPanelOverviewData>>} Envelope com mapa/KPIs/exceções.
 */
async function getOverviewPanelOverview(
  params: OverviewPanelOverviewFilterRequest = {}
): Promise<Response<OverviewPanelOverviewData>> {
  const { data } = await api.V2.get<Response<OverviewPanelOverviewData>>(
    '/dashboards/home/overview',
    { period_months: params.period_months }
  );
  return data;
}

/**
 * `GET /api/v1/dashboards/home/financial-summary` — blocos #4/#5/#6/#9/#11.
 * @param {OverviewPanelFinancialSummaryFilterRequest} params - `month`/`year`/`period_months` opcionais (default: mês corrente/série completa resolvidos pelo backend).
 * @return {Promise<Response<OverviewPanelFinancialSummaryData>>} Envelope com o bloco financeiro consolidado.
 */
async function getOverviewPanelFinancialSummary(
  params: OverviewPanelFinancialSummaryFilterRequest = {}
): Promise<Response<OverviewPanelFinancialSummaryData>> {
  const { data } = await api.V2.get<Response<OverviewPanelFinancialSummaryData>>(
    '/dashboards/home/financial-summary',
    { month: params.month, year: params.year, period_months: params.period_months }
  );
  return data;
}

/** `GET /api/v1/dashboards/home/stock-coverage` — bloco #10. Sem filtros (fazenda ativa). */
async function getOverviewPanelStockCoverage(): Promise<Response<OverviewPanelStockCoverageData>> {
  const { data } = await api.V2.get<Response<OverviewPanelStockCoverageData>>(
    '/dashboards/home/stock-coverage'
  );
  return data;
}

/**
 * `GET /api/v1/dashboards/home/product-result` — bloco #13.
 * @param {OverviewPanelProductResultFilterRequest} params - Filtros `area_id`/`period_months` opcionais (default: todas as áreas da fazenda ativa / all-time). `period_months` NÃO afeta `quantity_harvested`/`productivity` (GAP-FE255-01).
 * @return {Promise<Response<OverviewPanelProductResultData>>} Envelope com quantidade/receita/preço médio/produtividade por produto.
 */
async function getOverviewPanelProductResult(
  params: OverviewPanelProductResultFilterRequest = {}
): Promise<Response<OverviewPanelProductResultData>> {
  const { data } = await api.V2.get<Response<OverviewPanelProductResultData>>(
    '/dashboards/home/product-result',
    { area_id: params.area_id, period_months: params.period_months }
  );
  return data;
}

export {
  getOverviewPanelFinancialSummary,
  getOverviewPanelOverview,
  getOverviewPanelProductResult,
  getOverviewPanelStockCoverage,
};
