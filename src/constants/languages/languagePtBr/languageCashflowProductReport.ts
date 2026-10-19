// src/constants/languages/languagePtBr/languageCashflowProductReport.ts
// Tradução PT-BR do módulo "Estoque Financeiro" (relatório financeiro —
// F-241, esteira 97-Esteiras/013, TASK-013-241-FE-01). Mirror estrutural de
// `languageCashFlowByCategoryReport.ts` REDUZIDO a 3 campos.

import { ModuleCashflowProductReport } from '@/@types/language/module-cashflow-product-report';

export const languageCashflowProductReport: ModuleCashflowProductReport = {
  report: {
    pageTitle: 'Estoque Financeiro',
    pageSubtitle: 'Relatório de estoque financeiro por produto e categoria financeira.',
    fields: {
      startDate: 'Data Início',
      endDate: 'Data Fim',
      format: 'Formato',
    },
    generateButton: 'Gerar relatório',
    downloadSuccess: 'Relatório gerado com sucesso.',
    downloadError: 'Não foi possível gerar o relatório.',
    validation: {
      periodRequired: 'O período (Data Início e Data Fim) é obrigatório.',
    },
  },
};
