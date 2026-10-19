// src/@types/language/module-supply-dashboard/index.ts
// -----------------------------------------------------------------------------
// Interface de tradução do módulo "Suprimentos" (SupplyDashboard —
// Dashboards, esteira 97-Esteiras/019, Tarefas 55-58, reformulação v2).
// Chave PLANA de primeiro nível em `LanguageDate` (`supplyDashboard`,
// TOP-LEVEL, mirror `supplyStatusSlaReport`) — DISTINTA de
// `supplyStatusSlas`/`supplyStatusSlaReport` (módulos de config/relatório,
// sem colisão de namespace).
//
// `byType`/`totals` (payload v1) foram REMOVIDOS nesta reformulação (D-05 do
// PRD — `SupplyByTypeGrid`/`SupplyTotalsPanel` saem por completo, sem chave
// órfã). Entram `kpis`/`funnel`/`providers`, 1:1 com as 3 fileiras novas
// (Tarefas 56/57/58).
//
// O conteúdo mora em
// src/constants/languages/{idioma}/languageSupplyDashboard.ts.
// -----------------------------------------------------------------------------

export interface ModuleSupplyDashboard {
  titleModule: string;
  pageTitle: string;
  filter: {
    title: string;
    farms: string;
    farmsSearchPlaceholder: string;
    farmsSelectedCount: string;
    harvest: string;
    harvestPlaceholder: string;
    startDate: string;
    endDate: string;
  };
  errors: {
    loadFailed: string;
  };
  /** Rótulo do período aplicado, exibido no `DashboardHeader.subtitle`. */
  period: {
    label: string;
  };
  /** Fileira 1 — KPIs com sparkline (Tarefa 56, contrato de tela v2 §5.2/§6.2). */
  kpis: {
    /** Sufixo do trend quando `variation_percentage` não é `null` (ex.: "vs. mês anterior"). */
    vsPreviousPeriod: string;
    /** Texto alternativo quando `variation_percentage === null` (cresceu de base zero). */
    noBaseline: string;
  };
  /** Fileira 2 — Funil de suprimentos (Tarefa 57, contrato de tela v2 §5.3/§6.3). */
  funnel: {
    title: string;
    /** Sufixo da pílula de taxa final (ex.: "13,4% taxa final"). */
    finalConversionRate: string;
    /** Sufixo do sublabel de conversão por estágio (ex.: "23,6% conv."). */
    conversionSuffix: string;
    averageValue: string;
    leadTime: string;
    actualDuration: string;
  };
  /** Fileira 3 — Top fornecedores (Tarefa 58, contrato de tela v2 §5.4/§6.1). */
  providers: {
    title: string;
    /** Mensagem DENTRO do card quando `top_providers: []` (RF-08, nunca `EmptyState` de página). */
    empty: string;
    badge: {
      excellent: string;
      good: string;
      regular: string;
    };
  };
}
