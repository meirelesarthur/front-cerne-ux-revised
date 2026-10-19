// src/@types/language/module-transfer-difference-report/index.ts
// -----------------------------------------------------------------------------
// Interface de tradução do módulo "Romaneio/Diferença" (relatório agrícola —
// Tarefa 49, esteira 97-Esteiras/014, feature_id c0b2369d). Módulo top-level
// próprio, mirror ESTRUTURAL de `module-accounts-payable-receivable-report`
// (download-only PDF+Excel via campo `format` único, SEM grid/prévia).
//
// 3 filtros EXATOS de `TransferDifferenceReportRequest` (contrato de API §3):
// `client` (uuid opcional, single-select), `start_date`/`end_date`
// (obrigatórios) e `format` (obrigatório, default `pdf`).
// -----------------------------------------------------------------------------

export interface ModuleTransferDifferenceReport {
  report: {
    pageTitle: string;
    pageSubtitle: string;
    fields: {
      client: string;
      startDate: string;
      endDate: string;
      format: string;
    };
    clientPlaceholder: string;
    generateButton: string;
    downloadSuccess: string;
    downloadError: string;
    validation: {
      datesRequired: string;
      invalidDateRange: string;
    };
  };
}
