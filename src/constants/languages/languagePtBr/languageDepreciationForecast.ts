// src/constants/languages/languagePtBr/languageDepreciationForecast.ts
// Tradução PT-BR do módulo de PREVISÃO DE DEPRECIAÇÃO (Cadastros Base /
// Bens-Ativos). TASK-FE-230: tela única read-only/simulação, sem list/filter.

import { ModuleDepreciationForecast } from '@/@types/language/module-depreciation-forecast';

export const languageDepreciationForecast: ModuleDepreciationForecast = {
  form: {
    title: 'Previsão de Depreciação',
    fields: {
      equipment: 'Bem imobilizado',
      forecastTime: 'Tempo de Previsão',
    },
    placeholders: {
      select: 'Selecione',
    },
    forecastOptions: [
      '3 meses',
      '6 meses',
      '9 meses',
      '12 meses',
      '15 meses',
      '18 meses',
      '21 meses',
      '24 meses',
      '27 meses',
      '30 meses',
      '33 meses',
      '36 meses',
      '39 meses',
      '42 meses',
      '45 meses',
      '48 meses',
    ],
  },
  result: {
    table: {
      month: 'Mês/Ano',
      valueToDepreciate: 'Vl.p/depreciar',
      monthlyDepreciation: 'Vl. Dep. Mês',
      remainingBalance: 'Sd. á Depreciar',
      monthAbbreviations: [
        'Jan',
        'Fev',
        'Mar',
        'Abr',
        'Mai',
        'Jun',
        'Jul',
        'Ago',
        'Set',
        'Out',
        'Nov',
        'Dez',
      ],
    },
    empty: {
      selectPrompt: 'Selecione um equipamento e o horizonte para simular a previsão.',
      noDepreciation: 'O equipamento selecionado não possui depreciação.',
    },
    error: {
      title: 'Não foi possível calcular a previsão',
      description: 'Ocorreu um erro ao consultar a previsão de depreciação. Tente novamente.',
      retry: 'Tentar novamente',
    },
  },
};
