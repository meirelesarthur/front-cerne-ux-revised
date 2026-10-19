// src/constants/languages/languagePtBr/languageSaleGeneralReport.ts
// Tradução PT-BR do módulo "Vendas/Cliente" (relatório comercial — F-317,
// esteira 077). Mirror `languageSaleClientReport.ts` (F-313).

import { ModuleSaleGeneralReport } from '@/@types/language/module-sale-general-report';

export const languageSaleGeneralReport: ModuleSaleGeneralReport = {
  report: {
    pageTitle: 'Cliente',
    pageSubtitle: 'Relatório de vendas por cliente e produto, sem agrupamento.',
    fields: {
      startDate: 'Dt. Início',
      endDate: 'Dt. Fim',
      client: 'Cliente',
      product: 'Produto',
      reportType: 'Formato',
    },
    clientPlaceholder: 'Selecione o cliente',
    productPlaceholder: 'Selecione o produto',
    formatOptions: {
      pdf: 'PDF',
      excel: 'Excel',
    },
    downloadButton: 'Baixar Relatório',
    downloadError: 'Não foi possível gerar o relatório.',
    downloadSuccess: 'Relatório gerado com sucesso.',
    periodRequiredHint: 'Informe o período (Dt. Início e Dt. Fim) para gerar o relatório.',
    validation: {
      startDateRequired: 'A data de início é obrigatória.',
      endDateRequired: 'A data de fim é obrigatória.',
      endDateAfterStartDate: 'A data de fim deve ser maior ou igual à data de início.',
    },
  },
};
