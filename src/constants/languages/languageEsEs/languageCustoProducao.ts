// src/constants/languages/languageEsEs/languageCustoProducao.ts
// Traducción ES del módulo "Custo de Produção" (Costo de Producción — informe
// financiero — F-272, esteira 97-Esteiras/073, TASK-272-FE-02/03). Mirror de
// `languagePtBr/languageCustoProducao.ts`.

import { ModuleIncomeStatementReport } from '@/@types/language/module-income-statement-report';

export const languageCustoProducao: ModuleIncomeStatementReport = {
  report: {
    pageTitle: 'Costo de Producción',
    pageSubtitle: 'Estado de Resultados — Costo de Producción por Período.',
    fields: {
      group: 'Régimen',
      type: 'Tipo',
      startDate: 'Fecha Inicio',
      endDate: 'Fecha Fin',
      calculationModule: 'Módulo de Cálculo',
      farm: 'Finca',
      proprietary: 'Propietario',
      hasStock: '¿Muestra Stock?',
      harvest: 'Cosecha',
      costCenters: 'Centro de Costo',
      reportType: 'Tipo de Informe',
    },
    groupOptions: {
      cash: 'Caja',
      accrual: 'Devengo',
    },
    typeOptions: {
      synthetic: 'Sintético',
      analytical: 'Analítico',
    },
    calculationModuleOptions: {
      financial: 'Financiero',
      appropriation: 'Apunte (Consumo de Stock)',
    },
    calculationModuleTooltip:
      'Financiero considera los movimientos financieros del período; Apunte (Consumo de Stock) considera el consumo de stock apuntado.',
    hasStockOptions: {
      no: 'No',
      yes: 'Sí',
    },
    hasStockTooltip:
      'Cuando está marcado, incluye la variación de stock de insumos/producción en la fecha final del período.',
    reportTypeOptions: {
      pdf: 'PDF',
      excel: 'Excel',
    },
    farmPlaceholder: 'Todas',
    proprietaryPlaceholder: 'Seleccione el propietario',
    harvestPlaceholder: 'Seleccione la cosecha',
    costCentersPlaceholder: 'Todos los centros de costo',
    periodRequiredHint: 'Informe el período (Fecha Inicio y Fecha Fin) para generar el informe.',
    filterButton: 'Filtrar',
    downloadButton: 'Descargar',
    downloadError: 'No fue posible generar el informe.',
    previewError: 'No fue posible cargar la vista previa del informe.',
    retryButton: 'Intentar de nuevo',
    emptyBeforeFilter: 'Complete los filtros y haga clic en Filtrar.',
    emptyReport: 'No se encontró ninguna información.',
    table: {
      descriptionColumn: 'Descripción',
      valueColumn: 'Valor',
      percentColumn: '%',
    },
    drilldown: {
      totalRowLabel: 'Total',
      category: {
        title: 'Detalle por Categoría',
        dateColumn: 'Fecha',
        personColumn: 'Cliente/Proveedor',
        categoryColumn: 'Categoría',
        noteColumn: 'Histórico',
        valueColumn: 'Valor',
      },
      depreciation: {
        title: 'Detalle de Depreciación',
        yearMonthColumn: 'Año/Mes',
        familyColumn: 'Familia',
        equipmentColumn: 'Máquina/Equipo',
        valueColumn: 'Valor',
      },
      apportionment: {
        title: 'Detalle de Prorrateo',
        dateColumn: 'Fecha',
        personColumn: 'Cliente/Proveedor',
        centerColumn: 'Centro de Costo',
        noteColumn: 'Histórico',
        originalValueColumn: 'Vl. Original',
        percentageColumn: 'Porcentaje',
        apportionedValueColumn: 'Vl. Prorrateado',
      },
    },
    validation: {
      groupRequired: 'El Régimen es obligatorio.',
      typeRequired: 'El Tipo es obligatorio.',
      periodRequired: 'El período (Fecha Inicio y Fecha Fin) es obligatorio.',
      calculationModuleRequired: 'El Módulo de Cálculo es obligatorio.',
    },
  },
};
