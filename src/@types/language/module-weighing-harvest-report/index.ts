// src/@types/language/module-weighing-harvest-report/index.ts
// -----------------------------------------------------------------------------
// Interface de tradução do módulo "Pesagens/Colheita" (relatório de
// Agricultura — F-335, execução 053, roteiro-front-F335-pesagens-
// colheita.md §4/§6-TASK-01). Módulo top-level próprio (mirror
// `module-stock-provider-lot-report`), tela de filtro + download binário,
// SEM grid/prévia.
//
// Diferente de `module-stock-provider-lot-report`: esta tela tem 2 datas
// OBRIGATÓRIAS (não 1 campo obrigatório único) e 5 filtros opcionais
// (produto/área/armazém/cliente/tipo), além do seletor de formato
// (PDF+Excel).
// -----------------------------------------------------------------------------

export interface ModuleWeighingHarvestReport {
  report: {
    pageTitle: string;
    pageSubtitle: string;
    fields: {
      startDate: string;
      endDate: string;
      product: string;
      area: string;
      warehouse: string;
      client: string;
      type: string;
      format: string;
    };
    productPlaceholder: string;
    areaPlaceholder: string;
    warehousePlaceholder: string;
    clientPlaceholder: string;
    typePlaceholder: string;
    periodRequiredHint: string;
    downloadButton: string;
    downloadSuccess: string;
    downloadError: string;
    validation: {
      periodRequired: string;
    };
  };
}
