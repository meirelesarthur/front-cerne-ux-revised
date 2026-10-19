// src/@types/language/module-animals-per-batch-report/index.ts
// Interface de tradução do módulo "Animais por Lote" (relatório pecuário —
// Tarefa 51, esteira CORE_WORKSPACE/97-Esteiras/015). Mirror ESTRUTURAL de
// `module-accumulated-weighing-batch-report/index.ts` (Tarefa 49), acrescido
// do enum estático `viewTypeOptions` (`individual`/`aggregated`, sem fábrica
// compartilhada — só esta tela usa este enum, contrato de tela §3).

export interface ModuleAnimalsPerBatchReport {
  report: {
    pageTitle: string;
    pageSubtitle: string;
    fields: {
      batch: string;
      viewType: string;
      animal: string;
      format: string;
      viewTypeOptions: {
        individual: string;
        aggregated: string;
      };
    };
    batchPlaceholder: string;
    animalPlaceholder: string;
    submitButton: string;
    successToast: string;
    errorToast: string;
    validation: {
      batchRequired: string;
      viewTypeRequired: string;
    };
  };
}
