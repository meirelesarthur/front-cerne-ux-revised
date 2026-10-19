// src/constants/languages/languageEsEs/languageFiscalDifferenceReport.ts
// Traducción ES-ES del módulo "Fiscal/No Fiscal" — F-266, lote 076. Mirror de
// `languagePtBr/languageFiscalDifferenceReport.ts`.

import { ModuleFiscalDifferenceReport } from '@/@types/language/module-fiscal-difference-report';

export const languageFiscalDifferenceReport: ModuleFiscalDifferenceReport = {
  report: {
    pageTitle: 'Fiscal/No Fiscal',
    pageSubtitle:
      'Informe financiero de movimientos clasificados como fiscales o no fiscales, filtrable por cuenta, propietario, centro de costo y categoría.',
    fields: {
      accounts: 'Cuentas',
      proprietary: 'Propietario',
      startDate: 'Fecha Inicio',
      endDate: 'Fecha Fin',
      costCenter: 'Centro de Costo',
      categories: 'Categorías Financieras',
      isFiscal: 'Fiscal/No Fiscal',
      condition: 'Tipo',
    },
    proprietaryPlaceholder: 'Todos los propietarios',
    costCenterPlaceholder: 'Todos los centros de costo',
    isFiscalOptions: {
      both: 'Ambos',
      yes: 'Sí',
      no: 'No',
    },
    conditionOptions: {
      withoutCategory: 'Sin Categoría',
      withCategory: 'Con Categoría',
    },
    lookupSearchPlaceholder: 'Buscar...',
    selectAll: 'Marcar todos',
    deselectAll: 'Desmarcar todos',
    lookupEmptyMessage: 'No se encontraron elementos.',
    exportPdfButton: 'Descargar PDF',
    exportXlsxButton: 'Descargar Excel',
    successToast: 'Informe generado con éxito.',
    downloadError: 'No fue posible generar el informe.',
    validation: {
      periodRequired: 'El período (Fecha Inicio y Fecha Fin) es obligatorio.',
    },
  },
};
