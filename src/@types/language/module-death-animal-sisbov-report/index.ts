// src/@types/language/module-death-animal-sisbov-report/index.ts
// -----------------------------------------------------------------------------
// Interface de tradução do módulo "Mortes/SISBOV" (relatório — domínio
// Pecuária, F-253, esteira 97-Esteiras/054, TASK-054-253-FE-01). Módulo
// top-level próprio, mirror EXATO de `ModuleBirthAnimalSisbovReport`
// (irmão F-235) — tela de filtro + download de PDF, SEM grid/prévia, SÓ
// PDF (sem seletor de formato).
// -----------------------------------------------------------------------------

export interface ModuleDeathAnimalSisbovReport {
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
