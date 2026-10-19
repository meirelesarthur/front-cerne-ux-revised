// src/constants/languages/languagePtBr/languageMarkingForecastHarvestAreaReport.ts
// Tradução PT-BR do módulo "Previsão Colheita/Área" (relatório de
// Agricultura — F-282, esteira 059). Mirror estrutural do bloco `report` de
// `languageMarkingForecastAreaReport.ts` (F-280).

import { ModuleMarkingForecastHarvestAreaReport } from '@/@types/language/module-marking-forecast-harvest-area-report';

export const languageMarkingForecastHarvestAreaReport: ModuleMarkingForecastHarvestAreaReport = {
  report: {
    pageTitle: 'Previsão Colheita/Área',
    pageSubtitle: 'Relatório de previsão de colheita por área, ciclo de produção e cultivo.',
    fields: {
      productionCycle: 'Ciclo de Produção',
      areas: 'Áreas',
      startDate: 'Data Inicial',
      endDate: 'Data Final',
      cultivation: 'Cultivo/Variedade',
      forecast: 'Colheita',
      week: 'Semana',
      year: 'Ano',
    },
    productionCyclePlaceholder: 'Selecione o ciclo de produção',
    areasPlaceholder: 'Selecione as áreas',
    cultivationPlaceholder: 'Selecione o cultivo/variedade',
    forecastPlaceholder: 'Selecione a colheita',
    forecastOrderLabel: (order: number) => `${order}ª Colheita`,
    downloadPdfButton: 'Baixar PDF',
    downloadError: 'Não foi possível gerar o relatório.',
    toasts: {
      success: 'Relatório gerado com sucesso.',
      genericError: 'Não foi possível gerar o relatório.',
    },
    validation: {
      endDateAfterStartDate: 'A Data Final deve ser igual ou posterior à Data Inicial.',
    },
  },
};
