// src/constants/languages/languagePtBr/languageWeighingInOutReport.ts
// Tradução PT-BR do módulo "Pesagem Entrada/Saída" (relatório de Agricultura,
// F-336, esteira 058, FRONT-F336-plano.md). Mirror estrutural de
// `languageTransferClienteReport.ts`/`languageWeighingHarvestReport.ts`.

import { ModuleWeighingInOutReport } from '@/@types/language/module-weighing-in-out-report';

export const languageWeighingInOutReport: ModuleWeighingInOutReport = {
  report: {
    pageTitle: 'Pesagem Entrada/Saída',
    pageSubtitle: 'Relatório de saldo de pesagem por cliente (entrada/saída).',
    fields: {
      startDate: 'Data Inicial',
      endDate: 'Data Final',
      product: 'Produto',
      client: 'Cliente',
      warehouse: 'Armazém',
      format: 'Formato',
    },
    formatOptions: {
      pdf: 'PDF',
      xlsx: 'Excel',
    },
    downloadButton: 'Gerar Relatório',
    downloadSuccess: 'Relatório gerado com sucesso.',
    downloadError: 'Não foi possível gerar o relatório.',
    validation: {
      periodRequired: 'Informe o período (Data Inicial e Data Final).',
      productRequired: 'Selecione o produto.',
    },
  },
};
