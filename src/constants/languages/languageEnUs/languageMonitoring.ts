// src/constants/languages/languageEnUs/languageMonitoring.ts
// EN-US translation of the OPERATIONAL module — Monitoring
// (MonitoringServiceOrder) — own domain, TASK-MO-FE-01 (pipeline
// `97-Esteiras/057`, foundation).

import { ModuleMonitoring } from '@/@types/language/module-monitoring';

export const languageMonitoring: ModuleMonitoring = {
  titleModule: 'Monitoring',
  singularLabel: 'Monitoring',
  pluralLabel: 'Monitoring',
  list: {
    pageTitle: 'Monitoring',
    pageSubtitle: 'Tracking of service orders currently in execution.',
    table: {
      code: 'Code',
      dtEmission: 'Issue Date',
      deadline: 'Deadline',
      solicitante: 'Requester',
      responsavel: 'Responsible',
      status: 'Status',
    },
    actions: {
      view: 'View',
    },
    filter: {
      title: 'Filter service orders',
      code: 'Code',
      codePlaceholder: 'Search by code',
      startDate: 'Start date',
      endDate: 'End date',
      paginationQuantity: 'Items per page',
    },
    emptyState: {
      title: 'No service order in monitoring.',
      description: 'There are no service orders to track right now.',
      titleFiltered: 'No result for the applied filters.',
      descriptionFiltered: 'Try adjusting the filters or clearing the search.',
    },
  },
};
