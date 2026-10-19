// src/constants/languages/languagePtBr/languageWeighingStockClientReport.ts
// Tradução PT-BR do módulo "Pesagem/Armazém/Cliente" (relatório de Estoque
// — F-337, execução 059). Mirror estrutural do bloco `report` de
// `languageStockAbcReport.ts`.

import { ModuleWeighingStockClientReport } from '@/@types/language/module-weighing-stock-client-report';

export const languageWeighingStockClientReport: ModuleWeighingStockClientReport = {
  report: {
    pageTitle: 'Pesagem/Armazém/Cliente',
    pageSubtitle: 'Relatório de pesagem por armazém e cliente.',
    fields: {
      product: 'Produto',
      client: 'Cliente',
      warehouse: 'Armazém',
      format: 'Formato',
    },
    formatOptions: {
      pdf: 'PDF',
      xlsx: 'Excel',
    },
    downloadButton: 'Baixar Relatório',
    downloadSuccess: 'Relatório gerado com sucesso.',
    downloadError: 'Não foi possível gerar o relatório.',
  },
};
