// src/@types/language/module-stock-movement-report/index.ts
// Interface de tradução do módulo "Movimentação de Estoque" (relatório de
// Estoque — F-1f1d23e3, 97-Esteiras/074, TASK-MOV-FE-01), chave TOP-LEVEL,
// mirror `paidInterestReport`/`costCalculationReport`/`foodBeatAggregateReport`
// — tela de filtro + 2 downloads (PDF/Excel) independentes, sem grid/prévia.
//
// `warehouse` é o ÚNICO campo obrigatório (mirror do contrato API `PASSO 3`,
// nullable em `start_date`/`end_date`) — diferente dos siblings
// `JurosPagos`/`ApuracaoCusto`, que exigem o par de datas.

export interface ModuleStockMovementReport {
  report: {
    pageTitle: string;
    pageSubtitle: string;
    fields: {
      warehouse: string;
      startDate: string;
      endDate: string;
      products: string;
    };
    warehousePlaceholder: string;
    productsPlaceholder: string;
    warehouseRequiredHint: string;
    downloadPdfButton: string;
    downloadExcelButton: string;
    downloadError: string;
    toasts: {
      success: string;
      genericError: string;
    };
    validation: {
      warehouseRequired: string;
      endDateAfterStartDate: string;
    };
  };
}
