// src/@types/language/module-agriculture-application-management-report/index.ts
// Interface de tradução do módulo "Aplicação/Manejo Talhões" (relatório —
// domínio Agricultura, F-220, execução 059). Mirror ESTRUTURAL DUPLO de
// `module-production-costing-area-report` (campos `production_cycle`/`areas`
// + cascata) e `module-stock-abc-report` (campo `format` PDF/Excel) — esta
// tela combina os 2 arquétipos (cascata de ciclo/área + escolha de formato)
// mais a cascata Grupo→Categoria→Classe (mirror `ModuleProducts.filter`).

export interface ModuleAgricultureApplicationManagementReport {
  report: {
    pageTitle: string;
    pageSubtitle: string;
    fields: {
      productionCycle: string;
      areas: string;
      startDate: string;
      endDate: string;
      reportType: string;
      group: string;
      category: string;
      kind: string;
      format: string;
    };
    productionCyclePlaceholder: string;
    areasPlaceholder: string;
    reportTypeOptions: {
      inputs: string;
      services: string;
      occurrences: string;
    };
    reportTypePlaceholder: string;
    groupPlaceholder: string;
    categoryPlaceholder: string;
    categoryDisabledHint: string;
    kindPlaceholder: string;
    kindDisabledHint: string;
    formatOptions: {
      pdf: string;
      xlsx: string;
    };
    downloadButton: string;
    downloadSuccess: string;
    downloadError: string;
    periodRequiredHint: string;
    validation: {
      periodRequired: string;
    };
  };
}
