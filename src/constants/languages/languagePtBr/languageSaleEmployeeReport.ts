// src/constants/languages/languagePtBr/languageSaleEmployeeReport.ts
// Tradução PT-BR do módulo "Vendas/Funcionário" (relatório comercial — F-314,
// esteira 079).

import { ModuleSaleEmployeeReport } from '@/@types/language/module-sale-employee-report';

export const languageSaleEmployeeReport: ModuleSaleEmployeeReport = {
  report: {
    pageTitle: 'Vendas/Funcionário',
    pageSubtitle: 'Relatório de vendas agrupado por funcionário.',
    fields: {
      startDate: 'Dt. Início',
      endDate: 'Dt. Fim',
      user: 'Funcionário',
      type: 'Tipo',
    },
    userPlaceholder: 'Selecione o funcionário',
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
