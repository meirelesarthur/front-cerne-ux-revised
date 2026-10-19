// src/constants/languages/languagePtBr/languageCostingBatchReport.ts
// Tradução PT-BR do módulo "Custeio/Lote" (relatório de Pecuária —
// F-20c552f0, esteira 97-Esteiras/074, TASK-CL-FE-01). Mirror estrutural do
// bloco `report` de `languageCustoProducaoBatidaReport.ts`. Literais PT
// fiéis ao legado (`custeio-lote-contrato-front.md §4`), sem melhoria de
// redação.

import { ModuleCostingBatchReport } from '@/@types/language/module-costing-batch-report';

export const languageCostingBatchReport: ModuleCostingBatchReport = {
  report: {
    pageTitle: 'Custeio/Lote',
    pageSubtitle: 'Relatório de custeio de Lote por período.',
    fields: {
      batches: 'Lotes',
      startDate: 'Data Inicial',
      endDate: 'Data Final',
    },
    batchesPlaceholder: 'Todos os lotes',
    periodRequiredHint: 'Informe o período (Data Inicial e Data Final) para gerar o relatório.',
    exportPdfButton: 'Baixar PDF',
    exportXlsxButton: 'Baixar Excel',
    successToast: 'Relatório gerado com sucesso.',
    downloadError: 'Não foi possível gerar o relatório.',
    validation: {
      periodRequired: 'O período (Data Inicial e Data Final) é obrigatório.',
    },
  },
};
