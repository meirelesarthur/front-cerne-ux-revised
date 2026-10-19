// src/constants/languages/languagePtBr/languageApuracaoCusto.ts
// Tradução PT-BR do módulo "Apuração de Custo" (relatório financeiro — F-245,
// esteira 97-Esteiras/073, TASK-245-FE-02). Mirror estrutural do bloco
// `report` de `languageJurosPagos.ts` — tela de filtro + download de PDF,
// sem grid/prévia.

import { ModuleCostCalculationReport } from '@/@types/language/module-cost-calculation-report';

export const languageApuracaoCusto: ModuleCostCalculationReport = {
  report: {
    pageTitle: 'Apuração de Custo',
    pageSubtitle: 'Relatório de apuração de custo da fazenda ativa.',
    fields: {
      startDate: 'Data Início',
      endDate: 'Data Fim',
      farm: 'Fazenda',
      costCenters: 'Centro de Custo',
      accounts: 'Conta Bancária',
      orderBy: 'Ordenar por',
      reportType: 'Tipo de Relatório',
    },
    farmPlaceholder: 'Todas',
    costCentersPlaceholder: 'Todos os centros de custo',
    accountsPlaceholder: 'Todas as contas bancárias',
    // Fidelidade literal ao rótulo do legado (FILTER-06) — não genérico
    // ("Ascendente"/"Descendente").
    orderByOptions: {
      asc: '+ Antigo',
      desc: '+ Recente',
    },
    reportTypeOptions: {
      pdf: 'PDF',
      excel: 'Excel',
    },
    periodRequiredHint: 'Informe o período (Data Início e Data Fim) para gerar o relatório.',
    filterButton: 'Filtrar',
    printButton: 'Imprimir',
    downloadError: 'Não foi possível gerar o relatório.',
    previewError: 'Não foi possível carregar a prévia do relatório.',
    retryButton: 'Tentar novamente',
    emptyBeforeFilter: 'Preencha os filtros e clique em Filtrar.',
    emptyReport: 'Nenhuma informação encontrada.',
    validation: {
      periodRequired: 'O período (Data Início e Data Fim) é obrigatório.',
    },
  },
};
