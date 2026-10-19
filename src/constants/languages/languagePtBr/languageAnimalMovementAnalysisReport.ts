// src/constants/languages/languagePtBr/languageAnimalMovementAnalysisReport.ts
// Tradução PT-BR do módulo "Análise de Movimentação de Lote" (relatório de
// Pecuária — F-223, CONTRATO-F223-analise-mov-lote.md, execução 059).
// Mirror estrutural do bloco `report` de
// `languageAnimalBatchHistoryReport.ts` (F-221).

import { ModuleAnimalMovementAnalysisReport } from '@/@types/language/module-animal-movement-analysis-report';

export const languageAnimalMovementAnalysisReport: ModuleAnimalMovementAnalysisReport = {
  report: {
    pageTitle: 'Análise de Movimentação de Lote',
    pageSubtitle: 'Relatório de movimentação de animais por lote, no período selecionado.',
    fields: {
      startDate: 'Data Inicial',
      endDate: 'Data Final',
      batch: 'Lote',
      type: 'Formato',
    },
    outputTypeOptions: {
      pdf: 'PDF',
      excel: 'Excel',
    },
    validation: {
      endDateBeforeStart: 'A Data Final deve ser igual ou posterior à Data Inicial.',
    },
    downloadButton: 'Gerar Relatório',
    downloadSuccess: 'Relatório gerado com sucesso.',
    downloadError: 'Não foi possível gerar o relatório.',
  },
};
