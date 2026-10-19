// src/@types/language/module-animal-record-report/index.ts
// Interface de tradução do módulo "Ficha Animal" (relatório de Pecuária —
// F-225, 97-Esteiras/012, Tarefa 47/48). Mirror estrutural de
// `module-production-area-report`/`ModulePregnantCowsReport implícito em
// languageBreedingMating` — tela "gerar e sair" sem prévia on-screen
// (contrato de tela §1.2/§R-05): só filtros + botão + toasts, sem
// `preview`/`columns`/`rows`/`kpis`.

export interface ModuleAnimalRecordReport {
  report: {
    pageTitle: string;
    pageSubtitle: string;
    filters: {
      category: string;
      batch: string;
      animal: string;
    };
    filterAllPlaceholder: string;
    submitButton: string;
    successToast: string;
    errorToast: string;
  };
}
