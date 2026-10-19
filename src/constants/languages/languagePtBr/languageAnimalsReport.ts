// src/constants/languages/languagePtBr/languageAnimalsReport.ts
// Tradução PT-BR do módulo "Estoque/Rebanho" (relatório de Pecuária — F-228,
// execução 97-Esteiras/078, TASK-F228-F01). Mirror estrutural de
// `languageDiscardsReport.ts`.

import { ModuleAnimalsReport } from '@/@types/language/module-animals-report';

export const languageAnimalsReport: ModuleAnimalsReport = {
  report: {
    pageTitle: 'Estoque/Rebanho',
    pageSubtitle: 'Relatório de estoque de rebanho agrupado por categoria.',
    fields: {
      startDate: 'Data Início',
      endDate: 'Data Fim',
      species: 'Espécies',
    },
    speciesPlaceholder: 'Selecione as espécies',
    downloadPdfButton: 'Baixar PDF',
    exportFileName: 'relatorio-estoque-rebanho',
    popupBlocked: 'Não foi possível abrir a nova aba. Verifique o bloqueador de pop-ups.',
    toasts: {
      success: 'Relatório gerado com sucesso.',
      genericError: 'Não foi possível gerar o relatório.',
    },
    validation: {
      periodRequired: 'O período (Data Início e Data Fim) é obrigatório.',
      endDateAfterStartDate: 'A Data Fim deve ser igual ou posterior à Data Início.',
      speciesRequired: 'Selecione ao menos uma espécie.',
    },
  },
};
