// src/@types/language/module-transfer-batch-grazing-area-report/index.ts
// Interface de tradução do módulo "Transf/Lote/Módulo/Área" (relatório
// pecuário — F-329, esteira CORE_WORKSPACE/97-Esteiras/077,
// F-329-plano-front.md). Mirror ESTRUTURAL de
// `module-management-batch-report/index.ts` (F-279) SEM
// `fields.category`/`categoryPlaceholder`.

export interface ModuleTransferBatchGrazingAreaReport {
  report: {
    pageTitle: string;
    pageSubtitle: string;
    fields: {
      batchId: string;
      startDate: string;
      endDate: string;
    };
    batchIdPlaceholder: string;
    downloadPdfButton: string;
    downloadError: string;
    periodRequiredHint: string;
    validation: {
      periodRequired: string;
      endDateBeforeStartDate: string;
    };
  };
}
