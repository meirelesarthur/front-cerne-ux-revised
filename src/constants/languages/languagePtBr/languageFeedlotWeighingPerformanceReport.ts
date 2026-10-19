// src/constants/languages/languagePtBr/languageFeedlotWeighingPerformanceReport.ts
// Tradução PT-BR do módulo "Desempenho Pesagem Confinamento" (relatório de
// Pecuária — F-263, lote 076,
// `FeedlotWeighingPerformanceReport-contrato-api.md`). Mirror estrutural de
// `languageCostingBatchReport.ts`. Literais PT fiéis ao legado
// (`legacy-contract-F-263-desempenho-pesagem-confinamento.md`), sem
// melhoria de redação.

import { ModuleFeedlotWeighingPerformanceReport } from '@/@types/language/module-feedlot-weighing-performance-report';

export const languageFeedlotWeighingPerformanceReport: ModuleFeedlotWeighingPerformanceReport = {
  report: {
    pageTitle: 'Desempenho Pesagem Confinamento',
    pageSubtitle: 'Relatório de GMD e ganho de peso do confinamento, agrupado por Curral e Lote.',
    fields: {
      corral: 'Curral',
      batch: 'Lote',
      startDate: 'Dt. Início',
      endDate: 'Dt. Fim',
    },
    corralPlaceholder: 'Todos os currais',
    batchPlaceholder: 'Todos os lotes',
    periodRequiredHint: 'Informe o período (Dt. Início e Dt. Fim) para gerar o relatório.',
    exportPdfButton: 'Baixar PDF',
    exportXlsxButton: 'Baixar Excel',
    successToast: 'Relatório gerado com sucesso.',
    downloadError: 'Não foi possível gerar o relatório.',
    validation: {
      periodRequired: 'O período (Dt. Início e Dt. Fim) é obrigatório.',
    },
  },
};
