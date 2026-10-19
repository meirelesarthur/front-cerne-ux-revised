// src/@types/v2/Dashboards/overviewPanel/index.d.ts
// Tipos da dashboard "Painel de Controle" / Visão Geral (F-211, execução 062,
// Fase B — wiring real). Shapes confirmados por LEITURA DIRETA do código do
// backend já materializado nesta mesma onda (`GB.Cerne.Api`), não pela
// hipótese "a confirmar" da Fase A:
//   - `app/Actions/Dashboards/GetHomeOverviewDashboardAction.php::build()`
//   - `app/Actions/Dashboards/GetHomeFinancialSummaryDashboardAction.php::build()`
//   - `app/Http/Resources/V1/Home{Overview,FinancialSummary}DashboardResource.php`
//     (envelope fino — devolvem o array da Action tal como está)
//
// DIVERGÊNCIA relevante da Fase A (documentada, não silenciosa): o shape
// provisório da Fase A supunha `areas[].crop`/`area_ha` e KPIs com
// `*_variation_pct`/`monthly_series` (para sparkline) — o endpoint REAL não
// devolve nenhum desses campos (`overview` não filtra por período nem monta
// série mensal; `areas` só tem `color` já resolvida no servidor, sem
// `crop`/`area_ha`). Blocos consumidores (`MapaTalhoes`, KPIs do `index.tsx`)
// foram adaptados ao shape real nesta entrega — nunca o contrário.
//
// GAP-FE-251 RESOLVIDO (fix-up, ver `04-Gaps_Frontend_UI/GAP-FE-251-*.md`):
// `dashboards/home/stock-coverage` (TASK-F211-API-03) e
// `dashboards/home/product-result` (TASK-F211-API-04) foram materializados no
// fork `GB.Cerne.Api` (branch `feature/062-painel-controle`) — os tipos
// abaixo para os blocos #10/#13 foram corrigidos para o shape REAL, por
// leitura direta de `HomeStockCoverageDashboardResource`/
// `GetHomeStockCoverageDashboardAction` e
// `HomeProductResultDashboardResource`/`GetHomeProductResultDashboardAction`
// (não é mais o shape provisório/hipotético da Fase A — divergia em nomes de
// campo e estrutura: raiz `products` em vez de `items`/`rows`, `uuid`/
// `description` em vez de `product_uuid`/`product_name`, sem
// `quantity_unit`/`productivity_unit` — o backend não devolve unidade
// nenhuma). `CoberturaEstoque`/`ResultadoPorProduto` consomem estes tipos.

import type { DashboardMeta } from '@/@types/v2/Dashboards/dashboard-meta';

// ─── Bloco #1/#2/#3/#12 — `GET /api/v1/dashboards/home/overview` ──────────
// Permissão `home_dashboard_view`. GAP-FE-255 nível B: `period_months`
// (1|2|3|6|12) agora opcional — ausente = mês corrente (comportamento
// idêntico ao anterior). Honra somente `kpis.*`; `map`/`exceptions` ignoram.

export interface OverviewPanelOverviewFilterRequest {
  period_months?: number;
}

/** Opções do seletor "Período" do cabeçalho — recorte CLIENT-SIDE dos pontos
 * já trazidos por `financial-summary` (13/12 meses); `overview` não tem
 * série própria a cortar. Ajuste 2 (exec. 062, ajustes pós-entrega F-211):
 * 1/2/3/6/12 meses — troca de `'3'|'6'|'10'`; default da tela passa a ser
 * `'6'`. */
export type OverviewPanelPeriod = '1' | '2' | '3' | '6' | '12';

export interface OverviewPanelMapArea {
  uuid: string;
  description: string;
  /** GeoJSON (`Polygon`/`MultiPolygon`) já desserializado pelo backend, ou `null`. */
  coordinates: GeoJSON.GeoJsonObject | null;
  /** Cor já resolvida no servidor (`areas.color`, default `#f6c23e`) — dado de registro, não token de tema. */
  color: string;
  activity_icon_coordinates: GeoJSON.GeoJsonObject | null;
}

export interface OverviewPanelMap {
  farm_coordinates: GeoJSON.GeoJsonObject | null;
  areas: OverviewPanelMapArea[];
}

