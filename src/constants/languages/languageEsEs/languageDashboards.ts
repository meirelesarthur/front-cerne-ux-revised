// src/constants/languages/languageEsEs/languageDashboards.ts
// Traducción ES-ES del módulo DASHBOARDS (execução 046, TASK-DASH-FE-04 —
// fundação). Solo lo canónico (`titleModule` + `common`); cada feature
// (UA/LC/AT/ABC) añade su propia clave por pantalla en este mismo archivo.

import { ModuleDashboards } from '@/@types/language/module-dashboards';

export const languageDashboards: ModuleDashboards = {
  titleModule: 'Dashboards',
  common: {
    noData: 'Sin datos para el período seleccionado',
    period: 'Período',
    updatedAt: 'Actualizado el',
    allSeries: 'Todas las series',
    axis: {
      value: 'Valor',
      date: 'Fecha',
      category: 'Categoría',
    },
    empty: {
      title: 'Ningún dato encontrado',
      description: 'Ajuste los filtros o el período para ver los indicadores.',
    },
    error: {
      title: 'No se pudo cargar el dashboard',
      description: 'Intente nuevamente en unos instantes.',
      retry: 'Intentar de nuevo',
    },
    proxyBadge: {
      label: 'Estimado',
    },
    lacunaNote: {
      label: 'Sin dato',
    },
    noFarm: {
      title: 'Seleccione una finca',
      description: 'Seleccione una finca activa para ver el panel de control.',
    },
  },
  // Análisis de Usuarios (execução 046, TASK-UA-FE-01).
  userAnalysis: {
    singularLabel: 'AnalisisUsuarios',
    summaryLabel: 'Resumen',
    title: 'Análisis de Usuarios',
    subtitle: 'Accesos, módulos y horarios pico del equipo',
    filter: {
      title: 'Filtros',
      period: 'Período',
      periodOptions: {
        d5: 'Últimos 5 días',
        d15: 'Últimos 15 días',
        d30: 'Últimos 30 días',
        d60: 'Últimos 60 días',
        d90: 'Últimos 90 días',
      },
      tenant: 'Contratante',
      tenantPlaceholder: 'Seleccione un contratante',
    },
    selectTenant: {
      title: 'Seleccione un contratante',
      description: 'Elija un contratante en el filtro para ver el análisis de usuarios.',
    },
    kpis: {
      activeUsers: 'Usuarios activos',
      sessions: 'Sesiones en el período',
      avgSessionDuration: 'Duración media de sesión',
      uniqueIps: 'Accesos por IP única',
    },
    charts: {
      dailyAccessTitle: 'Accesos diarios',
      dailyAccessSeries: 'Sesiones',
      modulesAccessedTitle: 'Funcionalidades más accedidas',
      hourlyPeaksTitle: 'Picos de acceso por hora',
      hourlyPeaksSeries: 'Accesos',
      hourlyPeaksHourSuffix: 'h',
    },
  },
  // Ocupación de Corrales (execução 046, TASK-LC-FE-01).
  feedlotDashboard: {
    singularLabel: 'OcupacionCorrales',
    title: 'Ocupación de Corrales',
    subtitle: 'Ocupación, estado y capacidad del patio de confinamiento',
    filter: {
      title: 'Filtros',
      yard: 'Patio',
      sectors: 'Sectores',
      validation: {
        yardRequired: 'Seleccione un patio',
        sectorsRequired: 'Seleccione al menos un sector',
      },
    },
    kpis: {
      occupancyRate: 'Tasa de ocupación',
      totalAnimals: 'Total de animales',
      availableCorrals: 'Corrales disponibles',
      totalCapacity: 'Capacidad total',
    },
    charts: {
      statusDistributionTitle: 'Distribución por estado',
      statusDistributionCenterLabel: 'corrales',
      sectorOccupancyTitle: 'Ocupación por sector (cab.)',
      sectorOccupancyAllocated: 'Alojados',
      sectorOccupancyAvailable: 'Disponible',
    },
    history: {
      title: 'Historial reciente de estado',
      corral: 'Corral',
      from: 'De',
      to: 'Para',
      changedAt: 'Fecha',
    },
  },
  // Activos (execução 046, TASK-AT-FE-01).
  assetsDashboard: {
    singularLabel: 'Activos',
    maintenanceLabel: 'Mantenimientos',
    title: 'Activos',
    subtitle: 'Patrimonio, operación y mantenimientos de la flota',
    filter: {
      title: 'Filtros',
      period: 'Período',
      periodOptions: {
        m3: 'Últimos 3 meses',
        m6: 'Últimos 6 meses',
        m12: 'Últimos 12 meses',
      },
      families: 'Familia',
      status: 'Estado',
      statusAllPlaceholder: 'Todos',
      statusOptions: {
        active: 'Activo',
        inactive: 'Inactivo',
      },
      proprietary: 'Propietario Gestor',
    },
    kpis: {
      total: 'Total de activos',
      inOperation: 'En operación',
      currentValue: 'Valor patrimonial',
    },
    charts: {
      byCategoryTitle: 'Activos por categoría',
      byCategoryTotal: 'Total',
      byCategoryInOperation: 'En operación',
      byStatusTitle: 'Estado de los activos',
      maintenanceByMonthTitle: 'Mantenimientos por mes',
      maintenanceByMonthCorrective: 'Correctiva',
      maintenanceByMonthPreventive: 'Preventiva',
    },
    status: {
      inOperation: 'En operación',
      inMaintenance: 'En mantenimiento',
      inactive: 'Inactivo',
    },
  },
  // Programa ABC Corte (execução 046, TASK-ABC-FE-01) — 14 indicadores
  // operacionales/zootécnicos, CERO financiero (`DEC-183`).
  abcIndicators: {
    singularLabel: 'ProgramaAbcCorte',
    harvestLabel: 'Cosecha',
    title: 'Programa ABC Corte',
    subtitle: 'Indicadores zootécnicos del módulo en el período',
    filter: {
      title: 'Filtros',
      harvest: 'Cosecha',
      grazing: 'Pastura/Módulo',
      startDate: 'Fecha inicial',
      endDate: 'Fecha final',
      validation: {
        grazingRequired: 'Seleccione una pastura/módulo',
        startDateRequired: 'Informe la fecha inicial',
        endDateRequired: 'Informe la fecha final',
        dateRange: 'Informe una fecha válida entre 31/12/1900 y 31/12/2100',
        endDateBeforeStartDate: 'La fecha final debe ser mayor o igual a la fecha inicial',
      },
    },
    kpis: {
      productivityArrobaHa: 'Productividad',
      dailyWeightGain: 'Ganancia de peso diaria',
      capacityRateHa: 'Tasa de carga',
      averageWeightOut: 'Peso medio de salida',
      daysFilled: 'Período de uso',
    },
    charts: {
      productionTitle: 'Producción del período',
      productionRearing: 'Producción Recría',
      productionSlaughter: 'Producción Faena',
      productionComercialize: 'Comercializado',
      occupancyTitle: 'Ocupación del módulo',
      occupancyCenterLabel: 'días',
      occupancyFilled: 'Período de uso',
      occupancyEmpty: 'Período de desocupación',
    },
    detailGrid: {
      title: 'Indicadores zootécnicos del período',
      label: 'Indicador',
      value: 'Valor',
      unit: 'Unidad',
      totalProductionKg: 'Producción Total',
      productivityKgHa: 'Productividad',
      capacityRateUa: 'Tasa de carga',
      averageEntryWeight: 'Peso medio de entrada',
      averageConsumption: 'Consumo medio de suplemento',
    },
    units: {
      kg: 'kg',
      arroba: '@',
      arrobaHa: '@ PV/ha',
      kgCabDia: 'kg/cab/día',
      kgHa: 'kg PV/ha',
      ua: 'UA',
      uaHa: 'UA/ha',
      cabHa: 'cab/ha',
      dias: 'días',
      percentPv: '% PV',
    },
    emptyMessage: 'Ningún dato devuelto porque no hay pesajes de stock en el período seleccionado',
  },
  // Pluviometría (execução 048, TASK-01-FE) — chave DERIVADA da tradução
  // (`contrato-rainfall-dashboard-norm.md`).
  rainfallDashboard: {
    singularLabel: 'Pluviometría',
    title: 'Pluviómetro',
    subtitle: 'Lluvia acumulada, humedad del suelo y previsión semanal',
    filter: {
      title: 'Filtros',
      period: 'Período',
      periodOptions: {
        d30: 'Últimos 30 días',
        d90: 'Últimos 90 días',
        m12: 'Últimos 12 meses',
      },
      area: 'Área',
      areaAllPlaceholder: 'Todas las áreas',
    },
    kpis: {
      accumulated7d: 'Acumulado (7 días)',
      soilMoisture: 'Humedad del suelo',
      nextRain: 'Próxima lluvia',
      nextRainNoForecast: 'Sin previsión',
      alerts: 'Alertas activas',
      noAlerts: 'Ninguna alerta',
    },
    charts: {
      volumeTitle: 'Volumen pluviométrico (mm)',
      volumeSeries: 'Volumen (mm)',
      byAreaTitle: 'Acumulado por área',
      byAreaSeries: 'Acumulado (mm)',
    },
    applicationWindow: {
      title: 'Ventana de aplicación',
    },
    weekForecast: {
      title: 'Previsión semanal',
      source: 'Open-Meteo',
      today: 'Hoy',
    },
  },
  // Libro Caja (execução 048, TASK-03-FE) — fiel a
  // `DashLivroCaixa.tsx@8663490`.
  cashbookDashboard: {
    singularLabel: 'LibroCaja',
    title: 'Libro Caja',
    subtitle: 'Ingresos, gastos y saldo de las cuentas de la finca',
    filter: {
      title: 'Filtros',
      year: 'Año',
      proprietary: 'Propietario',
      proprietaryAllPlaceholder: 'Todos',
      operation: 'Tipo de movimiento',
      operationOptions: {
        all: 'Todos',
        income: 'Ingreso',
        expense: 'Gasto',
      },
    },
    kpis: {
      totalEntrance: 'Total de ingresos',
      totalExit: 'Total de gastos',
      totalBalance: 'Saldo del período',
      projectedBalance: 'Saldo proyectado (12m)',
      vsLastYear: 'vs año anterior',
      projectedBalanceNote: 'Promedio mensual de los meses con movimiento, anualizado',
    },
    charts: {
      cashFlowTitle: 'Flujo de caja realizado',
      cashFlowEntrance: 'Ingresos',
      cashFlowExit: 'Gastos',
      cashFlowBalance: 'Saldo',
    },
    accounts: {
      title: 'Saldo por cuenta',
    },
    movements: {
      title: 'Últimos movimientos',
      month: 'Mes',
      columns: {
        date: 'Fecha',
        document: 'Documento',
        person: 'Proveedor/Cliente',
        type: 'Tipo',
        value: 'Valor',
      },
      noDocument: '—',
      noPerson: '—',
    },
  },
  // Depreciaciones (execução 048, TASK-02-FE) — fiel a
  // `DashDepreciacoes.tsx@8663490`.
  depreciationDashboard: {
    singularLabel: 'Depreciaciones',
    title: 'Depreciaciones',
    subtitle: 'Depreciación acumulada, composición y proyección del patrimonio',
    filter: {
      title: 'Filtros',
      year: 'Año',
      assetType: 'Tipo de activo',
      assetTypeOptions: {
        all: 'Todos',
        equipment: 'Equipos',
        animal: 'Animales',
      },
    },
    kpis: {
      totalAssetValue: 'Valor del bien (referencia)',
      monthlyDepreciation: 'Depreciación mensual',
      accumulatedDepreciation: 'Depreciación acumulada',
      residualValue: 'Saldo residual (referencia)',
    },
    charts: {
      monthlyTitle: 'Depreciación por categoría (mes)',
      monthlyEquipmentSeries: 'Equipos',
      monthlyAnimalSeries: 'Animales',
      compositionTitle: 'Composición por tipo de bien',
      compositionCenterLabel: 'Saldo residual',
      projectionTitle: 'Proyección — próximos 24 meses',
      projectionSeries: 'Saldo residual',
    },
  },
  // Financiero (execução 048, TASK-04-FE) — fiel a
  // `DashFinanceiro.tsx@8663490` **MENOS el bloque de heatmap (DEC-191 —
  // CORTADO)**.
  financialDashboard: {
    singularLabel: 'Financiero',
    title: 'Financiero',
    subtitle: 'Ingresos, gastos, presupuesto y vencimientos',
    filter: {
      title: 'Filtros',
      year: 'Año',
      month: 'Mes',
      months: {
        january: 'Enero',
        february: 'Febrero',
        march: 'Marzo',
        april: 'Abril',
        may: 'Mayo',
        june: 'Junio',
        july: 'Julio',
        august: 'Agosto',
        september: 'Septiembre',
        october: 'Octubre',
        november: 'Noviembre',
        december: 'Diciembre',
      },
      costCenter: 'Centro de costo',
      costCenterAllPlaceholder: 'Todos',
    },
    kpis: {
      monthIncomes: 'Ingresos del mes',
      monthExpenses: 'Gastos del mes',
      monthBalance: 'Saldo disponible',
      overdueTotal: 'Total atrasado',
    },
    budget: {
      title: 'Presupuesto anual',
      centerLabel: 'realizado',
      realized: 'Realizado',
      predicted: 'Previsto',
    },
    overdue: {
      title: 'Pagos y cobros atrasados',
      payable: 'A pagar',
      receivable: 'A cobrar',
      detailsAction: 'Ver detalles',
      modalTitle: 'Ítems atrasados',
      columns: {
        description: 'Descripción',
        dueDate: 'Vencimiento',
        amount: 'Valor',
        type: 'Tipo',
      },
      typeExpense: 'Gasto',
      typeIncome: 'Ingreso',
    },
    byCostCenter: {
      title: 'Cuentas por pagar por centro de costo',
      columns: {
        costCenter: 'Centro de costo',
        incomes: 'Ingreso',
        expenses: 'Gasto',
        balance: 'Resultado',
      },
    },
    expensesByCategory: {
      title: 'Gastos por categoría',
      centerLabel: 'en el mes',
    },
    dueSoon: {
      title: 'Próximos vencimientos (30 días)',
      noDescription: '—',
    },
    evolution: {
      title: 'Ingresos vs gastos (12 meses)',
      incomesSeries: 'Ingresos',
      expensesSeries: 'Gastos',
    },
  },
  // Ganado de Corte (execução 048, TASK-05-FE) — fiel a
  // `DashPecuaria.tsx@8663490`. Sin pestañas Productivo/Reproductivo
  // (código muerto del legado, `CV-025/026`).
  livestockDashboard: {
    singularLabel: 'GanadoCorte',
    title: 'Ganado de Corte',
    subtitle: 'Rebaño, composición, evolución e indicadores financieros del período',
    filter: {
      title: 'Filtros',
      harvest: 'Zafra',
      breed: 'Raza',
      breedAllPlaceholder: 'Todas',
      category: 'Categoría',
      categoryAllPlaceholder: 'Todas',
      startDate: 'Fecha inicial',
      endDate: 'Fecha final',
      validation: {
        dateRange: 'Ingrese una fecha válida entre 31/12/1900 y 31/12/2100',
        endDateBeforeStartDate: 'La fecha final debe ser mayor o igual a la fecha inicial',
      },
    },
    kpis: {
      headcount: 'Total de cabezas',
      gmd: 'GMD promedio',
      arrobaMonth: 'Arrobas/mes',
      births: 'Nacimientos en el período',
      deaths: 'Muertes en el período',
    },
    charts: {
      breedTitle: 'Composición por raza',
      breedOthers: 'Otras razas',
      categoryTitle: 'Composición del rebaño (categoría)',
      categoryOthers: 'Otras categorías',
      evolutionTitle: 'Evolución del rebaño',
      evolutionSeries: 'Total de cabezas',
      managementTitle: 'Manejos por mes',
      managementSeriesWeighings: 'Pesajes',
      managementSeriesSanitary: 'Sanitarios',
      managementSeriesNutrition: 'Nutriciones',
    },
    financial: {
      title: 'Indicadores financieros',
    },
    formats: {
      currencySuffix: 'R$',
      weightKgSuffix: 'kg',
      weightArrobaSuffix: '@',
      areaHaSuffix: 'ha',
      percentSuffix: '%',
      ratioSuffix: '',
    },
    emptyMessage: 'Ningún dato de rebaño encontrado para el período seleccionado',
  },
  // Panel de Control / Visión General (F-211, ejecución 062, TASK-FE-211-00)
  // — reemplaza el launcher en `/home` (Opción A). Fase A: header/filter/
  // map/kpis completos; bloques #4-#13 solo con `title` placeholder.
  overviewPanel: {
    singularLabel: 'PanelControl',
    title: 'Visión general',
    greetingMorning: 'Buenos días',
    greetingAfternoon: 'Buenas tardes',
    greetingEvening: 'Buenas noches',
    subtitle: 'Visión general de la zafra',
    subtitleWithFarm: 'Visión general · {farm}',
    filter: {
      period: 'Período',
      periodOptions: {
        last1: 'Último mes',
        last2: 'Últimos 2 meses',
        last3: 'Últimos 3 meses',
        last6: 'Últimos 6 meses',
        last12: 'Últimos 12 meses',
      },
    },
    map: {
      title: 'Mapa de los lotes',
      badgeCount: '{count} lotes',
      emptyTitle: 'Ningún lote georreferenciado',
      emptyDescription: 'Registre la demarcación de las áreas para ver el mapa de la finca.',
      tooltip:
        'Lotes registrados y activos de la finca (geometría y color del propio registro de áreas).',
    },
    kpis: {
      operationalMarginPct: 'Margen operativo',
      realizedRevenue: 'Ingresos realizados',
      operationalBalance: 'Saldo operativo',
      vsLast30Days: 'vs 30 días',
      grossMarginPctNote: '{value}% de margen sobre el ingreso',
      realizedRevenueTooltip:
        'Suma de las entradas de caja (movimientos tipo E) de la finca en el período seleccionado.',
      operationalMarginPctTooltip:
        'Margen operativo = saldo operativo (ingreso realizado − gasto realizado) ÷ ingreso realizado en el período, mostrado en porcentaje. Nota: sin ingreso realizado en el período, el margen no puede calcularse.',
      operationalBalanceTooltip:
        'Saldo operativo = entradas − salidas de caja realizadas (movimientos) de la finca en el período. Nota: costo realizado ≈ 0 ⇒ margen/saldo ≈ ingreso cuando no hay costo registrado en el período.',
    },
    revenues: {
      title: 'Ingresos mensuales',
      realized: 'Realizado',
      predicted: 'Previsto',
      yoyLabel: '{value}% vs año anterior',
      tooltip:
        'Ingreso mensual realizado (caja) vs previsto (vencimientos), con variación interanual del mismo mes.',
    },
    operationalResult: {
      title: 'Resultado operativo',
      balanceGroup: 'Saldo',
      realized: 'Realizado',
      predicted: 'Previsto',
      overdue: 'Atrasado',
      tooltip:
        'Saldo del mes: realizado (caja), previsto (vencimientos) y posición atrasada (por cobrar − por pagar vencidos).',
    },
    cashflow: {
      title: 'Flujo de caja proyectado',
      net: 'Flujo neto',
      accumulated: 'Acumulado',
      tooltip:
        'Proyección de caja de los próximos meses: entradas − salidas en abierto por vencimiento, acumuladas desde el saldo del mes.',
    },
    coeCot: {
      title: 'Costo de producción — COE × COT',
      coeLabel: 'COE — Costo Operativo Efectivo',
      cotLabel: 'COT — Costo Operativo Total',
      noCurrentHarvest: 'Ninguna zafra vigente en el período actual.',
      tooltip: 'Costo Operativo Efectivo/Total de la zafra vigente, del estado de resultados.',
    },
    operationalMargin: {
      title: 'Margen operativo',
      tooltip:
        'Margen operativo = ingreso realizado del mes corriente − COT de la zafra vigente (estado de resultados).',
    },
    forecast: {
      title: 'Previsión de cobros/pagos',
      receivable: 'Por cobrar',
      payable: 'Por pagar',
      balance: 'Saldo previsto',
      coverageNote: 'cubre el {value}% de lo por pagar',
      tooltip:
        'Posición actual en abierto: total por cobrar, por pagar y saldo previsto (no considera el filtro de período).',
    },
    aging: {
      title: 'Antigüedad de saldos',
      receivable: 'Por cobrar',
      payable: 'Por pagar',
      daysUnit: 'días',
      tooltip:
        'Títulos vencidos en abierto por rango de atraso en días (por cobrar × por pagar); posición actual, independiente del período.',
    },
    stockCoverage: {
      title: 'Cobertura de inventario',
      balanceLabel: 'Saldo / Mínimo',
      coverageDaysLabel: '{value} días de cobertura',
      coverageDaysUnavailable: 'Sin consumo en el período',
      belowMinimumBadge: 'Por debajo del mínimo',
      tooltip:
        'Saldo actual × stock mínimo por producto y días de cobertura (saldo ÷ consumo medio de requisiciones en los últimos 90 días).',
    },
    revenueConcentration: {
      title: 'Concentración de ingresos',
      othersLabel: 'Otros',
      noClientLabel: 'Sin cliente',
      alertLabel: '{value}% en 1 comprador',
      centerLabel: 'Total',
      tooltip:
        'Participación de cada comprador en el ingreso de ventas (remitos de venta) — actualmente restringida al mes corriente.',
    },
    exceptions: {
      title: 'Excepciones de la semana',
      incomeDue: 'Cobro por vencer',
      expenseDue: 'Pago por vencer',
      lowStockPrefix: 'Inventario por debajo del mínimo: {product}',
      pendingDfePrefix: 'DFe pendiente de manifestación: {name}',
      harvestClosingPrefix: 'Zafra por cerrar pronto: {name}',
      tooltip:
        'Alertas de la semana: títulos por vencer en 7 días, productos por debajo del stock mínimo, DFe pendientes y zafras por cerrar.',
    },
    productResult: {
      title: 'Resultado por producto',
      columnQuantity: 'Cant. cosechada',
      columnRevenue: 'Ingresos',
      columnAveragePrice: 'Precio promedio',
      columnProductivity: 'Productividad',
      productivityUnavailable: 'Sin área productiva',
      tooltip:
        'Por producto: cantidad cosechada y productividad (todo el historial) e ingresos/precio promedio de ventas (remitos de venta) en el período.',
    },
  },
};
