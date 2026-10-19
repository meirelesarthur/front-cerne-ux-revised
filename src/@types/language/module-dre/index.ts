// src/@types/language/module-dre/index.ts
// Interface de tradução do módulo "DRE" (DRE mensal — domínio Financeiro,
// F-259, esteira 97-Esteiras/049, TASK-DRE-FE-01). Módulo top-level próprio
// (mirror `accountingEntries`/`dfes`), tela de filtro + download de PDF, SEM
// grid/prévia — mesma forma reduzida do `report` de
// `module-accounting-entries` (esta tela NÃO tem CRUD, só o relatório).
//
// `dreAnnual` (DRE Anual, F-258, TASK-DRE-FE-03) é um módulo IRMÃO separado
// (`module-dre-annual/index.ts`) — endpoints, permissões e forma de filtro
// (ano em vez de período) diferentes, mirror do próprio contrato de tela.

export interface ModuleDre {
  report: {
    pageTitle: string;
    pageSubtitle: string;
    fields: {
      typeReport: string;
      startDate: string;
      endDate: string;
      centerId: string;
    };
    typeReportOptions: {
      synthetic: string;
      analytical: string;
    };
    centerIdPlaceholder: string;
    periodRequiredHint: string;
    downloadPdfButton: string;
    downloadError: string;
    validation: {
      typeReportRequired: string;
      periodRequired: string;
    };
  };
}
