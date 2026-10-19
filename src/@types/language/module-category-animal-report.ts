// src/@types/language/module-category-animal-report.ts
// -----------------------------------------------------------------------------
// Interface de tradução do módulo "Estq. Animais/Categoria" (relatório —
// domínio Pecuária, F-242, esteira 97-Esteiras/077). Módulo top-level próprio
// (mirror `module-stock-abc-report`), tela de filtro + download binário, SEM
// grid/prévia.
//
// Diferente de `ModuleStockAbcReport`: aqui os 3 campos de lookup
// (`category`/`batch`/`harvest`) são OPCIONAIS — cada um com placeholder
// próprio ("Todas as categorias"/"Todos os lotes"/"Todas as safras"), fiel ao
// legado CL-04 (nenhum filtro obrigatório).
// -----------------------------------------------------------------------------

export interface ModuleCategoryAnimalReport {
  report: {
    pageTitle: string;
    pageSubtitle: string;
    fields: {
      category: string;
      batch: string;
      harvest: string;
      format: string;
    };
    categoryPlaceholder: string;
    batchPlaceholder: string;
    harvestPlaceholder: string;
    formatOptions: {
      pdf: string;
      excel: string;
    };
    downloadButton: string;
    downloadSuccess: string;
    downloadError: string;
  };
}
