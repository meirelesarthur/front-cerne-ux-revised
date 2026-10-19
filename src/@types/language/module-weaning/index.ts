// src/@types/language/module-weaning/index.ts
// -----------------------------------------------------------------------------
// Interface de tradução do módulo de DESMAMA (Weaning — Operacional >
// Pecuária > Manejo, TASK-WN-FE-01). Espelha a convenção de
// `module-birth-animals/index.ts`. Conteúdo mora em
// `src/constants/languages/{idioma}/languageWeaning.ts`.
//
// Namespace `weaning` — LIVRE, sem colisão com `birthAnimals`/`movementSales`.
//
// TASK-WN-FE-01 (fundação) cobre `list` + `filter` + `deleteDialog` + `type`.
// TASK-WN-FE-04 (formulário) acrescenta `form`. TASK-WN-FE-05 (relatório)
// acrescenta `report`.
// -----------------------------------------------------------------------------

export interface ModuleWeaning {
  weaning: {
    singularLabel: string;
    pluralLabel: string;
    list: {
      pageTitle: string;
      pageSubtitle: string;
      deletedToast: string;
      table: {
        code: string;
        date: string;
        type: string;
        batch: string;
        responsible: string;
        status: string;
      };
      status: {
        pending: string;
        finished: string;
        none: string;
      };
      actions: {
        view: string;
        edit: string;
        delete: string;
        editDisabledTooltip: string;
        deleteDisabledTooltip: string;
      };
      emptyState: {
        titleEmpty: string;
        descriptionEmpty: string;
        titleFiltered: string;
        descriptionFiltered: string;
      };
      error: {
        message: string;
        retry: string;
      };
    };
    filter: {
      title: string;
      responsible: string;
    };
    deleteDialog: {
      title: string;
      descriptionTemplate: string;
    };
    /** Fábrica `weaningTypeOptions` (Recria/Venda, `WeaningTypeEnum`). */
    type: {
      recria: string;
      venda: string;
    };
    /** Formulário de criar/editar (TASK-WN-FE-04). */
    form: {
      title: {
        create: string;
        edit: string;
        view: string;
      };
      fields: {
        code: string;
        date: string;
        type: string;
        batch: string;
        transferBatch: string;
        responsible: string;
        animals: string;
      };
      placeholders: {
        type: string;
        batch: string;
        transferBatch: string;
        animals: string;
      };
      hints: {
        codeGeneratedOnSave: string;
        selectBatchFirst: string;
      };
      validation: {
        transferSameAsOrigin: string;
      };
      buttons: {
        back: string;
        edit: string;
      };
      finishedProcessingTooltip: string;
    };
    /**
     * Ação de relatório PDF/XLSX (TASK-WN-FE-05). `pageSubtitle`/
     * `downloadSuccess` acrescentados em F-333 (esteira 97-Esteiras/060,
     * TASK-F333-FRONT-01) para a tela dedicada `Relatorios/Pecuaria/
     * Desmamas` — aditivo, não quebra o modal existente
     * (`WeaningReportModal.tsx`) que consome o mesmo objeto.
     * `requiredFieldsHint` removido (esteira 060, ajuste UX do dono): as
     * datas ganharam asterisco de obrigatoriedade (`DateInput isRequired`)
     * e o texto de ajuda deixou de existir.
     */
    report: {
      headerButtonLabel: string;
      title: string;
      pageSubtitle: string;
      fields: {
        startDate: string;
        endDate: string;
        format: string;
      };
      format: {
        pdf: string;
        xlsx: string;
      };
      submitButton: string;
      cancelButton: string;
      errorToast: string;
      downloadSuccess: string;
    };
  };
}
