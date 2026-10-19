// src/constants/languages/languagePtBr/languageSuppliesReport.ts
// Tradução PT-BR do módulo "Suprimentos" (relatório de Suprimentos — F-325,
// execução CORE_WORKSPACE/97-Esteiras/015, Tarefa 52). Mirror estrutural de
// `languageSavingsReport.ts`.

import { ModuleSuppliesReport } from '@/@types/language/module-supplies-report';

export const languageSuppliesReport: ModuleSuppliesReport = {
  report: {
    pageTitle: 'Suprimentos',
    pageSubtitle: 'Relatório de solicitações de compra de Suprimentos.',
    fields: {
      farmUuid: 'Fazenda',
      userUuid: 'Solicitante',
      authorizerUuid: 'Autorizador',
      status: 'Status',
      priority: 'Prioridade',
      number: 'Número',
      startDate: 'Dt. Início',
      endDate: 'Dt. Fim',
    },
    statusPlaceholder: 'Selecione',
    priorityPlaceholder: 'Selecione',
    downloadPdfButton: 'Gerar PDF',
    downloadExcelButton: 'Baixar Excel',
    downloadError: 'Não foi possível gerar o relatório.',
    popupBlocked: 'Não foi possível abrir a nova aba. Verifique o bloqueador de pop-ups.',
    toasts: {
      success: 'Relatório gerado com sucesso.',
      genericError: 'Não foi possível gerar o relatório.',
    },
    validation: {
      endDateAfterStartDate: 'A Data Fim deve ser igual ou posterior à Data Início.',
    },
  },
};
