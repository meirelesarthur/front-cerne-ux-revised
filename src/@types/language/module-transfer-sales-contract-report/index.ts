// src/@types/language/module-transfer-sales-contract-report/index.ts
// -----------------------------------------------------------------------------
// Interface de tradução do módulo "Romaneio/Vendas/Contrato" (relatório de
// Agricultura — F-331, 97-Esteiras/008, TASK-RVC-FE-01). Módulo top-level
// próprio, mirror `module-weighing-harvest-report` — tela de filtro +
// download binário, SEM grid/prévia (as 9 colunas e os 4 totais são
// renderizados no servidor, dentro do PDF/XLSX).
//
// Labels de `type` (Venda/Colheita) e `format` (PDF/Excel) NÃO entram aqui —
// vêm de `languageGB.transfers.transfer.typeOptions`/
// `languageGB.accountsReports.shared.formatOptions` via reuso
// (`transferTypeOptions`/`reportFormatOptions`).
// -----------------------------------------------------------------------------

export interface ModuleTransferSalesContractReport {
  report: {
    pageTitle: string;
    pageSubtitle: string;
    fields: {
      startDate: string;
      endDate: string;
      client: string;
      type: string;
      product: string;
      contract: string;
      format: string;
    };
    clientPlaceholder: string;
    typePlaceholder: string;
    productPlaceholder: string;
    contractPlaceholder: string;
    periodRequiredHint: string;
    submitButton: string;
    downloadSuccess: string;
    downloadError: string;
    validation: {
      startDateRequired: string;
      endDateRequired: string;
      endDateAfterStartDate: string;
    };
  };
}
