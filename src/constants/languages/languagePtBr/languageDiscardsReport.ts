// src/constants/languages/languagePtBr/languageDiscardsReport.ts
// Tradução PT-BR do módulo "Descarte Romaneio" (relatório de Agricultura —
// F-256, execução 97-Esteiras/078, TASK-F256-F01). Mirror estrutural de
// `languageProductsExitCostCenterReport.ts`.

import { ModuleDiscardsReport } from '@/@types/language/module-discards-report';

export const languageDiscardsReport: ModuleDiscardsReport = {
  report: {
    pageTitle: 'Descarte Romaneio',
    pageSubtitle: 'Relatório de descarte de romaneio agrupado por área.',
    fields: {
      startDate: 'Data Início',
      endDate: 'Data Fim',
      area: 'Área',
    },
    areaPlaceholder: 'Todas',
    downloadPdfButton: 'Baixar PDF',
    downloadExcelButton: 'Baixar Excel',
    exportFileName: 'relatorio_descarte_romaneio',
    popupBlocked: 'Não foi possível abrir a nova aba. Verifique o bloqueador de pop-ups.',
    toasts: {
      success: 'Relatório gerado com sucesso.',
      genericError: 'Não foi possível gerar o relatório.',
    },
    validation: {
      periodRequired: 'O período (Data Início e Data Fim) é obrigatório.',
      endDateAfterStartDate: 'A Data Fim deve ser igual ou posterior à Data Início.',
    },
  },
};
