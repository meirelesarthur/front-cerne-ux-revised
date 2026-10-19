// src/constants/languages/languagePtBr/languageBirthReport.ts
// Tradução PT-BR do módulo "Nascimentos" GENÉRICO (relatório pecuário —
// F-236, esteira 053, TASK-053-236-FE-01).

import { ModuleBirthReport } from '@/@types/language/module-birth-report';

export const languageBirthReport: ModuleBirthReport = {
  report: {
    pageTitle: 'Nascimentos',
    pageSubtitle: 'Relatório de nascimentos por categoria e período.',
    fields: {
      category: 'Categoria',
      format: 'Formato',
      startDate: 'Dt. Início',
      endDate: 'Dt. Fim',
    },
    categoryPlaceholder: 'Selecione a categoria',
    downloadButton: 'Gerar relatório',
    downloadError: 'Não foi possível gerar o relatório.',
    downloadSuccess: 'Relatório gerado com sucesso.',
    periodRequiredHint: 'Informe o período (Dt. Início e Dt. Fim) para gerar o relatório.',
    validation: {
      periodRequired: 'O período (Dt. Início e Dt. Fim) é obrigatório.',
    },
  },
};
