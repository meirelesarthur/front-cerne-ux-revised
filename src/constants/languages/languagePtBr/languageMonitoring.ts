// src/constants/languages/languagePtBr/languageMonitoring.ts
// Tradução PT-BR do módulo OPERACIONAL — Monitoramento
// (MonitoringServiceOrder) — domínio próprio, TASK-MO-FE-01 (esteira
// `97-Esteiras/057`, fundação).

import { ModuleMonitoring } from '@/@types/language/module-monitoring';

export const languageMonitoring: ModuleMonitoring = {
  titleModule: 'Monitoramento',
  singularLabel: 'Monitoramento',
  pluralLabel: 'Monitoramento',
  list: {
    pageTitle: 'Monitoramento',
    pageSubtitle: 'Acompanhamento das ordens de serviço em execução.',
    table: {
      code: 'Código',
      dtEmission: 'Dt. Emissão',
      deadline: 'Prazo',
      solicitante: 'Solicitante',
      responsavel: 'Responsável',
      status: 'Status',
    },
    actions: {
      view: 'Visualizar',
    },
    filter: {
      title: 'Filtrar ordens de serviço',
      code: 'Código',
      codePlaceholder: 'Buscar por código',
      startDate: 'Dt. início',
      endDate: 'Dt. fim',
      paginationQuantity: 'Itens por página',
    },
    emptyState: {
      title: 'Nenhuma ordem de serviço em monitoramento.',
      description: 'Não há ordens de serviço para acompanhar no momento.',
      titleFiltered: 'Nenhum resultado para os filtros aplicados.',
      descriptionFiltered: 'Tente ajustar os filtros ou limpar a busca.',
    },
  },
};
