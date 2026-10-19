// src/constants/languages/languagePtBr/languageCostingAnimalReport.ts
// Tradução PT-BR do módulo "Custeio/Animal" (relatório de Pecuária — F-248,
// esteira 97-Esteiras/075, TASK-CA-FE-01). Mirror estrutural do bloco
// `report` de `languageCostingBatchReport.ts`. Literais PT fiéis ao legado
// (`anim_animal` = "Animal", `custeio-animal-contrato-front.md §4`), sem
// melhoria de redação.

import { ModuleCostingAnimalReport } from '@/@types/language/module-costing-animal-report';

export const languageCostingAnimalReport: ModuleCostingAnimalReport = {
  report: {
    pageTitle: 'Custeio/Animal',
    pageSubtitle: 'Relatório de custeio de um animal por período.',
    fields: {
      animal: 'Animal',
      startDate: 'Data Inicial',
      endDate: 'Data Final',
    },
    animalPlaceholder: 'Selecione o animal',
    periodRequiredHint:
      'Informe o animal e o período (Data Inicial e Data Final) para gerar o relatório.',
    exportPdfButton: 'Baixar PDF',
    exportXlsxButton: 'Baixar Excel',
    successToast: 'Relatório gerado com sucesso.',
    downloadError: 'Não foi possível gerar o relatório.',
    validation: {
      periodRequired: 'O período (Data Inicial e Data Final) é obrigatório.',
      animalRequired: 'O animal é obrigatório.',
    },
  },
};
