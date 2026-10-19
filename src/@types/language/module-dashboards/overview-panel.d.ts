// src/@types/language/module-dashboards/overview-panel.d.ts
// Tipo espelhado da tela Painel de Controle / Visão Geral (F-211, execução
// 062). Fase B (wiring real) completa os blocos #4-#9/#11/#12 com as chaves
// efetivamente consumidas pelos componentes; #10/#13 completados no fix-up
// `GAP-FE-251` (RESOLVIDO — backend materializado em
// `feature/062-painel-controle`) com as chaves reais do wiring.

export interface ModuleDashboardsOverviewPanel {
  /** Usado na composição da query-key (`dashboards.overviewPanel`). */
  singularLabel: string;
  /** Título de fallback (sem `Date` disponível) — na prática, `greetingMorning/Afternoon/Evening` é o exibido. */
  title: string;
  /** Saudação por horário (`hour < 12`) — mirror `OverviewPanel.tsx` UX. */
  greetingMorning: string;
  /** Saudação por horário (`12 <= hour < 18`). */
  greetingAfternoon: string;
  /** Saudação por horário (`hour >= 18`). */
  greetingEvening: string;
  subtitle: string;
  /** `{farm}` substituído pelo nome da fazenda ativa. */
  subtitleWithFarm: string;
  filter: {
    period: string;
    /** Ajuste 2 (exec. 062, ajustes pós-entrega F-211): 1/2/3/6/12 meses — troca de 3/6/10. Default da tela = `last6`. */
    periodOptions: {
      last1: string;
      last2: string;
      last3: string;
      last6: string;
      last12: string;
    };
  };
  map: {
    title: string;
    /** `{count}` substituído pela quantidade de talhões. */
    badgeCount: string;
    emptyTitle: string;
    emptyDescription: string;
    /** Fix wave F-211 (exec. 062, item C): texto de origem do bloco (auditoria `AUDITORIA-cards-kpis-F211.md`, Bloco #2), exibido no tooltip do ícone `FiInfo` flutuante do card (`bare`, sem slot de título). */
    tooltip: string;
  };
  kpis: {
    /** Correção Execução 062 (front F-211, decisão do dono): o KPI que era rotulado "Margem bruta" na verdade é margem OPERACIONAL — renomeado para refletir o campo `operational_margin_pct` do backend. */
    operationalMarginPct: string;
    realizedRevenue: string;
    operationalBalance: string;
    vsLast30Days: string;
    /** Ajuste 1 (exec. 062, ajustes pós-entrega F-211): sub-texto do card com `gross_margin_pct`/hoje `operational_margin_pct` (`{value}` = percentual, 1 casa decimal). Omitido quando o backend não devolve percentual. Substituído pelo item A (fix wave F-211) — o percentual agora é o VALOR PRINCIPAL do card, não mais nota secundária; chave mantida sem uso ativo para não quebrar consumidores externos. */
    grossMarginPctNote: string;
    /** Fix wave F-211 (exec. 062, item C): tooltip do KPI "Receitas realizadas" (auditoria, Bloco de KPIs). */
    realizedRevenueTooltip: string;
    /** Correção Execução 062 (front F-211, decisão do dono): tooltip do KPI "Margem operacional" (ex-"Margem bruta") — margem operacional = saldo operacional ÷ receita realizada no período. */
    operationalMarginPctTooltip: string;
    /** Fix wave F-211 (exec. 062, item C): tooltip do KPI "Saldo operacional" — inclui a mesma nota sobre custo realizado ≈ 0 (auditoria, Bloco de KPIs). */
    operationalBalanceTooltip: string;
  };
  /** Bloco #4 — Receitas mensais realizado×previsto+YoY. */
  revenues: {
    title: string;
    realized: string;
    predicted: string;
    /** `{value}` substituído pelo percentual YoY (com sinal). */
    yoyLabel: string;
    /** Fix wave F-211 (exec. 062, item C): texto de origem do bloco (auditoria, Bloco #4). */
    tooltip: string;
  };
  /** Bloco #5 — Resultado operacional. */
  operationalResult: {
    title: string;
    balanceGroup: string;
    realized: string;
    predicted: string;
    overdue: string;
    /** Fix wave F-211 (exec. 062, item C): texto de origem do bloco (auditoria, Bloco #5). */
    tooltip: string;
  };
  /** Bloco #6 — Fluxo de caixa projetado. */
  cashflow: {
    title: string;
    net: string;
    accumulated: string;
    /** Fix wave F-211 (exec. 062, item C): texto de origem do bloco (auditoria, Bloco #6). */
    tooltip: string;
  };
  /** Blocos #7/#8 — COE×COT (REUSO `income-statement`). */
  coeCot: {
    title: string;
    coeLabel: string;
    cotLabel: string;
    noCurrentHarvest: string;
    /** Fix wave F-211 (exec. 062, item C): texto de origem do bloco (auditoria, Blocos #7/#8). */
    tooltip: string;
  };
  /** Bloco #8 — Margem operacional (gauge). */
  operationalMargin: {
    title: string;
    /** Fix wave F-211 (exec. 062, item C): texto de origem do bloco (auditoria, Blocos #7/#8). */
    tooltip: string;
  };
  /** Bloco #9a — Previsão a receber/pagar/saldo. */
  forecast: {
    title: string;
    receivable: string;
    payable: string;
    balance: string;
    /** `{value}` substituído pelo percentual de cobertura. */
    coverageNote: string;
    /** Fix wave F-211 (exec. 062, item C): texto de origem do bloco (auditoria, Bloco #9a). */
    tooltip: string;
  };
  /** Bloco #9b — Aging de títulos. */
  aging: {
    title: string;
    receivable: string;
    payable: string;
    /** Fix wave I (exec. 062): sufixo de unidade dos rótulos do eixo (buckets viram "0-30 {daysUnit}"). */
    daysUnit: string;
    /** Fix wave F-211 (exec. 062, item C): texto de origem do bloco (auditoria, Bloco #9b). */
    tooltip: string;
  };
  /** Bloco #10 — Cobertura de estoque (GAP-FE-251 RESOLVIDO — wiring real). */
  stockCoverage: {
    title: string;
    /** Rótulo da coluna "saldo atual / mínimo". */
    balanceLabel: string;
    /** `{value}` substituído pelos dias de cobertura derivados (saldo ÷ consumo médio diário). */
    coverageDaysLabel: string;
    /** Exibido quando `coverage_days` é `null` (sem consumo na janela do backend). */
    coverageDaysUnavailable: string;
    belowMinimumBadge: string;
    /** Fix wave F-211 (exec. 062, item C): texto de origem do bloco (auditoria, Bloco #10). */
    tooltip: string;
  };
  /** Bloco #11 — Concentração de receita. */
  revenueConcentration: {
    title: string;
    othersLabel: string;
    /** Correção Execução 062 (front F-211, item #4): rótulo de fallback para a fatia de vendas sem cliente vinculado (`client_uuid: null`), caso o backend não resolva `client_name` (rede de segurança — hoje o backend já resolve para `'Sem cliente'`). */
    noClientLabel: string;
    /** `{value}` substituído pelo percentual do maior comprador. */
    alertLabel: string;
    centerLabel: string;
    /** Fix wave F-211 (exec. 062, item C): texto de origem do bloco (auditoria, Bloco #11). */
    tooltip: string;
  };
  /** Bloco #12 — Exceções da semana. */
  exceptions: {
    title: string;
    incomeDue: string;
    expenseDue: string;
    /** `{product}` substituído pela descrição do produto. */
    lowStockPrefix: string;
    /** `{name}` substituído pela razão social do emissor. */
    pendingDfePrefix: string;
    /** `{name}` substituído pela descrição da safra. */
    harvestClosingPrefix: string;
    /** Fix wave F-211 (exec. 062, item C): texto de origem do bloco (auditoria, Bloco #12). */
    tooltip: string;
  };
  /** Bloco #13 — Resultado por PRODUTO (GAP-FE-251 RESOLVIDO — wiring real). */
  productResult: {
    title: string;
    columnQuantity: string;
    columnRevenue: string;
    columnAveragePrice: string;
    columnProductivity: string;
    /** Exibido quando `productivity`/`average_price` é `null` (sem área produtiva/venda). */
    productivityUnavailable: string;
    /** Fix wave F-211 (exec. 062, item C): texto de origem do bloco (auditoria, Bloco #13). */
    tooltip: string;
  };
}
