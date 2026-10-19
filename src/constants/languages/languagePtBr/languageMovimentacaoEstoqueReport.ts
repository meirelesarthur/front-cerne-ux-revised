// src/constants/languages/languagePtBr/languageMovimentacaoEstoqueReport.ts
// Tradução PT-BR do módulo "Movimentação de Estoque" (relatório de Estoque —
// F-1f1d23e3, esteira 97-Esteiras/074, TASK-MOV-FE-01). Mirror estrutural do
// bloco `report` de `languageApuracaoCusto.ts`/`languageJurosPagos.ts` — tela
// de filtro + 2 downloads (PDF/Excel) independentes, sem grid/prévia.
//
// Literais PT EXATOS (fiéis ao legado, tabela `campos_filtro` do contrato
// legado, sem melhoria de redação): contrato front §4.

import { ModuleStockMovementReport } from '@/@types/language/module-stock-movement-report';

export const languageMovimentacaoEstoqueReport: ModuleStockMovementReport = {
  report: {
    pageTitle: 'Movimentação de Estoque',
    pageSubtitle: 'Relatório de movimentação de estoque do armazém selecionado.',
    fields: {
      warehouse: 'Armazém',
      startDate: 'Dt. Início',
      endDate: 'Dt. Fim',
      products: 'Produto',
    },
    warehousePlaceholder: 'Selecione um armazém',
    productsPlaceholder: 'Todos os produtos',
    warehouseRequiredHint: 'Selecione um armazém para gerar o relatório.',
    downloadPdfButton: 'Baixar PDF',
    downloadExcelButton: 'Baixar Excel',
    downloadError: 'Não foi possível gerar o relatório.',
    toasts: {
      success: 'Relatório gerado com sucesso.',
      genericError: 'Não foi possível gerar o relatório.',
    },
    validation: {
      warehouseRequired: 'O armazém é obrigatório.',
      endDateAfterStartDate: 'A data fim deve ser maior ou igual à data início.',
    },
  },
};
