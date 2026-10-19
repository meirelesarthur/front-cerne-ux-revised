// src/@types/language/module-ledger-report/index.ts
// Interface de tradução do módulo "Livro Razão" (relatório financeiro —
// F-274, 97-Esteiras/008, TASK-FE-LR-01). Módulo top-level próprio.
//
// CORREÇÃO PÓS-ENTREGA (2026-09-09): tela download-only (PDF+Excel), SEM
// prévia em tela — o legado nunca teve prévia (só formulário → PDF/Excel).
// Chaves de prévia (`previewError`/`retryButton`/`emittedAtLabel`) foram
// removidas por ficarem órfãs; `emptyBeforeFilter` foi mantido como hint
// sob os botões de download (mirror `CustoTotalReproducao`/
// `RomaneioVendasContrato`), com o texto ajustado para não citar "prévia".

export interface ModuleLedgerReport {
  report: {
    pageTitle: string;
    pageSubtitle: string;
    fields: {
      account: string;
      startDate: string;
      endDate: string;
      condition: string;
      proprietary: string;
      costCenter: string;
      planAccount: string;
      categories: string;
    };
    accountPlaceholder: string;
    conditionPlaceholder: string;
    proprietaryPlaceholder: string;
    costCenterPlaceholder: string;
    planAccountPlaceholder: string;
    conditionOptions: {
      withoutCategory: string;
      withCategory: string;
    };
    downloadPdfButton: string;
    downloadExcelButton: string;
    downloadSuccess: string;
    downloadError: string;
    emptyBeforeFilter: string;
    validation: {
      accountRequired: string;
      periodRequired: string;
      conditionRequired: string;
    };
  };
}
