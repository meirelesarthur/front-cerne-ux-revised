// src/constants/languages/languagePtBr/languageFinancingsReport.ts
// Tradução PT-BR do módulo "Financiamentos" (relatório de Financeiro —
// F-265, execução 97-Esteiras/078, TASK-F265-F01). Mirror estrutural de
// `languageProductsExitCostCenterReport.ts`, sem os campos de select.

import { ModuleFinancingsReport } from '@/@types/language/module-financings-report';

export const languageFinancingsReport: ModuleFinancingsReport = {
  report: {
    pageTitle: 'Financiamentos',
    pageSubtitle: 'Relatório de financiamentos agrupados por movimento.',
    fields: {
      startDate: 'Data Início',
      endDate: 'Data Fim',
    },
    downloadPdfButton: 'Baixar PDF',
    downloadExcelButton: 'Baixar Excel',
    exportFileName: 'relatorio_financiamentos',
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
