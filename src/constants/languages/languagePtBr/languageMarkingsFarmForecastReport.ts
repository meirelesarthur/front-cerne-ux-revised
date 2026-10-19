// src/constants/languages/languagePtBr/languageMarkingsFarmForecastReport.ts
// Tradução PT-BR do módulo "Previsão Fazenda/Receita" (relatório de
// Agricultura, F-281, execução 055, TASK-055-F281-FRONT-01). Mirror
// estrutural de `languageWeighingHarvestReport.ts`. Corrige o legado
// (`harvestOrderOptions` em espanhol independente do idioma, FID-G3F
// CL-016/RN-13).

import { ModuleMarkingsFarmForecastReport } from '@/@types/language/module-markings-farm-forecast-report';

export const languageMarkingsFarmForecastReport: ModuleMarkingsFarmForecastReport = {
  report: {
    pageTitle: 'Previsão Fazenda/Receita',
    pageSubtitle: 'Relatório de previsão de colheita e receita da fazenda ativa.',
    fields: {
      startDate: 'Data Inicial',
      endDate: 'Data Final',
      cultivation: 'Variedade',
      forecast: 'Ordem da Colheita',
      week: 'Semana',
      year: 'Ano',
    },
    cultivationPlaceholder: 'Todas as variedades',
    forecastPlaceholder: 'Todas as colheitas',
    downloadButton: 'Gerar PDF',
    downloadSuccess: 'Relatório gerado com sucesso.',
    downloadError: 'Não foi possível gerar o relatório.',
    harvestOrderOptions: {
      first: 'Colheita 1ª',
      second: 'Colheita 2ª',
      third: 'Colheita 3ª',
    },
    validation: {
      periodInvalidRange: 'A Data Final deve ser maior ou igual à Data Inicial.',
      weekInvalid: 'Informe uma semana válida (1 a 53).',
      yearInvalid: 'Informe um ano válido (4 dígitos).',
    },
  },
};