export interface OverviewPanelKpis {
  realized_income: number;
  realized_expense: number;
  operational_balance: number;
  /**
   * Correção Execução 062 (front F-211, `REVISAO-queries-formulas-F211`,
   * decisão do dono): o KPI que era exposto como "Margem Bruta"
   * (`gross_margin`/`gross_margin_pct`) na verdade é a Margem OPERACIONAL —
   * o backend renomeou o campo e não expõe mais os dois antigos.
   * `operational_margin_pct` = `(receita_realizada - despesa_realizada) /
   * receita_realizada` (== `operational_balance / realized_income`),
   * fração (ex. `0.15` = 15%), mesmo escopo dos demais KPIs do topo (fonte:
   * `GetHomeOverviewDashboardAction::build()`). `null` SÓ quando não há
   * receita realizada no período (divisor da margem é zero — despesa em
   * zero é cenário válido e produz `1.0`) — nesse caso (e só nesse)
   * `meta.lacunas` traz `block_id="kpis.operational_margin_pct"`.
   */
  operational_margin_pct: number | null;
}

export interface OverviewPanelDueSoonTitle {
  type: 'expense' | 'income';
  uuid: string;
  due_date: string;
  amount: number;
  description: string | null;
}

export interface OverviewPanelLowStockProduct {
  uuid: string;
  description: string;
  current_quantity: number;
  min_stock: number;
}

export interface OverviewPanelPendingDfe {
  uuid: string;
  chave: string;
  razao_social: string;
}

export interface OverviewPanelHarvestClosingSoon {
  uuid: string;
  description: string;
  end_date: string;
}

export interface OverviewPanelExceptions {
  due_soon_titles: OverviewPanelDueSoonTitle[];
  low_stock_products: OverviewPanelLowStockProduct[];
  pending_dfe: OverviewPanelPendingDfe[];
  harvests_closing_soon: OverviewPanelHarvestClosingSoon[];
}

export interface OverviewPanelOverviewMeta extends DashboardMeta {
  period?: { start: string; end: string };
}

export interface OverviewPanelOverviewData {
  map: OverviewPanelMap;
  kpis: OverviewPanelKpis;
  exceptions: OverviewPanelExceptions;
  meta?: OverviewPanelOverviewMeta;
}

// ─── Blocos #4/#5/#6/#9/#11 — `GET /api/v1/dashboards/home/financial-summary`
// Permissão `home_financial_dashboard_view`. Filtros opcionais `month`/`year`
// (default: mês corrente no servidor) + GAP-FE-255 nível B: `period_months`
// (1|2|3|6|12) opcional — trunca `monthly_revenue`/`cashflow_projection` no
// servidor (o `year_over_year` continua calculado sobre a série completa
// internamente, antes do truncamento). Ausente = série completa, igual a
// hoje (13/12 meses). Convive com `month`/`year` (eixos diferentes).

export interface OverviewPanelFinancialSummaryFilterRequest {
  month?: number;
  year?: number;
  period_months?: number;
}

/** 1 ponto de `monthly_revenue` — 13 meses (12 anteriores + corrente), chave `YYYY-MM`. */
export interface OverviewPanelMonthlyRevenuePoint {
  month: string;
  realized_income: number;
  predicted_income: number;
}

export interface OverviewPanelYearOverYear {
  previous_year: OverviewPanelMonthlyRevenuePoint | null;
  current_year: OverviewPanelMonthlyRevenuePoint | null;
}

export interface OverviewPanelOperationalResult {
  realized_balance: number;
  predicted_balance: number;
  overdue: { receivable: number; payable: number };
}

export interface OverviewPanelCashflowProjectionMonth {
  month: string;
  projected_net: number;
  accumulated: number;
}

export interface OverviewPanelCashflowProjection {
  starting_balance: number;
  months: OverviewPanelCashflowProjectionMonth[];
}

export interface OverviewPanelForecast {
  receivable: number;
  payable: number;
}

export type OverviewPanelAgingBucketLabel = '0-30' | '31-60' | '61-90' | '90+';

export interface OverviewPanelAgingBucket {
  bucket: OverviewPanelAgingBucketLabel;
  receivable: number;
  payable: number;
}

export interface OverviewPanelRevenueConcentrationClient {
  /**
   * Correção Execução 062 (front F-211, item #4): `null` para a fatia de
   * vendas SEM cliente vinculado no romaneio (`transfers.client_id` nulo).
   * O backend resolve `client_name` para o rótulo fixo `'Sem cliente'`
   * nesse caso (fonte: `HomeFinancialSummaryDashboardRepository::
   * revenueByClient()`), nunca inventa um cliente.
   */
  client_uuid: string | null;
  client_name: string;
  total: number;
}

