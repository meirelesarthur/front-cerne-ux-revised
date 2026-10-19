// src/@types/language/module-stock-provider-lot-report/index.ts
// -----------------------------------------------------------------------------
// Interface de tradução do módulo "Lote/Fornecedor" (relatório — domínio
// Estoque, F-324, esteira 97-Esteiras/052, TASK-052-324-FE-01). Módulo
// top-level próprio (mirror `module-birth-animal-sisbov-report`), tela de
// filtro + download binário, SEM grid/prévia.
//
// Diferente de `module-birth-animal-sisbov-report`: esta tela TEM seletor de
// formato (`fields.format`, PDF+Excel, DEC-225) e o campo `provider` é o
// único obrigatório — `downloadPdfButton` vira `downloadButton` (nome
// genérico, o rótulo do botão não amarra a um formato fixo).
// -----------------------------------------------------------------------------

export interface ModuleStockProviderLotReport {
  report: {
    pageTitle: string;
    pageSubtitle: string;
    fields: {
      provider: string;
      startDate: string;
      endDate: string;
      format: string;
    };
    providerPlaceholder: string;
    downloadButton: string;
    downloadSuccess: string;
    downloadError: string;
    validation: {
      endDateBeforeStartDate: string;
    };
  };
}
