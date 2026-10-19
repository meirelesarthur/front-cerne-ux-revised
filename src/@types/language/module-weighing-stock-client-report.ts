// src/@types/language/module-weighing-stock-client-report.ts
// -----------------------------------------------------------------------------
// Interface de tradução do módulo "Pesagem/Armazém/Cliente" (relatório —
// domínio Estoque, F-337, execução 059). Módulo top-level próprio (mirror
// `module-stock-abc-report.ts`), tela de filtro + download binário, SEM
// grid/prévia.
//
// Diferente de `ModuleStockAbcReport`: aqui não há `start_date`/`end_date`
// (o relatório não tem filtro de período no contrato de API,
// `WeighingStockClientReportRequest::rules()`). Os 3 campos
// `product`/`client`/`warehouse` foram RE-ATIVADOS como filtros opcionais
// nesta esteira (DEC-267, ROTEIRO-F337-FRONT.md §3.G) — mirror dos labels
// de `ModuleWeighingInOutReport` (F-336).
//
// NÃO REGISTRADO em `@/@types/language/index.d.ts` — parte do "bloco de
// fiação" pendente (WRITER-PARALELO, ver README/handoff da entrega).
// -----------------------------------------------------------------------------

export interface ModuleWeighingStockClientReport {
  report: {
    pageTitle: string;
    pageSubtitle: string;
    fields: {
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
  };
}
