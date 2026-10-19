// src/constants/languages/languageEsEs/languageNfeReport.ts
// Traducción ES del módulo "NFe/Emitidas" (dominio Gestión Fiscal, F-287,
// esteira 97-Esteiras/079, TASK-F287-FE-01). Mirror de
// `languagePtBr/languageNfeReport.ts`.

import { ModuleNfeReport } from '@/@types/language/module-nfe-report';

export const languageNfeReport: ModuleNfeReport = {
  report: {
    pageTitle: 'NFe/Emitidas',
    pageSubtitle: 'Informe de NF-e emitidas de la finca activa.',
    fields: {
      startDate: 'Fecha Inicio',
      endDate: 'Fecha Fin',
      status: 'Estado',
      clientIds: 'Cliente',
      farmIds: 'Finca',
      centerIds: 'Centro de Costo',
      issuerId: 'Emisor NF-e',
      providerId: 'Prestador de Servicio',
      format: 'Tipo de Informe',
    },
    statusPlaceholder: 'Seleccione el estado',
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
    centersSearchPlaceholder: 'Buscar centro de costo...',
    centersSelectAll: 'Marcar todos',
    centersDeselectAll: 'Desmarcar todos',
    centersSelectedCount: 'Centros de costo seleccionados',
    centersEmptyLabel: 'No se encontró ningún centro de costo.',
    issuerPlaceholder: 'Seleccione el emisor',
    providerPlaceholder: 'Seleccione el prestador de servicio',
    formatOptions: {
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
