// src/constants/languages/languagePtBr/languageTaxAccountsReport.ts
// Tradução PT-BR do módulo "Contas Tributárias" (relatório de Financeiro —
// F-327, esteira 060). Mirror estrutural do bloco `report` de
// `languageWeighingStockClientReport.ts`.

import { ModuleTaxAccountsReport } from '@/@types/language/module-tax-accounts-report';

export const languageTaxAccountsReport: ModuleTaxAccountsReport = {
  report: {
    pageTitle: 'Contas Tributárias',
    pageSubtitle: 'Relatório de contas tributárias.',
    fields: {
      startDate: 'Período Início',
      endDate: 'Período Fim',
      isTaxation: 'Tributação',
      costCenter: 'Centro de Custo',
      provider: 'Fornecedor',
      format: 'Formato',
    },
    taxationOptions: {
      yes: 'Sim',
      no: 'Não',
    },
    formatOptions: {
      pdf: 'PDF',
      xlsx: 'Excel',
    },
    downloadButton: 'Baixar Relatório',
    downloadSuccess: 'Relatório gerado com sucesso.',
    downloadError: 'Não foi possível gerar o relatório.',
    validation: {
      datesRequired: 'O período é obrigatório.',
      invalidDateRange: 'A data final deve ser maior ou igual à data inicial.',
    },
  },
};
