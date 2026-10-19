// src/@types/language/module-financial/budget-planning.d.ts
// -----------------------------------------------------------------------------
// Tipo de tradução da feature "Prev. Orçamentária" (BudgetPlanning — F-106,
// esteira 97-Esteiras/067, TASK-PO-FE-02). Chave NOVA irmã de
// `expense`/`mercadoPago`/`ofxImport`/`financialFreeze` dentro de
// `ModuleFinancial` (`financial.budgetPlanning.*`) — mirror da convenção
// real já em uso neste módulo (ver `./financial-freeze.d.ts`).
// -----------------------------------------------------------------------------

export interface BudgetPlanningLanguage {
  singularLabel: string;
  pluralLabel: string;
  titleModule: string;
  createTitle: string;
  editTitle: string;
  viewTitle: string;

  list: {
    table: {
      code: string;
      date: string;
      year: string;
      responsavel: string;
      actions: string;
    };
    emptyState: {
      title: string;
    };
    error: {
      message: string;
      retry: string;
    };
    filter: {
      yearLabel: string;
      filterButton: string;
      clearButton: string;
    };
  };

  form: {
    fields: {
      dateLabel: string;
      yearLabel: string;
      codePlaceholder: string;
      authorLabel: string;
    };
    grid: {
      categoryColumn: string;
      lastYearValueColumn: string;
      totalYearColumn: string;
      totalMonthRow: string;
      totalGeneral: string;
      /** Nenhuma categoria elegível devolvida pelo endpoint (universo vazio no tenant). */
      emptyEligible: string;
      error: {
        message: string;
        retry: string;
      };
    };
    validation: {
      dateRequired: string;
      yearRequired: string;
      categoriesRequired: string;
    };
  };

  import: {
    menuLabel: string;
    title: string;
    subtitle: string;
    yearLabel: string;
    yearRequired: string;
    fileRequired: string;
    downloadShortcut: string;
    downloadTemplateError: string;
    fileUpload: {
      label: string;
      hint: string;
      dropzoneTitle: string;
      dropzoneDraggingTitle: string;
      changeLabel: string;
      removeLabel: string;
      errorTypeMessage: string;
      errorSizeMessage: string;
    };
    rowErrors: {
      title: string;
    };
    cancelButton: string;
    submitButton: string;
    success: string;
  };

  predictedReport: {
    title: string;
    subtitle: string;
    menuLabel: string;
    yearLabel: string;
    yearRequired: string;
    typeLabel: string;
    typeRequired: string;
    typePdf: string;
    typeXlsx: string;
    /** Rodada 3 (esteira 065, item 1.a) — Select de Fazenda tenant-scoped, campo OPCIONAL. */
    farmLabel: string;
    submitButton: string;
    success: string;
    genericError: string;
  };

  actions: {
    view: string;
    edit: string;
    delete: string;
    export: string;
  };

  toasts: {
    createSuccess: string;
    updateSuccess: string;
    deleteSuccess: string;
  };
}
