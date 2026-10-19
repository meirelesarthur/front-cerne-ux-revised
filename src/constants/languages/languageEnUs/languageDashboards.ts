// src/constants/languages/languageEnUs/languageDashboards.ts
// EN-US translation of the DASHBOARDS module (execução 046, TASK-DASH-FE-04
// — foundation). Canonical only (`titleModule` + `common`); each feature
// (UA/LC/AT/ABC) appends its own per-screen key in this same file.

import { ModuleDashboards } from '@/@types/language/module-dashboards';

export const languageDashboards: ModuleDashboards = {
  titleModule: 'Dashboards',
  common: {
    noData: 'No data for the selected period',
    period: 'Period',
    updatedAt: 'Updated at',
    allSeries: 'All series',
    axis: {
      value: 'Value',
      date: 'Date',
      category: 'Category',
    },
    empty: {
      title: 'No data found',
      description: 'Adjust the filters or the period to see the indicators.',
    },
    error: {
      title: 'Could not load the dashboard',
      description: 'Please try again shortly.',
      retry: 'Try again',
    },
    proxyBadge: {
      label: 'Estimated',
    },
    lacunaNote: {
      label: 'No data',
    },
    noFarm: {
      title: 'Select a farm',
      description: 'Select an active farm to view the control panel.',
    },
  },
  // User Analysis (execução 046, TASK-UA-FE-01).
  userAnalysis: {
    singularLabel: 'UserAnalysis',
    summaryLabel: 'Summary',
    title: 'User Analysis',
    subtitle: "Access, modules and the team's peak hours",
    filter: {
      title: 'Filters',
      period: 'Period',
      periodOptions: {
        d5: 'Last 5 days',
        d15: 'Last 15 days',
        d30: 'Last 30 days',
        d60: 'Last 60 days',
        d90: 'Last 90 days',
      },
      tenant: 'Tenant',
      tenantPlaceholder: 'Select a tenant',
    },
    selectTenant: {
      title: 'Select a tenant',
      description: 'Choose a tenant in the filter to view the user analysis.',
    },
    kpis: {
      activeUsers: 'Active users',
      sessions: 'Sessions in period',
      avgSessionDuration: 'Average session duration',
      uniqueIps: 'Unique IP accesses',
    },
    charts: {
      dailyAccessTitle: 'Daily access',
      dailyAccessSeries: 'Sessions',
      modulesAccessedTitle: 'Most accessed features',
      hourlyPeaksTitle: 'Access peaks by hour',
      hourlyPeaksSeries: 'Accesses',
      hourlyPeaksHourSuffix: 'h',
    },
  },
  // Feedlot Occupancy (execução 046, TASK-LC-FE-01).
  feedlotDashboard: {
    singularLabel: 'FeedlotDashboard',
    title: 'Feedlot Occupancy',
    subtitle: 'Occupancy, status and capacity of the feedlot yard',
    filter: {
      title: 'Filters',
      yard: 'Yard',
      sectors: 'Sectors',
      validation: {
        yardRequired: 'Select a yard',
        sectorsRequired: 'Select at least one sector',
      },
    },
    kpis: {
      occupancyRate: 'Occupancy rate',
      totalAnimals: 'Total animals',
      availableCorrals: 'Available corrals',
      totalCapacity: 'Total capacity',
    },
    charts: {
      statusDistributionTitle: 'Status distribution',
      statusDistributionCenterLabel: 'corrals',
      sectorOccupancyTitle: 'Occupancy by sector (head)',
      sectorOccupancyAllocated: 'Allocated',
      sectorOccupancyAvailable: 'Available',
    },
    history: {
      title: 'Recent status history',
      corral: 'Corral',
      from: 'From',
      to: 'To',
      changedAt: 'Date',
    },
  },
  // Assets (execução 046, TASK-AT-FE-01).
  assetsDashboard: {
    singularLabel: 'Assets',
    maintenanceLabel: 'Maintenance',
    title: 'Assets',
    subtitle: 'Fleet assets, operation and maintenance',
    filter: {
      title: 'Filters',
      period: 'Period',
      periodOptions: {
        m3: 'Last 3 months',
        m6: 'Last 6 months',
        m12: 'Last 12 months',
      },
      families: 'Family',
      status: 'Status',
      statusAllPlaceholder: 'All',
      statusOptions: {
        active: 'Active',
        inactive: 'Inactive',
      },
      proprietary: 'Managing owner',
    },
    kpis: {
      total: 'Total assets',
      inOperation: 'In operation',
      currentValue: 'Asset value',
    },
    charts: {
      byCategoryTitle: 'Assets by category',
      byCategoryTotal: 'Total',
      byCategoryInOperation: 'In operation',
      byStatusTitle: 'Asset status',
      maintenanceByMonthTitle: 'Maintenance by month',
      maintenanceByMonthCorrective: 'Corrective',
      maintenanceByMonthPreventive: 'Preventive',
    },
    status: {
      inOperation: 'In operation',
      inMaintenance: 'In maintenance',
      inactive: 'Inactive',
    },
  },
  // ABC Beef Program (execução 046, TASK-ABC-FE-01) — 14 operational/
  // zootechnical indicators, ZERO financial (`DEC-183`).
  abcIndicators: {
    singularLabel: 'AbcBeefProgram',
    harvestLabel: 'Harvest',
    title: 'ABC Beef Program',
    subtitle: "Module's zootechnical indicators for the period",
    filter: {
      title: 'Filters',
      harvest: 'Harvest',
      grazing: 'Pasture/Module',
      startDate: 'Start date',
      endDate: 'End date',
      validation: {
        grazingRequired: 'Select a pasture/module',
        startDateRequired: 'Enter the start date',
        endDateRequired: 'Enter the end date',
        dateRange: 'Enter a valid date between 12/31/1900 and 12/31/2100',
        endDateBeforeStartDate: 'The end date must be on or after the start date',
      },
    },
    kpis: {
      productivityArrobaHa: 'Productivity',
      dailyWeightGain: 'Daily weight gain',
      capacityRateHa: 'Stocking rate',
      averageWeightOut: 'Average exit weight',
      daysFilled: 'Usage period',
    },
    charts: {
      productionTitle: 'Production for the period',
      productionRearing: 'Rearing production',
      productionSlaughter: 'Slaughter production',
      productionComercialize: 'Sold',
      occupancyTitle: 'Module occupancy',
      occupancyCenterLabel: 'days',
      occupancyFilled: 'Usage period',
      occupancyEmpty: 'Vacancy period',
    },
    detailGrid: {
      title: "Period's zootechnical indicators",
      label: 'Indicator',
      value: 'Value',
      unit: 'Unit',
      totalProductionKg: 'Total production',
      productivityKgHa: 'Productivity',
      capacityRateUa: 'Stocking rate',
      averageEntryWeight: 'Average entry weight',
      averageConsumption: 'Average supplement consumption',
    },
    units: {
      kg: 'kg',
      arroba: '@',
      arrobaHa: '@ LW/ha',
      kgCabDia: 'kg/head/day',
      kgHa: 'kg LW/ha',
      ua: 'AU',
      uaHa: 'AU/ha',
      cabHa: 'head/ha',
      dias: 'days',
      percentPv: '% LW',
    },
    emptyMessage: 'No data returned because there are no stock weighings in the selected period',
  },
  // Rainfall (execução 048, TASK-01-FE) — chave DERIVADA da tradução
  // (`contrato-rainfall-dashboard-norm.md`).
  rainfallDashboard: {
    singularLabel: 'Rainfall',
    title: 'Rain Gauge',
    subtitle: 'Accumulated rainfall, soil moisture and weekly forecast',
    filter: {
      title: 'Filters',
      period: 'Period',
      periodOptions: {
        d30: 'Last 30 days',
        d90: 'Last 90 days',
        m12: 'Last 12 months',
      },
      area: 'Area',
      areaAllPlaceholder: 'All areas',
    },
    kpis: {
      accumulated7d: 'Accumulated (7 days)',
      soilMoisture: 'Soil moisture',
      nextRain: 'Next rain',
      nextRainNoForecast: 'No forecast',
      alerts: 'Active alerts',
      noAlerts: 'No alerts',
    },
    charts: {
      volumeTitle: 'Rainfall volume (mm)',
      volumeSeries: 'Volume (mm)',
      byAreaTitle: 'Accumulated by area',
      byAreaSeries: 'Accumulated (mm)',
    },
    applicationWindow: {
      title: 'Application window',
    },
    weekForecast: {
      title: 'Weekly forecast',
      source: 'Open-Meteo',
      today: 'Today',
    },
  },
  // Cash Book (execução 048, TASK-03-FE) — mirror `DashLivroCaixa.tsx@8663490`.
  cashbookDashboard: {
    singularLabel: 'CashBook',
    title: 'Cash Book',
    subtitle: 'Income, expenses and balance of the farm accounts',
    filter: {
      title: 'Filters',
      year: 'Year',
      proprietary: 'Owner',
      proprietaryAllPlaceholder: 'All',
      operation: 'Movement type',
      operationOptions: {
        all: 'All',
        income: 'Income',
        expense: 'Expense',
      },
    },
    kpis: {
      totalEntrance: 'Total income',
      totalExit: 'Total expenses',
      totalBalance: 'Period balance',
      projectedBalance: 'Projected balance (12m)',
      vsLastYear: 'vs last year',
      projectedBalanceNote: 'Monthly average of months with activity, annualized',
    },
    charts: {
      cashFlowTitle: 'Realized cash flow',
      cashFlowEntrance: 'Income',
      cashFlowExit: 'Expenses',
      cashFlowBalance: 'Balance',
    },
    accounts: {
      title: 'Balance by account',
    },
    movements: {
      title: 'Latest movements',
      month: 'Month',
      columns: {
        date: 'Date',
        document: 'Document',
        person: 'Supplier/Customer',
        type: 'Type',
        value: 'Value',
      },
      noDocument: '—',
      noPerson: '—',
    },
  },
  // Depreciation (execução 048, TASK-02-FE) — mirror `DashDepreciacoes.tsx@8663490`.
  depreciationDashboard: {
    singularLabel: 'Depreciation',
    title: 'Depreciation',
    subtitle: 'Accumulated depreciation, composition and asset projection',
    filter: {
      title: 'Filters',
      year: 'Year',
      assetType: 'Asset type',
      assetTypeOptions: {
        all: 'All',
        equipment: 'Equipment',
        animal: 'Animals',
      },
    },
    kpis: {
      totalAssetValue: 'Asset value (reference)',
      monthlyDepreciation: 'Monthly depreciation',
      accumulatedDepreciation: 'Accumulated depreciation',
      residualValue: 'Residual balance (reference)',
    },
    charts: {
      monthlyTitle: 'Depreciation by category (month)',
      monthlyEquipmentSeries: 'Equipment',
      monthlyAnimalSeries: 'Animals',
      compositionTitle: 'Composition by asset type',
      compositionCenterLabel: 'Residual balance',
      projectionTitle: 'Projection — next 24 months',
      projectionSeries: 'Residual balance',
    },
  },
  // Financial (execução 048, TASK-04-FE) — mirror `DashFinanceiro.tsx@8663490`
  // **MINUS the "Revenue activity by hour" heatmap block (DEC-191 — CUT)**.
  financialDashboard: {
    singularLabel: 'Financial',
    title: 'Financial',
    subtitle: 'Income, expenses, budget and due dates',
    filter: {
      title: 'Filters',
      year: 'Year',
      month: 'Month',
      months: {
        january: 'January',
        february: 'February',
        march: 'March',
        april: 'April',
        may: 'May',
        june: 'June',
        july: 'July',
        august: 'August',
        september: 'September',
        october: 'October',
        november: 'November',
        december: 'December',
      },
      costCenter: 'Cost center',
      costCenterAllPlaceholder: 'All',
    },
    kpis: {
      monthIncomes: 'Income this month',
      monthExpenses: 'Expenses this month',
      monthBalance: 'Available balance',
      overdueTotal: 'Total overdue',
    },
    budget: {
      title: 'Annual budget',
      centerLabel: 'realized',
      realized: 'Realized',
      predicted: 'Predicted',
    },
    overdue: {
      title: 'Overdue payments and receivables',
      payable: 'Payable',
      receivable: 'Receivable',
      detailsAction: 'View details',
      modalTitle: 'Overdue items',
      columns: {
        description: 'Description',
        dueDate: 'Due date',
        amount: 'Amount',
        type: 'Type',
      },
      typeExpense: 'Expense',
      typeIncome: 'Income',
    },
    byCostCenter: {
      title: 'Payables by cost center',
      columns: {
        costCenter: 'Cost center',
        incomes: 'Income',
        expenses: 'Expense',
        balance: 'Result',
      },
    },
    expensesByCategory: {
      title: 'Expenses by category',
      centerLabel: 'this month',
    },
    dueSoon: {
      title: 'Upcoming due dates (30 days)',
      noDescription: '—',
    },
    evolution: {
      title: 'Income vs expenses (12 months)',
      incomesSeries: 'Income',
      expensesSeries: 'Expenses',
    },
  },
  // Beef Cattle (execução 048, TASK-05-FE) — mirror `DashPecuaria.tsx@8663490`.
  // No Productive/Reproductive tabs (dead legacy code, `CV-025/026`).
  livestockDashboard: {
    singularLabel: 'BeefCattle',
    title: 'Beef Cattle',
    subtitle: 'Herd, composition, evolution and financial indicators for the period',
    filter: {
      title: 'Filters',
      harvest: 'Harvest',
      breed: 'Breed',
      breedAllPlaceholder: 'All',
      category: 'Category',
      categoryAllPlaceholder: 'All',
      startDate: 'Start date',
      endDate: 'End date',
      validation: {
        dateRange: 'Enter a valid date between 12/31/1900 and 12/31/2100',
        endDateBeforeStartDate: 'The end date must be greater than or equal to the start date',
      },
    },
    kpis: {
      headcount: 'Total headcount',
      gmd: 'Average daily weight gain',
      arrobaMonth: 'Arrobas/month',
      births: 'Births in period',
      deaths: 'Deaths in period',
    },
    charts: {
      breedTitle: 'Composition by breed',
      breedOthers: 'Other breeds',
      categoryTitle: 'Herd composition (category)',
      categoryOthers: 'Other categories',
      evolutionTitle: 'Herd evolution',
      evolutionSeries: 'Total headcount',
      managementTitle: 'Management events by month',
      managementSeriesWeighings: 'Weighings',
      managementSeriesSanitary: 'Sanitary',
      managementSeriesNutrition: 'Nutrition',
    },
    financial: {
      title: 'Financial indicators',
    },
    formats: {
      currencySuffix: 'R$',
      weightKgSuffix: 'kg',
      weightArrobaSuffix: '@',
      areaHaSuffix: 'ha',
      percentSuffix: '%',
      ratioSuffix: '',
    },
    emptyMessage: 'No herd data found for the selected period',
  },
  // Control Panel / Overview (F-211, execution 062, TASK-FE-211-00) —
  // replaces the launcher at `/home` (Option A). Phase A: header/filter/
  // map/kpis complete; blocks #4-#13 ship with a placeholder `title` only.
  overviewPanel: {
    singularLabel: 'OverviewPanel',
    title: 'Overview',
    greetingMorning: 'Good morning',
    greetingAfternoon: 'Good afternoon',
    greetingEvening: 'Good evening',
    subtitle: 'Season overview',
    subtitleWithFarm: 'Overview · {farm}',
    filter: {
      period: 'Period',
      periodOptions: {
        last1: 'Last month',
        last2: 'Last 2 months',
        last3: 'Last 3 months',
        last6: 'Last 6 months',
        last12: 'Last 12 months',
      },
    },
    map: {
      title: 'Field map',
      badgeCount: '{count} fields',
      emptyTitle: 'No georeferenced field yet',
      emptyDescription: 'Register the field boundaries to see the farm map.',
      tooltip:
        'Registered and active farm fields (geometry and color from the field record itself).',
    },
    kpis: {
      operationalMarginPct: 'Operating margin',
      realizedRevenue: 'Realized revenue',
      operationalBalance: 'Operating balance',
      vsLast30Days: 'vs last 30 days',
      grossMarginPctNote: '{value}% margin over revenue',
      realizedRevenueTooltip:
        'Sum of cash inflows (type E movements) for the farm in the selected period.',
      operationalMarginPctTooltip:
        'Operating margin = operating balance (realized revenue − realized expense) ÷ realized revenue for the period, shown as a percentage. Note: with no realized revenue in the period, the margin cannot be calculated.',
      operationalBalanceTooltip:
        'Operating balance = realized cash inflows − outflows (movements) for the farm in the period. Note: realized cost ≈ 0 ⇒ margin/balance ≈ revenue when there is no cost posted in the period.',
    },
    revenues: {
      title: 'Monthly revenue',
      realized: 'Realized',
      predicted: 'Predicted',
      yoyLabel: '{value}% vs last year',
      tooltip:
        'Monthly realized (cash) vs predicted (due dates) revenue, with year-over-year change for the same month.',
    },
    operationalResult: {
      title: 'Operating result',
      balanceGroup: 'Balance',
      realized: 'Realized',
      predicted: 'Predicted',
      overdue: 'Overdue',
      tooltip:
        'Balance for the month: realized (cash), predicted (due dates), and overdue position (receivable − payable past due).',
    },
    cashflow: {
      title: 'Projected cash flow',
      net: 'Net flow',
      accumulated: 'Accumulated',
      tooltip:
        'Cash projection for the upcoming months: open receivables − payables by due date, accumulated from the month balance.',
    },
    coeCot: {
      title: 'Production cost — COE × COT',
      coeLabel: 'COE — Effective Operating Cost',
      cotLabel: 'COT — Total Operating Cost',
      noCurrentHarvest: 'No active harvest for the current period.',
      tooltip: 'Effective/Total Operating Cost of the current harvest, from the income statement.',
    },
    operationalMargin: {
      title: 'Operating margin',
      tooltip:
        'Operating margin = current month realized revenue − COT of the active harvest (income statement).',
    },
    forecast: {
      title: 'Receivables/payables forecast',
      receivable: 'Receivable',
      payable: 'Payable',
      balance: 'Projected balance',
      coverageNote: 'covers {value}% of payables',
      tooltip:
        'Current open position: total receivable, payable, and projected balance (does not consider the period filter).',
    },
    aging: {
      title: 'Aging of open items',
      receivable: 'Receivable',
      payable: 'Payable',
      daysUnit: 'days',
      tooltip:
        'Overdue open items by aging bucket in days (receivable × payable); current position, independent of the period.',
    },
    stockCoverage: {
      title: 'Stock coverage',
      balanceLabel: 'Balance / Minimum',
      coverageDaysLabel: '{value} days of coverage',
      coverageDaysUnavailable: 'No consumption in the period',
      belowMinimumBadge: 'Below minimum',
      tooltip:
        'Current balance × minimum stock per product and days of coverage (balance ÷ average daily consumption from requisitions in the last 90 days).',
    },
    revenueConcentration: {
      title: 'Revenue concentration',
      othersLabel: 'Others',
      noClientLabel: 'No client',
      alertLabel: '{value}% in 1 buyer',
      centerLabel: 'Total',
      tooltip:
        "Each buyer's share of sales revenue (sale transfers) — currently restricted to the current month.",
    },
    exceptions: {
      title: 'Weekly exceptions',
      incomeDue: 'Receivable due soon',
      expenseDue: 'Payable due soon',
      lowStockPrefix: 'Stock below minimum: {product}',
      pendingDfePrefix: 'DFe pending acknowledgement: {name}',
      harvestClosingPrefix: 'Harvest closing soon: {name}',
      tooltip:
        'Weekly alerts: items due in 7 days, products below minimum stock, pending DFe, and harvests closing soon.',
    },
    productResult: {
      title: 'Result by product',
      columnQuantity: 'Harvested qty.',
      columnRevenue: 'Revenue',
      columnAveragePrice: 'Average price',
      columnProductivity: 'Productivity',
      productivityUnavailable: 'No productive area',
      tooltip:
        'Per product: harvested quantity and productivity (full history) and sales revenue/average price (sale transfers) in the period.',
    },
  },
};
