// src/constants/languages/languagePtBr/languageRequestQuotationReport.ts
// Tradução PT-BR do módulo "Orçamentos" (`request-quotation.report`,
// relatório de Suprimentos — F-311, execução 97-Esteiras/078,
// TASK-F311-F01). Mirror estrutural de
// `languageProductsExitCostCenterReport.ts`.

import { ModuleRequestQuotationReport } from '@/@types/language/module-request-quotation-report';

export const languageRequestQuotationReport: ModuleRequestQuotationReport = {
  report: {
    pageTitle: 'Orçamentos',
    pageSubtitle: 'Relatório de orçamentos por fornecedor e fazenda.',
    fields: {
      startDate: 'Data Início',
      endDate: 'Data Fim',
      provider: 'Fornecedor',
      farm: 'Fazenda',
    },
    providerPlaceholder: 'Todos',
    farmPlaceholder: 'Todas',
    downloadPdfButton: 'Baixar PDF',
    downloadExcelButton: 'Baixar Excel',
    exportFileName: 'orcamentos',
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
