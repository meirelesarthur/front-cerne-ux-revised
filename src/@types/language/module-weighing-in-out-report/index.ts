// src/@types/language/module-weighing-in-out-report/index.ts
// -----------------------------------------------------------------------------
// Interface de tradução do módulo "Pesagem Entrada/Saída" (relatório de
// Agricultura — F-336, esteira 97-Esteiras/058, FRONT-F336-plano.md §3).
// Módulo TOP-LEVEL próprio (mirror `module-transfer-cliente-report`/
// `module-weighing-harvest-report`), tela de filtro + download binário, SEM
// grid/prévia, SEM `columns`/`order` (colunas e cálculo de saldo são fixos no
// servidor — plano §2.2).
//
// `formatOptions` alimenta a fábrica LOCAL `report-format-options.ts`
// (`src/constants/relatorios/weighing-in-out-report/options/`) — NÃO
// reaproveita `accountsReports.shared.formatOptions` (Nota de concorrência
// D-058-07, plano §3: arquivo disjunto por feature para evitar contenção de
// merge com as demais features desta esteira).
// -----------------------------------------------------------------------------

export interface ModuleWeighingInOutReport {
  report: {
    pageTitle: string;
    pageSubtitle: string;
    fields: {
      startDate: string;
      endDate: string;
      product: string;
      client: string;
      warehouse: string;
      format: string;
    };
    formatOptions: {
      pdf: string;
      xlsx: string;
    };
    downloadButton: string;
    downloadSuccess: string;
    downloadError: string;
    validation: {
      periodRequired: string;
      productRequired: string;
    };
  };
}
