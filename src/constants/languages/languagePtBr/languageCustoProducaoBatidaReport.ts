// src/constants/languages/languagePtBr/languageCustoProducaoBatidaReport.ts
// Tradução PT-BR do módulo "Custo Produção Batida" (relatório agregado de
// Estoque — F-267, esteira 97-Esteiras/073, TASK-267-FE-01). Mirror
// estrutural do bloco `report` de `languageJurosPagos.ts`, reduzido a 3
// campos (sem grid/prévia).

import { ModuleFoodBeatAggregateReport } from '@/@types/language/module-food-beat-aggregate-report';

export const languageCustoProducaoBatidaReport: ModuleFoodBeatAggregateReport = {
  report: {
    pageTitle: 'Custo Produção Batida',
    pageSubtitle: 'Relatório agregado de custo de produção de Batida por período.',
    fields: {
      startDate: 'Data Início',
      endDate: 'Data Fim',
      food: 'Ração',
    },
    foodPlaceholder: 'Todas as rações',
    periodRequiredHint: 'Informe o período (Data Início e Data Fim) para gerar o relatório.',
    downloadPdfButton: 'Baixar PDF',
    downloadError: 'Não foi possível gerar o relatório.',
    validation: {
      periodRequired: 'O período (Data Início e Data Fim) é obrigatório.',
    },
  },
};
