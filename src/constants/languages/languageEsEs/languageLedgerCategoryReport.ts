// src/constants/languages/languageEsEs/languageLedgerCategoryReport.ts
// Traducción ES-ES del módulo "Razón Categoría" (informe Financiero —
// F-273, CONTRATO-F273-razao-categoria.md, ejecución 059). Mirror
// estructural del bloque `report` de `languageCashFlowByCategoryReport.ts`.

import { ModuleLedgerCategoryReport } from '@/@types/language/module-ledger-category-report';

export const languageLedgerCategoryReport: ModuleLedgerCategoryReport = {
  report: {
    pageTitle: 'Razón Categoría',
    pageSubtitle:
      'Informe de razón por categoría financiera, en el período y filtros seleccionados.',
    fields: {
      startDate: 'Fecha Inicial',
      endDate: 'Fecha Final',
      farm: 'Finca',
      proprietary: 'Propietario',
      costCenter: 'Centro de Costo',
      categories: 'Categorías',
      format: 'Formato',
    },
    proprietaryPlaceholder: 'Seleccione el propietario',
    costCenterPlaceholder: 'Seleccione el centro de costo',
    farmPlaceholder: 'Seleccione la finca',
    lookupSearchPlaceholder: 'Buscar categoría...',
    selectAll: 'Seleccionar todos',
    deselectAll: 'Quitar selección',
    lookupEmptyMessage: 'No se encontraron categorías.',
    generateButton: 'Generar informe',
    downloadSuccess: 'Informe generado con éxito.',
    downloadError: 'No fue posible generar el informe.',
    validation: {
      periodRequired: 'La fecha es obligatoria.',
      periodOrder: 'La Fecha Final debe ser igual o posterior a la Fecha Inicial.',
    },
  },
};
