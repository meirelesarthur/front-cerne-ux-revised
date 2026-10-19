// src/constants/languages/languageEsEs/languageApuracaoCusto.ts
// Traducción ES del módulo "Apuración de Custo" (informe financiero — F-245,
// esteira 97-Esteiras/073, TASK-245-FE-02). Mirror de
// `languagePtBr/languageApuracaoCusto.ts`.

import { ModuleCostCalculationReport } from '@/@types/language/module-cost-calculation-report';

export const languageApuracaoCusto: ModuleCostCalculationReport = {
  report: {
    pageTitle: 'Cálculo de Costo',
    pageSubtitle: 'Informe de cálculo de costo de la finca activa.',
    fields: {
      startDate: 'Fecha Inicio',
      endDate: 'Fecha Fin',
      farm: 'Finca',
      costCenters: 'Centro de Costo',
      accounts: 'Cuenta Bancaria',
      orderBy: 'Ordenar por',
      reportType: 'Tipo de Informe',
    },
    farmPlaceholder: 'Todas',
    costCentersPlaceholder: 'Todos los centros de costo',
    accountsPlaceholder: 'Todas las cuentas bancarias',
    // El legado sólo existe en PT-BR ("+ Antigo"/"+ Recente") — traducción
    // manteniendo el sentido "más antiguo primero"/"más reciente primero".
    orderByOptions: {
      asc: '+ Antiguo',
      desc: '+ Reciente',
    },
    reportTypeOptions: {
      pdf: 'PDF',
      excel: 'Excel',
    },
    periodRequiredHint: 'Informe el período (Fecha Inicio y Fecha Fin) para generar el informe.',
    filterButton: 'Filtrar',
    printButton: 'Imprimir',
    downloadError: 'No fue posible generar el informe.',
    previewError: 'No fue posible cargar la vista previa del informe.',
    retryButton: 'Intentar de nuevo',
    emptyBeforeFilter: 'Complete los filtros y haga clic en Filtrar.',
    emptyReport: 'No se encontró ninguna información.',
    validation: {
      periodRequired: 'El período (Fecha Inicio y Fecha Fin) es obligatorio.',
    },
  },
};
