// src/@types/language/module-machines-maintenance-report/index.ts
// -----------------------------------------------------------------------------
// Interface de tradução do módulo "Manutenções" (relatório de Frotas —
// F-276, execução 97-Esteiras/078, TASK-F276-F01). Módulo top-level próprio,
// mirror DUPLO (F-276-plano-frontend.md §Tarefas fatiadas):
//   - `module-machines-supply-report` (F-277, twin direto `rel-gfr`) para os
//     2 `CheckboxListField` (`equipmentIds`/`farmIds` — namespace prefixado
//     `equipments*`/`farms*`, 7 chaves cada: search/selectAll/deselectAll/
//     selectedCount/empty/error/retry — os 2 pickers compartilham o MESMO
//     `optionsQuery` do bundle dedicado, mirror EXATO Abastecimentos).
//   - `module-requisitions-report` (F-312) para o `warehouse`/`product`
//     single (Select/SelectAsyncPaginate) + 2 botões PDF/Excel +
//     `toasts.success/genericError` + `popupBlocked` + `validation.
//     periodRequired/endDateAfterStartDate`.
//
// `equipmentIds` é o único filtro OBRIGATÓRIO (min 1 — `validation.
// equipmentRequired`, contrato §Filtro #1 + FormRequest `equipment_ids`
// `required|array|min:1`). `farmIds`/`warehouse`/`product` opcionais.
// -----------------------------------------------------------------------------

export interface ModuleMachinesMaintenanceReport {
  report: {
    pageTitle: string;
    pageSubtitle: string;
    fields: {
      equipmentIds: string;
      farmIds: string;
      warehouse: string;
      product: string;
      startDate: string;
      endDate: string;
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
    farmsErrorLabel: string;
    farmsRetryLabel: string;
    warehousePlaceholder: string;
    productPlaceholder: string;
    downloadPdfButton: string;
    downloadExcelButton: string;
    exportFileName: string;
    popupBlocked: string;
    toasts: {
      success: string;
      genericError: string;
    };
    validation: {
      periodRequired: string;
      endDateAfterStartDate: string;
      equipmentRequired: string;
    };
  };
}
