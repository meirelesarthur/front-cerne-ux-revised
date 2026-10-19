// src/@types/language/module-identification-animal-sisbov-report/index.ts
// -----------------------------------------------------------------------------
// Interface de tradução do módulo "Identificação/SISBOV" (relatório —
// domínio Pecuária, F-270, esteira 97-Esteiras/078, TASK-F270-F01). Módulo
// top-level próprio, mirror `module-birth-animal-sisbov-report` — tela de
// filtro + download de PDF, SEM grid/prévia, SÓ PDF (sem seletor de
// formato).
//
// Diferente do irmão `ModuleBirthAnimalSisbovReport`, esta tela tem AMBAS as
// datas OBRIGATÓRIAS (contrato F-270) — por isso carrega
// `validation.periodRequired` (mensagem de campo ausente), além do
// `validation.endDateBeforeStartDate` já existente na família SISBOV.
// -----------------------------------------------------------------------------

export interface ModuleIdentificationAnimalSisbovReport {
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
      periodRequired: string;
      endDateBeforeStartDate: string;
    };
  };
}