export interface OverviewPanelRevenueConcentration {
  top: OverviewPanelRevenueConcentrationClient[];
  others_total: number;
}

export interface OverviewPanelFinancialSummaryMeta {
  filters?: { month: number; year: number };
}

export interface OverviewPanelFinancialSummaryData {
  monthly_revenue: OverviewPanelMonthlyRevenuePoint[];
  year_over_year: OverviewPanelYearOverYear;
  operational_result: OverviewPanelOperationalResult;
  cashflow_projection: OverviewPanelCashflowProjection;
  forecast: OverviewPanelForecast;
  aging: OverviewPanelAgingBucket[];
  revenue_concentration: OverviewPanelRevenueConcentration;
  meta?: OverviewPanelFinancialSummaryMeta;
}

// ─── Blocos #7/#8 — COE×COT / Margem operacional (REUSO `income-statement`) ─
// Sem tipo de resposta próprio aqui — o bloco (`CustoProducaoCoeCot.tsx`)
// consome `IncomeStatementRow[]` de `@/@types/v2/Relatorios/income-statement`
// (F-272, já migrado) diretamente. GAP-COE-CODE-EXPOSICAO (contrato de API
// §2.5, opção "(a)" sancionada pelo Front Architect): `IncomeStatementRowResource`
// não expõe `grouper_code` — o bloco casa COE/COT por `description` (fallback
// textual, mesma técnica que o PRÓPRIO backend usa quando `groupers.code`
// não está preenchido no tenant).

// ─── Bloco #10 — Cobertura de estoque (GAP-FE-251 RESOLVIDO) ──────────────
// `GET /api/v1/dashboards/home/stock-coverage` (`home_stock_dashboard_view`)
// — TASK-F211-API-03. Shape REAL (`HomeStockCoverageDashboardResource` ⇒
// envelope fino sobre `GetHomeStockCoverageDashboardAction::build()`):
// `min_stock`/`coverage_days` são `null` quando o produto não tem estoque
// mínimo cadastrado / não teve consumo na janela de `meta.consumption_
// window_days` (90 dias, GAP-06 do contrato de API) — nunca "0" inventado.

export interface OverviewPanelStockCoverageProduct {
  uuid: string;
  description: string;
  current_quantity: number;
  min_stock: number | null;
  is_below_minimum: boolean;
  coverage_days: number | null;
}

export interface OverviewPanelStockCoverageMeta {
  consumption_window_days: number;
}

export interface OverviewPanelStockCoverageData {
  products: OverviewPanelStockCoverageProduct[];
  meta?: OverviewPanelStockCoverageMeta;
}

// ─── Bloco #13 — Resultado por PRODUTO (GAP-FE-251 RESOLVIDO) ─────────────
// `GET /api/v1/dashboards/home/product-result` (`home_product_result_view`)
// — TASK-F211-API-04. Shape REAL (`HomeProductResultDashboardResource` ⇒
// envelope fino sobre `GetHomeProductResultDashboardAction::build()`).
// DEC-284: SEM métricas de custo/margem — a Action nunca monta esses campos,
// então nenhum vaza aqui. `productivity`/`average_price` são `null` quando
// não há área produtiva cadastrada / nenhuma venda do produto (divisão por
// zero evitada na Action, não recalculada no front). O backend NÃO devolve
// unidade nenhuma (`quantity_unit`/`productivity_unit` do tipo provisório da
// Fase A não existem no shape real) — removidos, não inventados.

export interface OverviewPanelProductResultFilterRequest {
  area_id?: string;
  /** GAP-FE-255 nível B (1|2|3|6|12), opcional — filtra `revenue`/
   * `quantity_sold`/`average_price` por `transfers.dt_sale` na janela
   * rolante. Ausente = all-time (comportamento atual). NÃO afeta
   * `quantity_harvested`/`productivity` (GAP-FE255-01, sem data de colheita
   * confiável no backend). */
  period_months?: number;
}

export interface OverviewPanelProductResultProduct {
  uuid: string;
  description: string;
  quantity_harvested: number;
  productivity: number | null;
  revenue: number;
  quantity_sold: number;
  average_price: number | null;
}

export interface OverviewPanelProductResultMeta {
  area_id: string | null;
  productive_area_hectares: number;
}

export interface OverviewPanelProductResultData {
  products: OverviewPanelProductResultProduct[];
  meta?: OverviewPanelProductResultMeta;
}
