// src/constants/languages/languagePtBr/languageRequestPurchaseManagementReport.ts
// Tradução PT-BR do módulo "Gerencial de Solicitações" (relatório de
// Suprimentos — F-310, esteira 053, TASK-053-F310-FE-01).

import { ModuleRequestPurchaseManagementReport } from '@/@types/language/module-request-purchase-management-report';

export const languageRequestPurchaseManagementReport: ModuleRequestPurchaseManagementReport = {
  report: {
    pageTitle: 'Gerencial de Solicitações',
    pageSubtitle: 'Relatório gerencial de solicitações de compra por período.',
    fields: {
      startDate: 'Dt. Início',
      endDate: 'Dt. Fim',
      farm: 'Fazenda',
      typeRequest: 'Tipo',
      status: 'Status',
    },
    downloadPdfButton: 'Baixar PDF',
    downloadExcelButton: 'Baixar Excel',
    downloadSuccess: 'Relatório gerado com sucesso.',
    downloadError: 'Não foi possível gerar o relatório.',
    validation: {
      periodRequired: 'O período (Dt. Início e Dt. Fim) é obrigatório.',
      invalidDateRange: 'A Dt. Fim deve ser maior ou igual à Dt. Início.',
    },
  },
};
