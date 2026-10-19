// src/@types/language/module-nfe-report/index.ts
// -----------------------------------------------------------------------------
// Interface de tradução do módulo "NFe/Emitidas" (relatório de Gestão Fiscal —
// F-287, esteira 97-Esteiras/079, TASK-F287-FE-01). Módulo top-level próprio
// (mirror `module-nfe-product-report`), tela de filtro + download binário
// (PDF+Excel), SEM grid/prévia.
//
// `startDate`/`endDate` são os ÚNICOS campos OBRIGATÓRIOS (mirror
// `NfeReportRequest`/F-287-plano-api-database §3). Os 7 filtros restantes
// (`status`/`clientIds`/`farmIds`/`centerIds`/`issuerId`/`providerId`/
// `format`) são opcionais — por isso não há chave de validação própria para
// eles (só `endDateBeforeStartDate`).
// -----------------------------------------------------------------------------

export interface ModuleNfeReport {
  report: {
    pageTitle: string;
    pageSubtitle: string;
    fields: {
      startDate: string;
      endDate: string;
      status: string;
      clientIds: string;
      farmIds: string;
      centerIds: string;
      issuerId: string;
      providerId: string;
      format: string;
    };
    statusPlaceholder: string;
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
    centersSearchPlaceholder: string;
    centersSelectAll: string;
    centersDeselectAll: string;
    centersSelectedCount: string;
    centersEmptyLabel: string;
    issuerPlaceholder: string;
    providerPlaceholder: string;
    formatOptions: { pdf: string; xlsx: string };
    downloadButton: string;
    downloadSuccess: string;
    downloadError: string;
    validation: {
      endDateBeforeStartDate: string;
    };
  };
}
