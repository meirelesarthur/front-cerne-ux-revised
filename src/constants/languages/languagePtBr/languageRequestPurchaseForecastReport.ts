// src/constants/languages/languagePtBr/languageRequestPurchaseForecastReport.ts
// Tradução PT-BR do módulo "Produtos x Prev. Entrega" (relatório de
// Suprimentos — F-309, esteira 058, TASK-058-F309-FE-01).

import { ModuleRequestPurchaseForecastReport } from '@/@types/language/module-request-purchase-forecast-report';

export const languageRequestPurchaseForecastReport: ModuleRequestPurchaseForecastReport = {
  report: {
    pageTitle: 'Produtos x Prev. Entrega',
    pageSubtitle: 'Relatório de produtos x previsão de entrega por período.',
    fields: {
      startDate: 'Dt. Início',
      endDate: 'Dt. Fim',
      farm: 'Fazenda',
      user: 'Solicitante',
      status: 'Status',
      priority: 'Prioridade',
      authorizer: 'Autorizador',
      number: 'Número',
      product: 'Produto',
      service: 'Descrição/Serviço',
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
