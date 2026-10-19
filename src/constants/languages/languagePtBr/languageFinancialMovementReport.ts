// src/constants/languages/languagePtBr/languageFinancialMovementReport.ts
// Tradução PT-BR do módulo "Movimento Bancário" (relatório financeiro —
// F-264, esteira 97-Esteiras/058, TASK-058-F264-FE-01). Mirror estrutural de
// `languageCostCenterReport.ts` — filtro + download-only, SEM prévia.

import { ModuleFinancialMovementReport } from '@/@types/language/module-financial-movement-report';

export const languageFinancialMovementReport: ModuleFinancialMovementReport = {
  report: {
    pageTitle: 'Movimento Bancário',
    pageSubtitle: 'Relatório de movimentação bancária/financeira por período.',
    fields: {
      accounts: 'Contas',
      proprietary: 'Proprietário',
      types: 'Tipo de Movimento',
      centerId: 'Centro de Custo',
      categories: 'Categorias',
      farm: 'Fazenda',
      condition: 'Tipo',
      startDate: 'Data Início',
      endDate: 'Data Fim',
      format: 'Tipo de Relatório',
    },
    proprietaryPlaceholder: 'Todos',
    centerIdPlaceholder: 'Todos',
    farmPlaceholder: 'Todas',
    conditionOptions: {
      withoutCategory: 'Sem Categoria',
      withCategory: 'Com Categoria',
    },
    formatOptions: {
      pdf: 'PDF',
      xlsx: 'Excel',
    },
    typeOptions: {
      initialBalance: 'Saldo Inicial',
    },
    generateButton: 'Gerar Relatório',
    downloadSuccess: 'Relatório gerado com sucesso.',
    downloadError: 'Não foi possível gerar o relatório.',
    lookupSearchPlaceholder: 'Buscar...',
    lookupEmptyMessage: 'Nenhum item encontrado.',
    selectAll: 'Selecionar todos',
    deselectAll: 'Limpar seleção',
    validation: {
      periodRequired: 'O período (Data Início e Data Fim) é obrigatório.',
      invalidDateRange: 'A Data Fim deve ser maior ou igual à Data Início.',
    },
  },
};
