// src/@types/language/module-machines-supply-report/index.ts
// -----------------------------------------------------------------------------
// Interface de tradução do módulo "Abastecimentos" (relatório de Frotas —
// F-277, esteira 97-Esteiras/054, TASK-054-277-FE-01). Módulo top-level
// próprio (mirror `module-machines-report`, F-278, mesmo grupo de menu
// `rel-gfr`), tela de filtro + download binário, SEM grid/prévia.
//
// `equipmentIds` é o único filtro OBRIGATÓRIO (min 1, mirror F-278).
// `farmIds`/`productIds`/`warehouseId` são opcionais. Os 3 primeiros pickers
// (equipments/farms/warehouse) compartilham 1 ÚNICO `optionsQuery` (bundle,
// D-FE-01) — por isso `equipments*`/`farms*` recebem o par completo de 7
// chaves (search/selectAll/deselectAll/selectedCount/empty/error/retry),
// diferente do F-278 (onde `farms*` não tinha error/retry próprios, pois a
// query de fazendas era isolada e sem tratamento de erro dedicado no
// picker). `products*` mirror o namespace `shared.*` de `ContasAPagar`
// (search/selectAll/deselectAll/selectedCount/empty, SEM error/retry
// traduzidos — mesmo padrão do sibling, que usa os defaults do próprio
// componente `CheckboxListField`), rótulos próprios do módulo (namespace
// isolado, não reusa `accountsReports`).
// -----------------------------------------------------------------------------

export interface ModuleMachinesSupplyReport {
  report: {
    pageTitle: string;
    pageSubtitle: string;
    fields: {
      equipmentIds: string;
      farmIds: string;
      productIds: string;
      warehouseId: string;
      startDate: string;
      endDate: string;
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
    farmsErrorLabel: string;
    farmsRetryLabel: string;
    warehousePlaceholder: string;
    productsSearchPlaceholder: string;
    productsSelectAll: string;
    productsDeselectAll: string;
    productsSelectedCount: string;
    productsEmptyLabel: string;
    downloadButton: string;
    downloadSuccess: string;
    downloadError: string;
    validation: {
      equipmentsRequired: string;
      endDateBeforeStartDate: string;
    };
  };
}
