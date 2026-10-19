// src/constants/languages/languagePtBr/languageTransferBatchGrazingAreaReport.ts
// Tradução PT-BR do módulo "Transf/Lote/Módulo/Área" (relatório pecuário —
// F-329, esteira 077, F-329-plano-front.md).

import { ModuleTransferBatchGrazingAreaReport } from '@/@types/language/module-transfer-batch-grazing-area-report';

export const languageTransferBatchGrazingAreaReport: ModuleTransferBatchGrazingAreaReport = {
  report: {
    pageTitle: 'Transf/Lote/Módulo/Área',
    pageSubtitle: 'Linha do tempo de cada lote por local (área/módulo/curral), no período.',
    fields: {
      batchId: 'Lote',
      startDate: 'Dt. Início',
      endDate: 'Dt. Fim',
    },
    batchIdPlaceholder: 'Selecione o lote',
    downloadPdfButton: 'Baixar PDF',
    downloadError: 'Não foi possível gerar o relatório.',
    periodRequiredHint: 'Informe o período (Dt. Início e Dt. Fim) para gerar o relatório.',
    validation: {
      periodRequired: 'O período (Dt. Início e Dt. Fim) é obrigatório.',
      endDateBeforeStartDate: 'A Dt. Fim não pode ser anterior à Dt. Início.',
    },
  },
};
