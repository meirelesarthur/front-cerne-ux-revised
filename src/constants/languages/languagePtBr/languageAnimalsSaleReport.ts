// src/constants/languages/languagePtBr/languageAnimalsSaleReport.ts
// Tradução PT-BR do módulo "Vendas/Animais" (domínio Pecuária, F-227,
// esteira 97-Esteiras/077). Mirror estrutural de
// `languageCategoryAnimalReport.ts`.

import { ModuleAnimalsSaleReport } from '@/@types/language/module-animals-sale-report';

export const languageAnimalsSaleReport: ModuleAnimalsSaleReport = {
  report: {
    pageTitle: 'Vendas/Animais',
    pageSubtitle: 'Relatório de vendas de animais da fazenda ativa, agrupado por venda.',
    fields: {
      sale: 'Venda',
      batch: 'Lote',
      client: 'Cliente',
      startDate: 'Data Início',
      endDate: 'Data Fim',
      format: 'Formato',
    },
    salePlaceholder: 'Todas as vendas',
    batchPlaceholder: 'Todos os lotes',
    clientPlaceholder: 'Todos os clientes',
    formatOptions: {
      pdf: 'PDF',
      excel: 'Excel',
    },
    downloadButton: 'Gerar relatório',
    downloadSuccess: 'Relatório gerado com sucesso.',
    downloadError: 'Não foi possível gerar o relatório.',
    validation: {
      endDateBeforeStartDate: 'A Data Fim deve ser igual ou posterior à Data Início.',
    },
  },
};
