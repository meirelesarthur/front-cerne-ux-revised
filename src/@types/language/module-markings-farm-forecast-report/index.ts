// src/@types/language/module-markings-farm-forecast-report/index.ts
// -----------------------------------------------------------------------------
// Interface de tradução do módulo "Previsão Fazenda/Receita" (relatório de
// Agricultura — F-281, execução 055, roteiro-front-F281-prev-fazenda-
// receita.md §4/§6-TASK-01). Módulo top-level próprio (mirror
// `module-weighing-harvest-report`), tela de filtro + download binário, SEM
// grid/prévia, SÓ PDF (sem `formatOptions` — divergência declarada do molde
// SPA, FID-G3F CL-031/RN-19).
//
// `harvestOrderOptions` alimenta a fábrica de opções do campo `forecast`
// ("Colheita 1ª/2ª/3ª") — CORRIGE o legado, que exibia os 3 rótulos em
// espanhol independente do idioma ativo (FID-G3F CL-016/RN-13, cosmético de
// graça, `_DECISOES-FIDELIDADE-055.md`).
// -----------------------------------------------------------------------------

export interface ModuleMarkingsFarmForecastReport {
  report: {
    pageTitle: string;
    pageSubtitle: string;
    fields: {
      startDate: string;
      endDate: string;
      cultivation: string;
      forecast: string;
      week: string;
      year: string;
    };
    cultivationPlaceholder: string;
    forecastPlaceholder: string;
    downloadButton: string;
    downloadSuccess: string;
    downloadError: string;
    harvestOrderOptions: {
      first: string;
      second: string;
      third: string;
    };
    validation: {
      periodInvalidRange: string;
      weekInvalid: string;
      yearInvalid: string;
    };
  };
}
