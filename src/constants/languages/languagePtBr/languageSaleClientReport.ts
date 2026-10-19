// src/constants/languages/languagePtBr/languageSaleClientReport.ts
// Tradução PT-BR do módulo "Cliente/Produto" (relatório comercial — F-313,
// esteira 054). Mirror `languageSaleProductReport.ts` (F-315).

import { ModuleSaleClientReport } from '@/@types/language/module-sale-client-report';

export const languageSaleClientReport: ModuleSaleClientReport = {
  report: {
    pageTitle: 'Cliente/Produto',
    pageSubtitle: 'Relatório de vendas agrupado por cliente e produto.',
    fields: {
      startDate: 'Dt. Início',
      endDate: 'Dt. Fim',
      client: 'Cliente',
      product: 'Produto',
      type: 'Tipo',
    },
    clientPlaceholder: 'Selecione o cliente',
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
