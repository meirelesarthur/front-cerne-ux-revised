// src/@types/language/module-costing-animal-report/index.ts
// Interface de tradução do módulo "Custeio/Animal" (relatório de Pecuária —
// F-248, esteira 97-Esteiras/075, TASK-CA-FE-01). Módulo TOP-LEVEL próprio
// (mirror `module-costing-batch-report`), tela de filtro + download de
// PDF/Excel, SEM grid/prévia — mesma forma reduzida do `report` dos módulos
// irmãos de Relatório. Diferente do irmão `costingBatchReport`: `animal` é
// single-select OBRIGATÓRIO, por isso ganha `fields.animal` +
// `validation.animalRequired` (o irmão não tem — `batches` lá é opcional).

export interface ModuleCostingAnimalReport {
  report: {
    pageTitle: string;
    pageSubtitle: string;
    fields: {
      animal: string;
      startDate: string;
      endDate: string;
    };
    animalPlaceholder: string;
    periodRequiredHint: string;
    exportPdfButton: string;
    exportXlsxButton: string;
    successToast: string;
    downloadError: string;
    validation: {
      periodRequired: string;
      animalRequired: string;
    };
  };
}
