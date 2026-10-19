// src/constants/languages/languagePtBr/languageSaleProductReport.ts
// Tradução PT-BR do módulo "Vendas/Produto" (relatório comercial — F-315,
// esteira 051, TASK-315-FE-01).

import { ModuleSaleProductReport } from '@/@types/language/module-sale-product-report';

export const languageSaleProductReport: ModuleSaleProductReport = {
  report: {
    pageTitle: 'Vendas/Produto',
    pageSubtitle: 'Relatório de vendas agrupado por produto.',
    fields: {
      startDate: 'Dt. Início',
      endDate: 'Dt. Fim',
      product: 'Produto',
      type: 'Tipo',
    },
    productPlaceholder: 'Selecione o produto',
    typeOptions: {
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
