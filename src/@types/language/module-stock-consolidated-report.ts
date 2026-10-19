// src/@types/language/module-stock-consolidated-report.ts
// -----------------------------------------------------------------------------
// Interface de tradução do módulo "Estoque Consolidado" (relatório — domínio
// Estoque, F-323, feature_id e70b8cad, esteira 97-Esteiras/079). Módulo
// TOP-LEVEL próprio (mirror `module-stock-abc-report`), tela de filtro +
// download binário, SEM grid/prévia.
//
// Diferente de `ModuleStockAbcReport`: aqui há 8 campos (cascata
// group→category→kind + search + product + date, mirror `ProductFormFields`/
// `MovimentacaoEstoque`), só `warehouses` obrigatório.
// -----------------------------------------------------------------------------

export interface ModuleStockConsolidatedReport {
  report: {
    pageTitle: string;
    pageSubtitle: string;
    fields: {
      warehouses: string;
      group: string;
      category: string;
      kind: string;
      search: string;
      product: string;
      date: string;
      format: string;
    };
    placeholders: {
      warehouses: string;
      group: string;
      category: string;
      categoryDisabledHint: string;
      kind: string;
      kindDisabledHint: string;
      product: string;
    };
    formatOptions: {
      pdf: string;
      excel: string;
    };
    downloadButton: string;
    downloadSuccess: string;
    downloadError: string;
    warehousesRequiredHint: string;
    validation: {
      warehousesRequired: string;
    };
  };
}
