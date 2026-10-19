// src/constants/languages/languagePtBr/languageCashFlowByCategoryReport.ts
// Tradução PT-BR do módulo "Fluxo de Caixa Mensal" (relatório financeiro —
// F-240, esteira 97-Esteiras/053, TASK-053-240-FE-01). Mirror estrutural de
// `languageCostCenterReport.ts` — filtro download-only, SEM prévia.

import { ModuleCashFlowByCategoryReport } from '@/@types/language/module-cash-flow-by-category-report';

export const languageCashFlowByCategoryReport: ModuleCashFlowByCategoryReport = {
  report: {
    pageTitle: 'Fluxo de Caixa Mensal',
    pageSubtitle: 'Relatório de fluxo de caixa mensal agrupado por categoria financeira.',
    fields: {
      regime: 'Regime',
      startDate: 'Data Início',
      endDate: 'Data Fim',
      accounts: 'Contas',
      lastBalance: 'Saldo Anterior',
      proprietary: 'Proprietário',
      costCenter: 'Centro de Custo',
      farm: 'Fazenda',
      reportType: 'Tipo de Relatório',
      format: 'Formato',
    },
    regimePlaceholder: 'Selecione o regime',
    proprietaryPlaceholder: 'Todos os proprietários',
    costCenterPlaceholder: 'Todos os centros de custo',
    farmPlaceholder: 'Todas',
    regimeOptions: {
      cash: 'Caixa',
      accrual: 'Competência',
    },
    lastBalanceOptions: {
      yes: 'Sim',
      no: 'Não',
    },
    reportTypeOptions: {
      analytic: 'Analítico',
      synthetic: 'Sintético',
    },
    lookupSearchPlaceholder: 'Buscar...',
    selectAll: 'Marcar todos',
    deselectAll: 'Desmarcar todos',
    lookupEmptyMessage: 'Nenhum item encontrado.',
    generateButton: 'Gerar relatório',
    downloadSuccess: 'Relatório gerado com sucesso.',
    downloadError: 'Não foi possível gerar o relatório.',
    validation: {
      periodRequired: 'O período (Data Início e Data Fim) é obrigatório.',
    },
  },
};
