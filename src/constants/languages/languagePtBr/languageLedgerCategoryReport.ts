// src/constants/languages/languagePtBr/languageLedgerCategoryReport.ts
// Tradução PT-BR do módulo "Razão Categoria" (relatório Financeiro — F-273,
// CONTRATO-F273-razao-categoria.md, execução 059). Mirror estrutural do
// bloco `report` de `languageCashFlowByCategoryReport.ts`. Literais PT
// fiéis ao contrato de tela, sem melhoria de redação.

import { ModuleLedgerCategoryReport } from '@/@types/language/module-ledger-category-report';

export const languageLedgerCategoryReport: ModuleLedgerCategoryReport = {
  report: {
    pageTitle: 'Razão Categoria',
    pageSubtitle: 'Relatório de razão por categoria financeira, no período e filtros selecionados.',
    fields: {
      startDate: 'Data Inicial',
      endDate: 'Data Final',
      farm: 'Fazenda',
      proprietary: 'Proprietário',
      costCenter: 'Centro de Custo',
      categories: 'Categorias',
      format: 'Formato',
    },
    proprietaryPlaceholder: 'Selecione o proprietário',
    costCenterPlaceholder: 'Selecione o centro de custo',
    farmPlaceholder: 'Selecione a fazenda',
    lookupSearchPlaceholder: 'Buscar categoria...',
    selectAll: 'Selecionar todos',
    deselectAll: 'Remover seleção',
    lookupEmptyMessage: 'Nenhuma categoria encontrada.',
    generateButton: 'Gerar relatório',
    downloadSuccess: 'Relatório gerado com sucesso.',
    downloadError: 'Não foi possível gerar o relatório.',
    validation: {
      periodRequired: 'A data é obrigatória.',
      periodOrder: 'A Data Final deve ser igual ou posterior à Data Inicial.',
    },
  },
};
