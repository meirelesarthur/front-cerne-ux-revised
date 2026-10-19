// src/constants/languages/languagePtBr/languageMarkingForecastAreaReport.ts
// Tradução PT-BR do módulo "Prev. Área/Receita" (relatório de Agricultura —
// F-280, esteira 97-Esteiras/075, TASK-MFA-FE-01). Mirror estrutural do
// bloco `report` de `languageMovimentacaoEstoqueReport.ts` — tela de filtro
// + 1 download (PDF), sem grid/prévia.
//
// Literais PT EXATOS (fiéis ao legado, tabela `campos_filtro` do contrato de
// tela §2, sem melhoria de redação).

import { ModuleMarkingForecastAreaReport } from '@/@types/language/module-marking-forecast-area-report';

export const languageMarkingForecastAreaReport: ModuleMarkingForecastAreaReport = {
  report: {
    pageTitle: 'Prev. Área/Receita',
    pageSubtitle: 'Relatório de previsão de área e receita por ciclo de produção.',
    fields: {
      productionCycle: 'Ciclo de Produção',
      areas: 'Área',
      startDate: 'Dt. Início',
      endDate: 'Dt. Fim',
      variety: 'Variedade',
      order: 'Colheita',
      week: 'Semana Ano',
      year: 'Ano',
    },
    productionCyclePlaceholder: 'Selecione um ciclo de produção',
    areasPlaceholder: 'Selecione uma ou mais áreas',
    varietyPlaceholder: 'Selecione uma variedade',
    harvestOrderLabel: (order: number) => `${order}º Colheita`,
    downloadPdfButton: 'Baixar PDF',
    downloadError: 'Não foi possível gerar o relatório.',
    toasts: {
      success: 'Relatório gerado com sucesso.',
      genericError: 'Não foi possível gerar o relatório.',
    },
    validation: {
      endDateAfterStartDate: 'A data fim deve ser maior ou igual à data início.',
    },
  },
};
