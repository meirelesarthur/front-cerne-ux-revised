// src/@types/language/module-birth-animal-sisbov-report/index.ts
// -----------------------------------------------------------------------------
// Interface de tradução do módulo "Nascimentos/SISBOV" (relatório —
// domínio Pecuária, F-235, esteira 97-Esteiras/052, TASK-052-235-FE-01).
// Módulo top-level próprio (mirror `dre`), tela de filtro + download de PDF,
// SEM grid/prévia — mesma forma reduzida do `report` de `module-dre` (esta
// tela NÃO tem CRUD, só o relatório, e SÓ PDF — sem seletor de formato).
// -----------------------------------------------------------------------------

export interface ModuleBirthAnimalSisbovReport {
  report: {
    pageTitle: string;
    pageSubtitle: string;
    fields: {
      startDate: string;
      endDate: string;
    };
    downloadPdfButton: string;
    downloadSuccess: string;
    downloadError: string;
    validation: {
      endDateBeforeStartDate: string;
    };
  };
}
