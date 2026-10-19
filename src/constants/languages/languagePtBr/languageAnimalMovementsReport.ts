// src/constants/languages/languagePtBr/languageAnimalMovementsReport.ts
// Tradução PT-BR do módulo "Movimentação/Rebanho" (relatório de Pecuária —
// F-224, lote 076, `AnimalMovementReport-contrato.md`). Mirror estrutural de
// `languageBirthReport.ts`. Literais PT fiéis ao legado
// (`legacy-contract-F-224-movimentacao-rebanho.md`), sem melhoria de
// redação.

import { ModuleAnimalMovementsReport } from '@/@types/language/module-animal-movements-report';

export const languageAnimalMovementsReport: ModuleAnimalMovementsReport = {
  report: {
    pageTitle: 'Movimentação/Rebanho',
    pageSubtitle: 'Relatório de movimentação do rebanho por categoria animal, no período da Safra.',
    fields: {
      harvest: 'Safra',
      month: 'Mês',
    },
    harvestPlaceholder: 'Selecione',
    monthPlaceholder: 'MM/AAAA',
    harvestRequiredHint: 'Selecione uma safra para gerar o relatório.',
    exportPdfButton: 'Baixar PDF',
    exportXlsxButton: 'Baixar Excel',
    successToast: 'Relatório gerado com sucesso.',
    downloadError: 'Não foi possível gerar o relatório.',
    validation: {
      harvestRequired: 'Selecione uma safra ou um mês.',
    },
  },
};
