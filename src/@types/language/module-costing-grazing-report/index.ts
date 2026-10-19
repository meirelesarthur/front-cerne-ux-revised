// src/@types/language/module-costing-grazing-report/index.ts
// Interface de tradução do módulo "Custeio/Módulo" (relatório de Pecuária —
// F-250, esteira 97-Esteiras/080, TASK-CM-FE-01). Módulo TOP-LEVEL próprio
// (mirror `module-costing-batch-report`/`module-costing-animal-report`), tela
// de filtro + download de PDF/Excel, SEM grid/prévia — mesma forma reduzida
// do `report` dos módulos irmãos de Relatório. Diferente dos 2 irmãos:
// `validation.formInvalid` é NOVO (D3, contrato de tela §7/§8) — mensagem do
// toaster `onInvalid` do `handleSubmit`, defesa em profundidade adicional que
// nenhum dos 2 mirrors (`costingBatchReport`/`costingAnimalReport`) possui.

export interface ModuleCostingGrazingReport {
  report: {
    pageTitle: string;
    pageSubtitle: string;
    fields: {
      grazings: string;
      startDate: string;
      endDate: string;
    };
    grazingsPlaceholder: string;
    periodRequiredHint: string;
    exportPdfButton: string;
    exportXlsxButton: string;
    successToast: string;
    downloadError: string;
    validation: {
      periodRequired: string;
      formInvalid: string;
    };
  };
}
