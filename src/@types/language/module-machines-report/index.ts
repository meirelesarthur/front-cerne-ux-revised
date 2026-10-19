// src/@types/language/module-machines-report/index.ts
// -----------------------------------------------------------------------------
// Interface de tradução do módulo "Máquinas" (relatório de Frotas — F-278,
// esteira 97-Esteiras/052, TASK-052-278-FE-01). Módulo top-level próprio
// (mirror `module-stock-provider-lot-report`), tela de filtro + download
// binário (PDF+Excel, DEC-225), SEM grid/prévia.
//
// `equipmentIds` é o único filtro OBRIGATÓRIO (min 1, `MachinesReportRequest`).
// `farmIds` é opcional (multi). `maintenanceType`/`maintenanceExecutor` formam
// a cascata do executor (employee↔provider) — `maintenanceTypeOptions` é o
// catálogo estático do enum `MaintenanceType` do backend.
// -----------------------------------------------------------------------------

export interface ModuleMachinesReport {
  report: {
    pageTitle: string;
    pageSubtitle: string;
    fields: {
      equipmentIds: string;
      farmIds: string;
      startDate: string;
      endDate: string;
      maintenanceType: string;
      maintenanceExecutor: string;
      format: string;
    };
    equipmentsSearchPlaceholder: string;
    equipmentsSelectAll: string;
    equipmentsDeselectAll: string;
    equipmentsSelectedCount: string;
    equipmentsEmptyLabel: string;
    equipmentsErrorLabel: string;
    equipmentsRetryLabel: string;
    farmsSearchPlaceholder: string;
    farmsSelectAll: string;
    farmsDeselectAll: string;
    farmsSelectedCount: string;
    farmsEmptyLabel: string;
    maintenanceExecutorPlaceholder: string;
    maintenanceTypeOptions: {
      employee: string;
      provider: string;
    };
    downloadButton: string;
    downloadSuccess: string;
    downloadError: string;
    validation: {
      equipmentsRequired: string;
      endDateBeforeStartDate: string;
    };
  };
}
