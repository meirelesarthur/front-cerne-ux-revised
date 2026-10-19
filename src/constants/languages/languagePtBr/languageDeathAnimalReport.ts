// src/constants/languages/languagePtBr/languageDeathAnimalReport.ts
// Tradução PT-BR do módulo "Mortes" (domínio Pecuária, F-254, esteira
// 97-Esteiras/077). Mirror estrutural de `languageStockAbcReport.ts`. Rótulos
// de campo e botão fiéis ao legado (`trad.php:408,410,494`).

import { ModuleDeathAnimalReport } from '@/@types/language/module-death-animal-report';

export const languageDeathAnimalReport: ModuleDeathAnimalReport = {
  report: {
    pageTitle: 'Mortes',
    pageSubtitle: 'Relatório de mortes de animais da fazenda ativa por período.',
    fields: {
      startDate: 'Dt. Início',
      endDate: 'Dt. Fim',
      format: 'Formato',
    },
    formatOptions: {
      pdf: 'PDF',
      excel: 'Excel',
    },
    downloadButton: 'Gerar Relatório',
    downloadSuccess: 'Relatório gerado com sucesso.',
    downloadError: 'Não foi possível gerar o relatório.',
    validation: {
      endDateBeforeStartDate: 'A Dt. Fim deve ser igual ou posterior à Dt. Início.',
    },
  },
};
