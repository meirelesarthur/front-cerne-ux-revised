// src/constants/languages/languagePtBr/languageAccumulatedIncomeStatementReport.ts
// Tradução PT-BR do módulo "Custo de Produção Acumulado" (relatório
// financeiro — F-217, esteira 97-Esteiras/058, TASK-058-F217-FE-01).

import { ModuleAccumulatedIncomeStatementReport } from '@/@types/language/module-accumulated-income-statement-report';

export const languageAccumulatedIncomeStatementReport: ModuleAccumulatedIncomeStatementReport = {
  report: {
    pageTitle: 'Custo de Produção Acumulado',
    pageSubtitle: 'Relatório acumulado de custo de produção por período (máx. 12 meses).',
    fields: {
      group: 'Regime',
      type: 'Tipo',
      startDate: 'Dt. Início',
      endDate: 'Dt. Fim',
      calculationModule: 'Módulo de Cálculo',
      farm: 'Fazenda',
      proprietary: 'Proprietário',
      hasStock: 'Considerar Estoque',
      harvest: 'Safra',
      costCenter: 'Centro de Custo',
      format: 'Tipo de Relatório',
    },
    groupOptions: { cash: 'Caixa', accrual: 'Competência' },
    typeOptions: { synthetic: 'Sintético', analytical: 'Analítico' },
    calculationModuleOptions: { financial: 'Financeiro', appropriation: 'Apontamento' },
    calculationModuleTooltip:
      'Financeiro considera os movimentos financeiros lançados; Apontamento soma também o consumo de estoque/apontamentos (só se o Regime for Caixa).',
    hasStockOptions: { no: 'Não', yes: 'Sim' },
    hasStockTooltip:
      'Injeta a variação de estoque de Insumos/Produção como subgrupo da Receita Bruta.',
    formatOptions: { pdf: 'PDF', excel: 'Excel' },
    farmPlaceholder: 'Todas',
    proprietaryPlaceholder: 'Todos',
    harvestPlaceholder: 'Todas',
    generateButton: 'Gerar Relatório',
    downloadSuccess: 'Relatório gerado com sucesso.',
    downloadError: 'Não foi possível gerar o relatório.',
    lookupSearchPlaceholder: 'Buscar...',
    lookupEmptyMessage: 'Nenhum item encontrado.',
    selectAll: 'Selecionar todos',
    deselectAll: 'Limpar seleção',
    validation: {
      invalidDateRange:
        'O período (Dt. Início e Dt. Fim) é obrigatório e a Dt. Fim deve ser maior ou igual à Dt. Início.',
      maxTwelveMonths: 'O período do relatório é limitado a 12 meses.',
    },
  },
};
