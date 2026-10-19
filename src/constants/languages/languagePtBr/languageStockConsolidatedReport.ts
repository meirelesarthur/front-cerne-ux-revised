// src/constants/languages/languagePtBr/languageStockConsolidatedReport.ts
// Tradução PT-BR do módulo "Estoque Consolidado" (domínio Estoque, F-323,
// feature_id e70b8cad, esteira 97-Esteiras/079). Mirror estrutural de
// `languageStockAbcReport.ts`.

import { ModuleStockConsolidatedReport } from '@/@types/language/module-stock-consolidated-report';

export const languageStockConsolidatedReport: ModuleStockConsolidatedReport = {
  report: {
    pageTitle: 'Estoque Consolidado',
    pageSubtitle: 'Saldo consolidado de estoque da fazenda ativa, por armazém e produto.',
    fields: {
      warehouses: 'Armazéns',
      group: 'Grupo',
      category: 'Categoria',
      kind: 'Tipo',
      search: 'Pesquisar',
      product: 'Produto',
      date: 'Data',
      format: 'Formato',
    },
    placeholders: {
      warehouses: 'Selecione os armazéns',
      group: 'Selecione o grupo',
      category: 'Selecione a categoria',
      categoryDisabledHint: 'Selecione o grupo primeiro',
      kind: 'Selecione o tipo',
      kindDisabledHint: 'Selecione a categoria primeiro',
      product: 'Pesquise um produto',
    },
    formatOptions: {
      pdf: 'PDF',
      excel: 'Excel',
    },
    downloadButton: 'Baixar Relatório',
    downloadSuccess: 'Relatório gerado com sucesso.',
    downloadError: 'Não foi possível gerar o relatório.',
    warehousesRequiredHint: 'Selecione ao menos um armazém para gerar o relatório.',
    validation: {
      warehousesRequired: 'Selecione ao menos um armazém.',
    },
  },
};
