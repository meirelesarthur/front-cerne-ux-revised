// src/constants/languages/languagePtBr/languageCustoProducao.ts
// Tradução PT-BR do módulo "Custo de Produção" (relatório financeiro — F-272,
// esteira 97-Esteiras/073, TASK-272-FE-02/03). Mirror ESTRUTURAL do bloco
// `report` de `languageApuracaoCusto.ts`, ampliado com a tabela de prévia
// hierárquica + os 3 drill-downs (§4/§5 do contrato de tela).
//
// `pageTitle`/`pageSubtitle` (nota de fidelidade, C007 do contrato legado): o
// legado usa 3 rótulos distintos não sincronizados — menu "Custo de Produção",
// título de página "Demonstração do Resultado do Exercício", título do
// card/PDF "Custo de Produção por Período". Mirror da decisão já tomada pelo
// Arquiteto de API (`F-272-api-arquitetura.md §5.3`): `pageTitle` = rótulo de
// menu (igual ao padrão `Dre`/`JurosPagos`), `pageSubtitle` combina os outros
// 2 rótulos legados.

import { ModuleIncomeStatementReport } from '@/@types/language/module-income-statement-report';

export const languageCustoProducao: ModuleIncomeStatementReport = {
  report: {
    pageTitle: 'Custo de Produção',
    pageSubtitle: 'Demonstração do Resultado do Exercício — Custo de Produção por Período.',
    fields: {
      group: 'Regime',
      type: 'Tipo',
      startDate: 'Dt. Início',
      endDate: 'Dt. Fim',
      calculationModule: 'Módulo de Cálculo',
      farm: 'Fazenda',
      proprietary: 'Proprietário',
      hasStock: 'Mostra Estoque?',
      harvest: 'Safra',
      costCenters: 'Centro de Custo',
      reportType: 'Tipo de Relatório',
    },
    groupOptions: {
      cash: 'Caixa',
      accrual: 'Competência',
    },
    typeOptions: {
      synthetic: 'Sintético',
      analytical: 'Analítico',
    },
    calculationModuleOptions: {
      financial: 'Financeiro',
      appropriation: 'Apontamento (Consumo Estoque)',
    },
    calculationModuleTooltip:
      'Financeiro considera os lançamentos financeiros do período; Apontamento (Consumo Estoque) considera o consumo de estoque apontado.',
    hasStockOptions: {
      no: 'Não',
      yes: 'Sim',
    },
    hasStockTooltip:
      'Quando marcado, inclui a variação de estoque de insumos/produção na data final do período.',
    reportTypeOptions: {
      pdf: 'PDF',
      excel: 'Excel',
    },
    farmPlaceholder: 'Todas',
    proprietaryPlaceholder: 'Selecione o proprietário',
    harvestPlaceholder: 'Selecione a safra',
    costCentersPlaceholder: 'Todos os centros de custo',
    periodRequiredHint: 'Informe o período (Dt. Início e Dt. Fim) para gerar o relatório.',
    filterButton: 'Filtrar',
    downloadButton: 'Baixar',
    downloadError: 'Não foi possível gerar o relatório.',
    previewError: 'Não foi possível carregar a prévia do relatório.',
    retryButton: 'Tentar novamente',
    emptyBeforeFilter: 'Preencha os filtros e clique em Filtrar.',
    emptyReport: 'Nenhuma informação encontrada.',
    table: {
      descriptionColumn: 'Descrição',
      valueColumn: 'Valor',
      percentColumn: '%',
    },
    drilldown: {
      totalRowLabel: 'Total',
      category: {
        title: 'Detalhamento por Categoria',
        dateColumn: 'Data',
        personColumn: 'Cliente/Fornecedor',
        categoryColumn: 'Categoria',
        noteColumn: 'Histórico',
        valueColumn: 'Valor',
      },
      depreciation: {
        title: 'Detalhamento de Depreciação',
        yearMonthColumn: 'Ano/Mês',
        familyColumn: 'Família',
        equipmentColumn: 'Máquina/Equipamento',
        valueColumn: 'Valor',
      },
      apportionment: {
        title: 'Detalhamento de Rateio',
        dateColumn: 'Data',
        personColumn: 'Cliente/Fornecedor',
        centerColumn: 'Centro de Custo',
        noteColumn: 'Histórico',
        originalValueColumn: 'Vl. Original',
        percentageColumn: 'Porcentagem',
        apportionedValueColumn: 'Vl. Rateado',
      },
    },
    validation: {
      groupRequired: 'O Regime é obrigatório.',
      typeRequired: 'O Tipo é obrigatório.',
      periodRequired: 'O período (Dt. Início e Dt. Fim) é obrigatório.',
      calculationModuleRequired: 'O Módulo de Cálculo é obrigatório.',
    },
  },
};
