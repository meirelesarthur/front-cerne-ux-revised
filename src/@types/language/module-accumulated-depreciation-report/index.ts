// src/@types/language/module-accumulated-depreciation-report/index.ts
// Interface de tradução do módulo "Depreciação Acumulada" (relatório de
// Bens/Equipamentos — F-216, CONTRATO-F216-depreciacao-acumulada.md §6).
// Módulo TOP-LEVEL próprio (mirror `module-equipment-inventory-report`), tela
// de filtro + 1 download PDF-only (SEM `type`/Excel — divergência real do
// contrato, ver doc-bloco de `accumulated-depreciation-report-service.ts`),
// SEM grid/prévia.
//
// Os 4 campos (`family`/`status`/`startDate`/`endDate`) são TODOS
// obrigatórios (mirror `AccumulatedDepreciationReportRequest::rules()`) — por
// isso `periodRequiredHint` cobre a ausência de QUALQUER um dos 4 (não só
// `status`, diferente de `equipmentInventoryReport`).

export interface ModuleAccumulatedDepreciationReport {
  report: {
    pageTitle: string;
    pageSubtitle: string;
    fields: {
      family: string;
      status: string;
      startDate: string;
      endDate: string;
    };
    statusOptions: {
      active: string;
      inactive: string;
    };
    downloadPdfButton: string;
    downloadError: string;
    periodRequiredHint: string;
    toasts: {
      success: string;
      genericError: string;
    };
    validation: {
      familyRequired: string;
      statusRequired: string;
      startDateRequired: string;
      endDateRequired: string;
      endDateBeforeStartDate: string;
    };
  };
}
