// src/constants/languages/languagePtBr/languageDashboards.ts
// Tradução PT-BR do módulo DASHBOARDS (execução 046, TASK-DASH-FE-04 —
// fundação). Cobre só o canônico (`titleModule` + `common`); cada feature
// (UA/LC/AT/ABC) acrescenta sua própria chave por-tela neste mesmo arquivo.

import { ModuleDashboards } from '@/@types/language/module-dashboards';

export const languageDashboards: ModuleDashboards = {
  titleModule: 'Dashboards',
  common: {
    noData: 'Sem dados para o período selecionado',
    period: 'Período',
    updatedAt: 'Atualizado em',
    allSeries: 'Todas as séries',
    axis: {
      value: 'Valor',
      date: 'Data',
      category: 'Categoria',
    },
    empty: {
      title: 'Nenhum dado encontrado',
      description: 'Ajuste os filtros ou o período para ver os indicadores.',
    },
    error: {
      title: 'Não foi possível carregar o dashboard',
      description: 'Tente novamente em instantes.',
      retry: 'Tentar novamente',
    },
    proxyBadge: {
      label: 'Estimado',
    },
    lacunaNote: {
      label: 'Sem dado',
    },
    noFarm: {
      title: 'Selecione uma fazenda',
      description: 'Selecione uma fazenda ativa para ver o painel de controle.',
    },
  },
  // Análise de Usuários (execução 046, TASK-UA-FE-01).
  userAnalysis: {
    singularLabel: 'AnaliseUsuarios',
    summaryLabel: 'Resumo',
    title: 'Análise de Usuários',
    subtitle: 'Acessos, módulos e horários de pico da equipe',
    filter: {
      title: 'Filtros',
      period: 'Período',
      periodOptions: {
        d5: 'Últimos 5 dias',
        d15: 'Últimos 15 dias',
        d30: 'Últimos 30 dias',
        d60: 'Últimos 60 dias',
        d90: 'Últimos 90 dias',
      },
      tenant: 'Contratante',
      tenantPlaceholder: 'Selecione um contratante',
    },
    selectTenant: {
      title: 'Selecione um contratante',
      description: 'Escolha um contratante no filtro para visualizar a análise de usuários.',
    },
    kpis: {
      activeUsers: 'Usuários ativos',
      sessions: 'Sessões no período',
      avgSessionDuration: 'Tempo médio de sessão',
      uniqueIps: 'Acessos por IP único',
    },
    charts: {
      dailyAccessTitle: 'Acessos diários',
      dailyAccessSeries: 'Sessões',
      modulesAccessedTitle: 'Funcionalidades mais acessadas',
      hourlyPeaksTitle: 'Picos de acesso por hora',
      hourlyPeaksSeries: 'Acessos',
      hourlyPeaksHourSuffix: 'h',
    },
  },
  // Lotação de Currais (execução 046, TASK-LC-FE-01).
  feedlotDashboard: {
    singularLabel: 'LotacaoCurrais',
    title: 'Lotação de Currais',
    subtitle: 'Ocupação, status e capacidade do pátio de confinamento',
    filter: {
      title: 'Filtros',
      yard: 'Pátio',
      sectors: 'Setores',
      validation: {
        yardRequired: 'Selecione um pátio',
        sectorsRequired: 'Selecione pelo menos um setor',
      },
    },
    kpis: {
      occupancyRate: 'Taxa de ocupação',
      totalAnimals: 'Total de animais',
      availableCorrals: 'Currais disponíveis',
      totalCapacity: 'Capacidade total',
    },
    charts: {
      statusDistributionTitle: 'Distribuição por status',
      statusDistributionCenterLabel: 'currais',
      sectorOccupancyTitle: 'Ocupação por setor (cab.)',
      sectorOccupancyAllocated: 'Alojados',
      sectorOccupancyAvailable: 'Disponível',
    },
    history: {
      title: 'Histórico recente de status',
      corral: 'Curral',
      from: 'De',
      to: 'Para',
      changedAt: 'Data',
    },
  },
  // Ativos (execução 046, TASK-AT-FE-01).
  assetsDashboard: {
    singularLabel: 'Ativos',
    maintenanceLabel: 'Manutencoes',
    title: 'Ativos',
    subtitle: 'Patrimônio, operação e manutenções da frota',
    filter: {
      title: 'Filtros',
      period: 'Período',
      periodOptions: {
        m3: 'Últimos 3 meses',
        m6: 'Últimos 6 meses',
        m12: 'Últimos 12 meses',
      },
      families: 'Família',
      status: 'Status',
      statusAllPlaceholder: 'Todos',
      statusOptions: {
        active: 'Ativo',
        inactive: 'Inativo',
      },
      proprietary: 'Proprietário Gestor',
    },
    kpis: {
      total: 'Total de ativos',
      inOperation: 'Em operação',
      currentValue: 'Valor patrimonial',
    },
    charts: {
      byCategoryTitle: 'Ativos por categoria',
      byCategoryTotal: 'Total',
      byCategoryInOperation: 'Em operação',
      byStatusTitle: 'Status dos ativos',
      maintenanceByMonthTitle: 'Manutenções por mês',
      maintenanceByMonthCorrective: 'Corretiva',
      maintenanceByMonthPreventive: 'Preventiva',
    },
    status: {
      inOperation: 'Em operação',
      inMaintenance: 'Em manutenção',
      inactive: 'Inativo',
    },
  },
  // Programa ABC Corte (execução 046, TASK-ABC-FE-01) — 14 indicadores
  // operacionais/zootécnicos, ZERO financeiro (`DEC-183`).
  abcIndicators: {
    singularLabel: 'ProgramaAbcCorte',
    harvestLabel: 'Safra',
    title: 'Programa ABC Corte',
    subtitle: 'Indicadores zootécnicos do módulo no período',
    filter: {
      title: 'Filtros',
      harvest: 'Safra',
      grazing: 'Pasto/Módulo',
      startDate: 'Data inicial',
      endDate: 'Data final',
      validation: {
        grazingRequired: 'Selecione um pasto/módulo',
        startDateRequired: 'Informe a data inicial',
        endDateRequired: 'Informe a data final',
        dateRange: 'Informe uma data válida entre 31/12/1900 e 31/12/2100',
        endDateBeforeStartDate: 'A data final deve ser maior ou igual à data inicial',
      },
    },
    kpis: {
      productivityArrobaHa: 'Produtividade',
      dailyWeightGain: 'Ganho de peso diário',
      capacityRateHa: 'Taxa de lotação',
      averageWeightOut: 'Peso médio de saída',
      daysFilled: 'Período de uso',
    },
    charts: {
      productionTitle: 'Produção do período',
      productionRearing: 'Produção Recria',
      productionSlaughter: 'Produção Abate',
      productionComercialize: 'Comercializado',
      occupancyTitle: 'Ocupação do módulo',
      occupancyCenterLabel: 'dias',
      occupancyFilled: 'Período de uso',
      occupancyEmpty: 'Período de desocupação',
    },
    detailGrid: {
      title: 'Indicadores zootécnicos do período',
      label: 'Indicador',
      value: 'Valor',
      unit: 'Unidade',
      totalProductionKg: 'Produção Total',
      productivityKgHa: 'Produtividade',
      capacityRateUa: 'Taxa de lotação',
      averageEntryWeight: 'Peso médio de entrada',
      averageConsumption: 'Consumo médio de suplemento',
    },
    units: {
      kg: 'kg',
      arroba: '@',
      arrobaHa: '@ PV/ha',
      kgCabDia: 'kg/cab/dia',
      kgHa: 'kg PV/ha',
      ua: 'UA',
      uaHa: 'UA/ha',
      cabHa: 'cab/ha',
      dias: 'dias',
      percentPv: '% PV',
    },
    emptyMessage: 'Nenhum dado retornado pois não há pesagens de estoque no período selecionado',
  },
  // Pluviometria (execução 048, TASK-01-FE) — chave DERIVADA da tradução
  // (`contrato-rainfall-dashboard-norm.md`).
  rainfallDashboard: {
    singularLabel: 'Pluviometria',
    title: 'Pluviômetro',
    subtitle: 'Chuva acumulada, umidade do solo e previsão da semana',
    filter: {
      title: 'Filtros',
      period: 'Período',
      periodOptions: {
        d30: 'Últimos 30 dias',
        d90: 'Últimos 90 dias',
        m12: 'Últimos 12 meses',
      },
      area: 'Área',
      areaAllPlaceholder: 'Todas as áreas',
    },
    kpis: {
      accumulated7d: 'Acumulado (7 dias)',
      soilMoisture: 'Umidade do solo',
      nextRain: 'Próxima chuva',
      nextRainNoForecast: 'Sem previsão',
      alerts: 'Alertas ativos',
      noAlerts: 'Nenhum alerta',
    },
    charts: {
      volumeTitle: 'Volume pluviométrico (mm)',
      volumeSeries: 'Volume (mm)',
      byAreaTitle: 'Acumulado por área',
      byAreaSeries: 'Acumulado (mm)',
    },
    applicationWindow: {
      title: 'Janela de aplicação',
    },
    weekForecast: {
      title: 'Previsão da semana',
      source: 'Open-Meteo',
      today: 'Hoje',
    },
  },
  // Livro Caixa (execução 048, TASK-03-FE) — fiel a
  // `DashLivroCaixa.tsx@8663490`. Backend JÁ EXISTE (`CashBookDashboardController`).
  cashbookDashboard: {
    singularLabel: 'LivroCaixa',
    title: 'Livro Caixa',
    subtitle: 'Entradas, saídas e saldo das contas da fazenda',
    filter: {
      title: 'Filtros',
      year: 'Ano',
      proprietary: 'Proprietário',
      proprietaryAllPlaceholder: 'Todos',
      operation: 'Tipo de movimentação',
      operationOptions: {
        all: 'Todos',
        income: 'Entrada',
        expense: 'Saída',
      },
    },
    kpis: {
      totalEntrance: 'Total de entradas',
      totalExit: 'Total de saídas',
      totalBalance: 'Saldo do período',
      projectedBalance: 'Saldo projetado (12m)',
      vsLastYear: 'vs ano anterior',
      projectedBalanceNote: 'Média mensal dos meses com lançamento, anualizada',
    },
    charts: {
      cashFlowTitle: 'Fluxo de caixa realizado',
      cashFlowEntrance: 'Entradas',
      cashFlowExit: 'Saídas',
      cashFlowBalance: 'Saldo',
    },
    accounts: {
      title: 'Saldo por conta',
    },
    movements: {
      title: 'Últimas movimentações',
      month: 'Mês',
      columns: {
        date: 'Data',
        document: 'Documento',
        person: 'Fornecedor/Cliente',
        type: 'Tipo',
        value: 'Valor',
      },
      noDocument: '—',
      noPerson: '—',
    },
  },
  // Depreciações (execução 048, TASK-02-FE) — fiel a
  // `DashDepreciacoes.tsx@8663490`, adaptado ao contrato final de API
  // (`year`/`asset_type`, sem preset 3/6/12 nem KPIs de "Valor total em
  // bens"/"Valor residual" — não têm campo agregado por fazenda no contrato
  // aprovado; usa "Valor do bem (âncora)"/"Saldo residual (âncora)" da linha
  // 0 de `forecast_24m`, mais próximos honestamente disponíveis).
  depreciationDashboard: {
    singularLabel: 'Depreciacoes',
    title: 'Depreciações',
    subtitle: 'Depreciação acumulada, composição e projeção do patrimônio',
    filter: {
      title: 'Filtros',
      year: 'Ano',
      assetType: 'Tipo de ativo',
      assetTypeOptions: {
        all: 'Todos',
        equipment: 'Equipamentos',
        animal: 'Animais',
      },
    },
    kpis: {
      totalAssetValue: 'Valor do bem (referência)',
      monthlyDepreciation: 'Depreciação mensal',
      accumulatedDepreciation: 'Depreciação acumulada',
      residualValue: 'Saldo residual (referência)',
    },
    charts: {
      monthlyTitle: 'Depreciação por categoria (mês)',
      monthlyEquipmentSeries: 'Equipamentos',
      monthlyAnimalSeries: 'Animais',
      compositionTitle: 'Composição por tipo de bem',
      compositionCenterLabel: 'Saldo residual',
      projectionTitle: 'Projeção — próximos 24 meses',
      projectionSeries: 'Saldo residual',
    },
  },
  // Financeiro (execução 048, TASK-04-FE) — fiel a
  // `DashFinanceiro.tsx@8663490` **MENOS o bloco de heatmap "Atividade de
  // receita por hora" (DEC-191 — CORTADO, não portar)**.
  financialDashboard: {
    singularLabel: 'Financeiro',
    title: 'Financeiro',
    subtitle: 'Receitas, despesas, orçamento e vencimentos',
    filter: {
      title: 'Filtros',
      year: 'Ano',
      month: 'Mês',
      months: {
        january: 'Janeiro',
        february: 'Fevereiro',
        march: 'Março',
        april: 'Abril',
        may: 'Maio',
        june: 'Junho',
        july: 'Julho',
        august: 'Agosto',
        september: 'Setembro',
        october: 'Outubro',
        november: 'Novembro',
        december: 'Dezembro',
      },
      costCenter: 'Centro de custo',
      costCenterAllPlaceholder: 'Todos',
    },
    kpis: {
      monthIncomes: 'Receitas do mês',
      monthExpenses: 'Despesas do mês',
      monthBalance: 'Saldo disponível',
      overdueTotal: 'Total atrasado',
    },
    budget: {
      title: 'Orçamento anual',
      centerLabel: 'realizado',
      realized: 'Realizado',
      predicted: 'Previsto',
    },
    overdue: {
      title: 'Pagamentos e recebimentos atrasados',
      payable: 'A pagar',
      receivable: 'A receber',
      detailsAction: 'Ver detalhes',
      modalTitle: 'Itens atrasados',
      columns: {
        description: 'Descrição',
        dueDate: 'Vencimento',
        amount: 'Valor',
        type: 'Tipo',
      },
      typeExpense: 'Despesa',
      typeIncome: 'Receita',
    },
    byCostCenter: {
      title: 'Contas a pagar por centro de custo',
      columns: {
        costCenter: 'Centro de custo',
        incomes: 'Receita',
        expenses: 'Despesa',
        balance: 'Resultado',
      },
    },
    expensesByCategory: {
      title: 'Despesas por categoria',
      centerLabel: 'no mês',
    },
    dueSoon: {
      title: 'Vencimentos próximos (30 dias)',
      noDescription: '—',
    },
    evolution: {
      title: 'Receitas vs despesas (12 meses)',
      incomesSeries: 'Receitas',
      expensesSeries: 'Despesas',
    },
  },
  // Pecuária de Corte (execução 048, TASK-05-FE) — fiel a
  // `DashPecuaria.tsx@8663490`. Composição por raça/categoria usa o
  // catálogo REAL (35 raças/42 categorias, DEC-101) — sem os 5 nomes de
  // exemplo do protótipo. Sem abas Produtivo/Reprodutivo (código morto do
  // legado, `CV-025/026`).
  livestockDashboard: {
    singularLabel: 'PecuariaCorte',
    title: 'Pecuária de Corte',
    subtitle: 'Rebanho, composição, evolução e indicadores financeiros do período',
    filter: {
      title: 'Filtros',
      harvest: 'Safra',
      breed: 'Raça',
      breedAllPlaceholder: 'Todas',
      category: 'Categoria',
      categoryAllPlaceholder: 'Todas',
      startDate: 'Data inicial',
      endDate: 'Data final',
      validation: {
        dateRange: 'Informe uma data válida entre 31/12/1900 e 31/12/2100',
        endDateBeforeStartDate: 'A data final deve ser maior ou igual à data inicial',
      },
    },
    kpis: {
      headcount: 'Total de cabeças',
      gmd: 'GMD médio',
      arrobaMonth: 'Arrobas/mês',
      births: 'Nascimentos no período',
      deaths: 'Mortes no período',
    },
    charts: {
      breedTitle: 'Composição por raça',
      breedOthers: 'Outras raças',
      categoryTitle: 'Composição do rebanho (categoria)',
      categoryOthers: 'Outras categorias',
      evolutionTitle: 'Evolução do rebanho',
      evolutionSeries: 'Total de cabeças',
      managementTitle: 'Manejos por mês',
      managementSeriesWeighings: 'Pesagens',
      managementSeriesSanitary: 'Sanitários',
      managementSeriesNutrition: 'Nutrições',
    },
    financial: {
      title: 'Indicadores financeiros',
    },
    formats: {
      currencySuffix: 'R$',
      weightKgSuffix: 'kg',
      weightArrobaSuffix: '@',
      areaHaSuffix: 'ha',
      percentSuffix: '%',
      ratioSuffix: '',
    },
    emptyMessage: 'Nenhum dado de rebanho encontrado para o período selecionado',
  },
  // Painel de Controle / Visão Geral (F-211, execução 062, TASK-FE-211-00) —
  // fiel a `OverviewPanel.tsx@ffe92bc`, substitui o launcher em `/home`
  // (Opção A). Fase A: header/filter/map/kpis completos; blocos #4-#13
  // entram com `title` placeholder (preenchidos pelas Tarefas seguintes).
  overviewPanel: {
    singularLabel: 'PainelControle',
    title: 'Visão geral',
    greetingMorning: 'Bom dia',
    greetingAfternoon: 'Boa tarde',
    greetingEvening: 'Boa noite',
    subtitle: 'Visão geral da safra',
    subtitleWithFarm: 'Visão geral · {farm}',
    filter: {
      period: 'Período',
      periodOptions: {
        last1: 'Último mês',
        last2: 'Últimos 2 meses',
        last3: 'Últimos 3 meses',
        last6: 'Últimos 6 meses',
        last12: 'Últimos 12 meses',
      },
    },
    map: {
      title: 'Mapa dos talhões',
      badgeCount: '{count} talhões',
      emptyTitle: 'Nenhum talhão georreferenciado',
      emptyDescription: 'Cadastre a demarcação das áreas para ver o mapa da fazenda.',
      tooltip:
        'Talhões cadastrados e ativos da fazenda (geometria e cor do próprio cadastro de áreas).',
    },
    kpis: {
      operationalMarginPct: 'Margem operacional',
      realizedRevenue: 'Receitas realizadas',
      operationalBalance: 'Saldo operacional',
      vsLast30Days: 'vs 30 dias',
      grossMarginPctNote: '{value}% de margem sobre a receita',
      realizedRevenueTooltip:
        'Soma das entradas de caixa (movimentações tipo E) da fazenda no período selecionado.',
      operationalMarginPctTooltip:
        'Margem operacional = saldo operacional (receita realizada − despesa realizada) ÷ receita realizada no período, exibida em percentual. Nota: sem receita realizada no período, a margem não pode ser calculada.',
      operationalBalanceTooltip:
        'Saldo operacional = entradas − saídas de caixa realizadas (movimentações) da fazenda no período. Nota: custo realizado ≈ 0 ⇒ margem/saldo ≈ receita quando não há custo lançado no período.',
    },
    revenues: {
      title: 'Receitas mensais',
      realized: 'Realizado',
      predicted: 'Previsto',
      yoyLabel: '{value}% vs ano anterior',
      tooltip:
        'Receita mensal realizada (caixa) vs prevista (vencimentos), com variação ano a ano do mesmo mês.',
    },
    operationalResult: {
      title: 'Resultado operacional',
      balanceGroup: 'Saldo',
      realized: 'Realizado',
      predicted: 'Previsto',
      overdue: 'Atrasado',
      tooltip:
        'Saldo do mês: realizado (caixa), previsto (vencimentos) e posição atrasada (a receber − a pagar vencidos).',
    },
    cashflow: {
      title: 'Fluxo de caixa projetado',
      net: 'Fluxo líquido',
      accumulated: 'Acumulado',
      tooltip:
        'Projeção de caixa dos próximos meses: entradas − saídas em aberto por vencimento, acumuladas a partir do saldo do mês.',
    },
    coeCot: {
      title: 'Custo de produção — COE × COT',
      coeLabel: 'COE — Custo Operacional Efetivo',
      cotLabel: 'COT — Custo Operacional Total',
      noCurrentHarvest: 'Nenhuma safra vigente no período corrente.',
      tooltip:
        'Custo Operacional Efetivo/Total da safra vigente, vindos da DRE (income-statement).',
    },
    operationalMargin: {
      title: 'Margem operacional',
      tooltip:
        'Margem operacional = receita realizada do mês corrente − COT da safra vigente (DRE).',
    },
    forecast: {
      title: 'Previsão a receber/pagar',
      receivable: 'A receber',
      payable: 'A pagar',
      balance: 'Saldo previsto',
      coverageNote: 'cobre {value}% do a pagar',
      tooltip:
        'Posição atual em aberto: total a receber, a pagar e saldo previsto (não considera o filtro de período).',
    },
    aging: {
      title: 'Aging de títulos',
      receivable: 'A receber',
      payable: 'A pagar',
      daysUnit: 'dias',
      tooltip:
        'Títulos vencidos em aberto por faixa de atraso em dias (a receber × a pagar); posição atual, independente do período.',
    },
    stockCoverage: {
      title: 'Cobertura de estoque',
      balanceLabel: 'Saldo / Mínimo',
      coverageDaysLabel: '{value} dias de cobertura',
      coverageDaysUnavailable: 'Sem consumo no período',
      belowMinimumBadge: 'Abaixo do mínimo',
      tooltip:
        'Saldo atual × estoque mínimo por produto e dias de cobertura (saldo ÷ consumo médio de requisições nos últimos 90 dias).',
    },
    revenueConcentration: {
      title: 'Concentração de receita',
      othersLabel: 'Outros',
      noClientLabel: 'Sem cliente',
      alertLabel: '{value}% em 1 comprador',
      centerLabel: 'Total',
      tooltip:
        'Participação de cada comprador na receita de vendas (romaneios de venda) — atualmente restrita ao mês corrente.',
    },
    exceptions: {
      title: 'Exceções da semana',
      incomeDue: 'Recebimento a vencer',
      expenseDue: 'Pagamento a vencer',
      lowStockPrefix: 'Estoque abaixo do mínimo: {product}',
      pendingDfePrefix: 'DFe pendente de manifestação: {name}',
      harvestClosingPrefix: 'Safra fechando em breve: {name}',
      tooltip:
        'Alertas da semana: títulos a vencer em 7 dias, produtos abaixo do estoque mínimo, DFe pendentes e safras fechando.',
    },
    productResult: {
      title: 'Resultado por produto',
      columnQuantity: 'Qtd. colhida',
      columnRevenue: 'Receita',
      columnAveragePrice: 'Preço médio',
      columnProductivity: 'Produtividade',
      productivityUnavailable: 'Sem área produtiva',
      tooltip:
        'Por produto: quantidade colhida e produtividade (todo o histórico) e receita/preço médio de vendas (romaneios de venda) no período.',
    },
  },
};
