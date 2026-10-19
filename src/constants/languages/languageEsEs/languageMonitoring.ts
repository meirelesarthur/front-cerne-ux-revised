// src/constants/languages/languageEsEs/languageMonitoring.ts
// Traducción ES-ES del módulo OPERACIONAL — Monitoreo
// (MonitoringServiceOrder) — dominio propio, TASK-MO-FE-01 (esteira
// `97-Esteiras/057`, fundación).

import { ModuleMonitoring } from '@/@types/language/module-monitoring';

export const languageMonitoring: ModuleMonitoring = {
  titleModule: 'Monitoreo',
  singularLabel: 'Monitoreo',
  pluralLabel: 'Monitoreo',
  list: {
    pageTitle: 'Monitoreo',
    pageSubtitle: 'Seguimiento de las órdenes de servicio en ejecución.',
    table: {
      code: 'Código',
      dtEmission: 'Fecha de Emisión',
      deadline: 'Plazo',
      solicitante: 'Solicitante',
      responsavel: 'Responsable',
      status: 'Estado',
    },
    actions: {
      view: 'Ver',
    },
    filter: {
      title: 'Filtrar órdenes de servicio',
      code: 'Código',
      codePlaceholder: 'Buscar por código',
      startDate: 'Fecha inicio',
      endDate: 'Fecha fin',
      paginationQuantity: 'Ítems por página',
    },
    emptyState: {
      title: 'Ninguna orden de servicio en monitoreo.',
      description: 'No hay órdenes de servicio para seguir en este momento.',
      titleFiltered: 'Ningún resultado para los filtros aplicados.',
      descriptionFiltered: 'Intente ajustar los filtros o limpiar la búsqueda.',
    },
  },
};
