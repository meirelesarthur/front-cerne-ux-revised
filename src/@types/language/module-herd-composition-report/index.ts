// src/@types/language/module-herd-composition-report/index.ts
// Interface de tradução do módulo "Composição Rebanho" (relatório pecuário —
// F-269, lote 079, F-269-plano-frontend.md §6 TASK-F269-FE-01). Mirror
// ESTRUTURAL de `module-nutrition-consumption-report/index.ts` (par
// `options()`+campos) + `columns`/`orderOptions`/`formatOptions`/seletor de
// colunas mirror `module-costing-area-report` (lote 079) mas com o bloco
// completo de `ReportColumnsField` (18 colunas + 10 ordenações + formato),
// que nenhum irmão de Pecuária tinha até agora — fábrica de i18n PRÓPRIA
// deste módulo (nenhum campo reaproveitado de `accountsReports.shared`,
// cross-feature import vedado nesta SPA).

export interface ModuleHerdCompositionReport {
  report: {
    pageTitle: string;
    pageSubtitle: string;
    fields: {
      batch: string;
      gender: string;
      breed: string;
      category: string;
      startDate: string;
      endDate: string;
      weightMin: string;
      weightMax: string;
      status: string;
      order: string;
      orderDirection: string;
      format: string;
    };
    batchPlaceholder: string;
    breedPlaceholder: string;
    categoryPlaceholder: string;
    genderPlaceholder: string;
    statusPlaceholder: string;
    columnsFieldLabel: string;
    columnsSearchPlaceholder: string;
    columnsEmptyMessage: string;
    selectAll: string;
    deselectAll: string;
    downloadButton: string;
    downloadSuccess: string;
    downloadError: string;
    columns: {
      identification: string;
      father: string;
      category_description: string;
      breed_description: string;
      batch: string;
      farm: string;
      gender: string;
      birth_date: string;
      age: string;
      weight: string;
      start_weight: string;
      last_weighing: string;
      gmd: string;
      nutrition: string;
      sanitary_total: string;
      status: string;
      entry_date: string;
      note: string;
    };
    orderOptions: {
      identification: string;
      category_description: string;
      breed_description: string;
      gender: string;
      birth_date: string;
      weight: string;
      last_weighing: string;
      gmd: string;
      status: string;
      entry_date: string;
    };
    orderDirectionOptions: {
      asc: string;
      desc: string;
    };
    formatOptions: {
      pdf: string;
      excel: string;
    };
    validation: {
      invalidDateRange: string;
      invalidValue: string;
      columnsRequired: string;
    };
  };
}
