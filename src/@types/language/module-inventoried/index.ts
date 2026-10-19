// src/@types/language/module-inventoried/index.ts
// Interface de tradução do módulo INVENTARIADO (Inventoried — Operacional /
// Pecuária, F-041, execução CORE_WORKSPACE/97-Esteiras/060). Espelha a
// convenção de module-correcao-estoque (import + detalhe + listagem read).
// O conteúdo mora em src/constants/languages/{idioma}/languageInventoried.ts.
//
// TASK-INV-FE-01 (fundação) cria o namespace completo — `list` (TASK-INV-
// FE-02), `importModal` (TASK-INV-FE-03) e `detail` (TASK-INV-FE-04) — para
// evitar 4 edições neste arquivo.

export interface ModuleInventoried {
  inventoried: {
    singularLabel: string;
    pluralLabel: string;
    list: {
      pageTitle: string;
      pageSubtitle: string;
      table: {
        date: string;
        animalsCount: string;
        inBatch: string;
        outOfBatch: string;
        missing: string;
        actions: string;
      };
      actions: {
        view: string;
        report: string;
        delete: string;
      };
      /** Sem CTA de "criar" — não existe rota de cadastro unitário (import de planilha é o único ponto de criação). */
      emptyState: {
        title: string;
        description: string;
      };
      deletedToast: string;
      deleteDialog: {
        description: string;
        warning: string;
      };
      /** Importar/Exportar — botão do header, gate `_create` (TASK-INV-FE-02/03). */
      importButtonLabel: string;
    };
    /** Modal de importação de planilha (mirror `StockCorrectionImportModal`, TASK-INV-FE-03). */
    importModal: {
      title: string;
      subtitle: string;
      downloadShortcut: string;
      instructions: string;
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
      /** Etapa `result` — render resiliente do resumo devolvido pela API ([PARA ANÁLISE] §7.2 do contrato de tela). */
      result: {
        title: string;
        animalsCountLabel: string;
        inBatchLabel: string;
        outOfBatchLabel: string;
        missingLabel: string;
      };
      cancelButton: string;
      submitButton: string;
      closeButton: string;
      successToast: string;
      downloadTemplateError: string;
    };
    /** Detalhe read-only (TASK-INV-FE-04). */
    detail: {
      pageTitle: string;
      back: string;
      header: {
        date: string;
        responsible: string;
      };
      animals: {
        title: string;
        batch: string;
        animal: string;
        status: string;
        noBatch: string;
      };
      statusLabels: {
        inBatch: string;
        outOfBatch: string;
        missing: string;
      };
      notFound: {
        title: string;
        description: string;
      };
      noData: string;
    };
    report: {
      popupBlocked: string;
      error: string;
    };
  };
}
