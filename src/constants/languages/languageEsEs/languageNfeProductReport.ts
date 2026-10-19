// src/constants/languages/languageEsEs/languageNfeProductReport.ts
// Traducción ES del módulo "Facturación" (dominio Gestión Fiscal, F-286,
// esteira 97-Esteiras/054, TASK-054-286-FE-01). Mirror de
// `languagePtBr/languageNfeProductReport.ts`.

import { ModuleNfeProductReport } from '@/@types/language/module-nfe-product-report';

export const languageNfeProductReport: ModuleNfeProductReport = {
  report: {
    pageTitle: 'Facturación',
    pageSubtitle: 'Informe de facturación por producto/factura de la finca activa.',
    fields: {
      startDate: 'Fecha Inicio',
      endDate: 'Fecha Fin',
      clientIds: 'Clientes',
      farmIds: 'Fincas',
      productIds: 'Productos',
      issuerId: 'Emisor',
      type: 'Tipo de Archivo',
    },
    clientsSearchPlaceholder: 'Buscar cliente...',
    clientsSelectAll: 'Marcar todos',
    clientsDeselectAll: 'Desmarcar todos',
    clientsSelectedCount: 'Clientes seleccionados',
    clientsEmptyLabel: 'No se encontró ningún cliente.',
    farmsSearchPlaceholder: 'Buscar finca...',
    farmsSelectAll: 'Marcar todas',
    farmsDeselectAll: 'Desmarcar todas',
    farmsSelectedCount: 'Fincas seleccionadas',
    farmsEmptyLabel: 'No se encontró ninguna finca.',
    productsSearchPlaceholder: 'Buscar producto...',
    productsSelectAll: 'Marcar todos',
    productsDeselectAll: 'Desmarcar todos',
    productsSelectedCount: 'Productos seleccionados',
    productsEmptyLabel: 'No se encontró ningún producto.',
    issuerPlaceholder: 'Seleccione el emisor',
    typeOptions: {
      pdf: 'PDF',
      xlsx: 'Excel',
    },
    downloadButton: 'Generar informe',
    downloadSuccess: 'Informe generado con éxito.',
    downloadError: 'No fue posible generar el informe.',
    validation: {
      endDateBeforeStartDate: 'La Fecha Fin debe ser igual o posterior a la Fecha Inicio.',
    },
  },
};
