// src/@types/language/module-nfe-product-report/index.ts
// -----------------------------------------------------------------------------
// Interface de tradução do módulo "Faturamento" (relatório de Gestão Fiscal —
// F-286, esteira 97-Esteiras/054, TASK-054-286-FE-01). Módulo top-level
// próprio (mirror `module-machines-report`), tela de filtro + download
// binário (PDF+Excel, D-FE-02), SEM grid/prévia, SEM seletor de colunas
// (D-FE-01).
//
// `startDate`/`endDate` são os ÚNICOS campos OBRIGATÓRIOS (mirror
// `MachinesReportRequest`/roteiro-api-F286 §3). Os 4 filtros restantes
// (`clientIds`/`farmIds`/`productIds`/`issuerId`) são opcionais — por isso
// não há chave de validação própria para eles (só `endDateBeforeStartDate`).
// -----------------------------------------------------------------------------

export interface ModuleNfeProductReport {
  report: {
    pageTitle: string;
    pageSubtitle: string;
    fields: {
      startDate: string;
      endDate: string;
      clientIds: string;
      farmIds: string;
      productIds: string;
      issuerId: string;
      type: string;
    };
    clientsSearchPlaceholder: string;
    clientsSelectAll: string;
    clientsDeselectAll: string;
    clientsSelectedCount: string;
    clientsEmptyLabel: string;
    farmsSearchPlaceholder: string;
    farmsSelectAll: string;
    farmsDeselectAll: string;
    farmsSelectedCount: string;
    farmsEmptyLabel: string;
    productsSearchPlaceholder: string;
    productsSelectAll: string;
    productsDeselectAll: string;
    productsSelectedCount: string;
    productsEmptyLabel: string;
    issuerPlaceholder: string;
    typeOptions: { pdf: string; xlsx: string };
    downloadButton: string;
    downloadSuccess: string;
    downloadError: string;
    validation: {
      endDateBeforeStartDate: string;
    };
  };
}
