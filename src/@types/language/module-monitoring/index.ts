// src/@types/language/module-monitoring/index.ts
// Interface de tradução do módulo OPERACIONAL — Monitoramento
// (MonitoringServiceOrder) — domínio PRÓPRIO (mirror `ModuleServiceOrders`,
// tela ÚNICA de listagem/filtro, SEM CRUD). O conteúdo mora em
// `src/constants/languages/{idioma}/languageMonitoring.ts`.
//
// TASK-MO-FE-01 (fundação) → TASK-MO-FE-02 (service) → TASK-MO-FE-03
// (listagem) → TASK-MO-FE-04 (filtro) → TASK-MO-FE-05 (rota).

export interface ModuleMonitoring {
  titleModule: string;
  singularLabel: string;
  pluralLabel: string;
  list: {
    pageTitle: string;
    pageSubtitle: string;
    table: {
      code: string;
      dtEmission: string;
      deadline: string;
      solicitante: string;
      responsavel: string;
      status: string;
    };
    actions: {
      view: string;
    };
    filter: {
      title: string;
      code: string;
      codePlaceholder: string;
      startDate: string;
      endDate: string;
      paginationQuantity: string;
    };
    emptyState: {
      title: string;
      description: string;
      titleFiltered: string;
      descriptionFiltered: string;
    };
  };
}
