// src/constants/languages/languagePtBr/languageAppropriationOccurrenceReport.ts
// Tradução PT-BR do módulo "Ocorrências Talhões" (relatório de Agricultura —
// F-232, Tarefa 50, esteira CORE_WORKSPACE/97-Esteiras/015).

import { ModuleAppropriationOccurrenceReport } from '@/@types/language/module-appropriation-occurrence-report';

export const languageAppropriationOccurrenceReport: ModuleAppropriationOccurrenceReport = {
  report: {
    pageTitle: 'Ocorrências Talhões',
    pageSubtitle: 'Relatório de ocorrências fitossanitárias lançadas em Apontamento.',
    fields: {
      productionCycle: 'Ciclo de Produção',
      areas: 'Áreas',
      startDate: 'Data Início',
      endDate: 'Data Fim',
    },
    productionCyclePlaceholder: 'Selecione o ciclo de produção',
    areasPlaceholder: 'Selecione as áreas',
    submitButton: 'Gerar Relatório',
    successToast: 'Relatório gerado com sucesso.',
    errorToast: 'Não foi possível gerar o relatório.',
    validation: {
      periodRequired: 'O período (Data Início e Data Fim) é obrigatório.',
      periodOrder: 'A data fim deve ser maior ou igual à data início.',
    },
  },
};
