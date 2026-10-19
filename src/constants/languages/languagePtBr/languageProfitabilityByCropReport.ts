// src/constants/languages/languagePtBr/languageProfitabilityByCropReport.ts
// Tradução PT-BR do módulo "Rentabilidade/Cultura" (relatório de Agricultura
// — F-302, esteira 077). Mirror `languageSaleClientReport.ts` (F-313).

import { ModuleProfitabilityByCropReport } from '@/@types/language/module-profitability-by-crop-report';

export const languageProfitabilityByCropReport: ModuleProfitabilityByCropReport = {
  report: {
    pageTitle: 'Rentabilidade/Cultura',
    pageSubtitle: 'Consolidado de rentabilidade por cultura/variedade, no período.',
    fields: {
      cultivation: 'Cultura/Variedade',
      harvest: 'Safra',
      startDate: 'Data Início',
      endDate: 'Data Fim',
    },
    cultivationPlaceholder: 'Selecione a cultura/variedade',
    harvestPlaceholder: 'Selecione a safra (opcional)',
    downloadPdfButton: 'Baixar PDF',
    downloadError: 'Não foi possível gerar o relatório.',
    periodRequiredHint: 'Selecione o período (Data Início e Data Fim) para gerar o relatório.',
    validation: {
      endDateAfterStartDate: 'A data de fim deve ser maior ou igual à data de início.',
    },
  },
};
