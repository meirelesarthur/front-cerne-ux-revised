// src/constants/languages/languageEsEs/languageFinancialOfxImport.ts
// Traducción ES-ES del Informe de Conciliación de Cuentas Consolidadas
// (RelatorioConsolidado — SURF-033/034). Espejo de
// `languagePtBr/languageFinancialOfxImport.ts` (misma forma de claves).
//
// ALCANCE REDUCIDO (TASK-065-OFX-FE-01, reconciliación de merge 065): solo
// `consolidatedReport` sobrevive — las demás secciones fueron eliminadas,
// pantallas descartadas/reconstruidas bajo `languageOfxImports` (módulo
// propio).

import type { OfxImportLanguage } from '@/@types/language/module-financial/ofx-import';

export const languageFinancialOfxImport: OfxImportLanguage = {
  singularLabel: 'Importación OFX',
  pluralLabel: 'Importaciones OFX',

  consolidatedReport: {
    pageTitle: 'Informe de Conciliación de Cuentas Consolidadas',
    pageSubtitle: 'Informe consolidado de conciliación por categoría/centro de costo.',
    accountLabel: 'Cuenta',
    accountPlaceholder: 'Todas las cuentas',
    startDate: 'Fecha Inicio',
    endDate: 'Fecha Fin',
    conditionLabel: 'Categoría/Centro de Costo',
    conditionOptions: { withoutCategory: 'Sin Categoría', withCategory: 'Con Categoría' },
    providerLabel: 'Proveedor',
    providerPlaceholder: 'Todos los proveedores',
    clientLabel: 'Cliente',
    clientPlaceholder: 'Todos los clientes',
    orderByLabel: 'Ordenar por',
    orderByOptions: { recent: 'Más reciente', oldest: 'Más antiguo' },
    periodRequiredHint: 'Seleccione el período (Fecha Inicio y Fecha Fin) para generar el informe.',
    downloadPdfButton: 'Exportar PDF',
    downloadExcelButton: 'Exportar Excel',
    downloadError: 'No fue posible generar el informe.',
    emptyState: 'Ningún resultado para los filtros informados.',
    // NUEVOS (F-213, lote 079, rework FE) — tabla de vista previa en pantalla.
    filterButton: 'Filtrar',
    emptyBeforeFilter: 'Complete el período y haga clic en "Filtrar" para ver el informe.',
    previewError: 'No fue posible cargar el informe.',
    retryButton: 'Intentar de nuevo',
    recordsCount: (count: number) => `N. Registros: ${count}`,
    table: {
      document: 'Documento',
      participant: 'Participante',
      movementType: 'Tipo de Movimiento',
      date: 'Fecha de Consolidación',
      account: 'Cuenta',
      value: 'Valor',
      category: 'Categoría',
      center: 'Centro de Costo',
    },
    movementTypes: {
      income: 'Entrada',
      expense: 'Salida',
      both: 'Ambos',
      internalTransaction: 'Transacción Interna',
      movement: 'Movimiento',
      financing: 'Financiamiento',
    },
  },
};
