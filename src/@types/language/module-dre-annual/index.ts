// src/@types/language/module-dre-annual/index.ts
// Interface de tradução do módulo "DRE Anual" (domínio Financeiro, F-258,
// esteira 97-Esteiras/049, TASK-DRE-FE-03). Módulo top-level próprio, mirror
// estrutural de `module-dre` (tela irmã) — troca só a forma do filtro de
// período (`start_year`/`end_year` em vez de `start_date`/`end_date`).

export interface ModuleDreAnnual {
  report: {
    pageTitle: string;
    pageSubtitle: string;
    fields: {
      typeReport: string;
      startYear: string;
      endYear: string;
      centerId: string;
    };
    typeReportOptions: {
      synthetic: string;
      analytical: string;
    };
    centerIdPlaceholder: string;
    yearRangeRequiredHint: string;
    downloadPdfButton: string;
    downloadError: string;
    validation: {
      typeReportRequired: string;
      yearRangeRequired: string;
    };
  };
}
