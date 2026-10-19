// src/@types/language/module-animal-movements-report/index.ts
// Interface de tradução do módulo "Movimentação/Rebanho" (relatório de
// Pecuária — F-224, lote 076, `AnimalMovementReport-contrato.md`). Módulo
// TOP-LEVEL próprio, mirror `module-birth-report` — download-only puro
// (SEM prévia/grid), 2 botões PDF/Excel (mirror
// `module-feedlot-weighing-performance-report`), campos `harvest`/`month`
// (Safra/Mês, mirror CL-06/FM-01/FM-02).

export interface ModuleAnimalMovementsReport {
  report: {
    pageTitle: string;
    pageSubtitle: string;
    fields: {
      harvest: string;
      month: string;
    };
    harvestPlaceholder: string;
    monthPlaceholder: string;
    harvestRequiredHint: string;
    exportPdfButton: string;
    exportXlsxButton: string;
    successToast: string;
    downloadError: string;
    validation: {
      harvestRequired: string;
    };
  };
}
