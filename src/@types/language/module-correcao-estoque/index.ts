// src/@types/language/module-correcao-estoque/index.ts
// Interface de tradução do módulo de CORREÇÃO DE ESTOQUE (StockCorrection —
// Administrativo / Estoque). Espelha a convenção de module-events/
// module-plan-accounts. O conteúdo mora em
// src/constants/languages/{idioma}/languageCorrecaoEstoque.ts.
//
// TASK-FE-COR-01 (listagem + import + exclusão reforçada) cobre `list` +
// `filter` + `importModal` + `deleteDialog`. TASK-FE-COR-02 (detalhe
// read-only) ACRESCENTA `detail`, sem alterar o que já existia.

export interface ModuleCorrecaoEstoque {
  stockCorrection: {
    singularLabel: string;
    pluralLabel: string;
    list: {
      pageTitle: string;
      pageSubtitle: string;
      table: {
        code: string;
        date: string;
        user: string;
        createdAt: string;
        actions: {
          viewDetail: string;
          delete: string;
        };
      };
      /** Sem CTA de criação — não existe rota de cadastro unitário (import de planilha é o único ponto de criação). */
      emptyState: {
        titleEmpty: string;
        descriptionEmpty: string;
        titleFiltered: string;
        descriptionFiltered: string;
      };
      deletedToast: string;
      /** Diálogo de exclusão REFORÇADO (`DeleteConfirmDialog` `tone="danger"`) — a exclusão reverte saldo e recalcula custo médio da fazenda inteira. `itemName` (o `code`) é interpolado pelo próprio componente, não duplicado aqui. */
      deleteDialog: {
        description: string;
        warning: string;
      };
    };
    filter: {
      title: string;
      /** "Data de cadastro (de/até)" — filtro sobre `created_at`, NUNCA rotulado como "período da correção" (a `date` de referência não é filtrável, contrato de tela §2.3). */
      startDate: string;
      endDate: string;
      dateRangeInvalid: string;
    };
    /** Modal de importação de planilha (mirror `PlanAccountImportModal`, com 2 divergências deliberadas: aviso redigido do zero e etapa `result` enxuta, só `code`+`rows_processed`). */
    importModal: {
      menuButtonLabel: string;
      title: string;
      subtitle: string;
      downloadShortcut: string;
      instructions: string;
      warning: {
        title: string;
        description: string;
      };
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
      result: {
        codeLabel: string;
        rowsProcessedLabel: string;
      };
      cancelButton: string;
      submitButton: string;
      closeButton: string;
      importSuccessToast: string;
      downloadTemplateError: string;
    };
    /** Detalhe read-only (TASK-FE-COR-02) — mirror `languageStocks.stock.detail.*`. */
    detail: {
      sections: {
        identification: string;
        items: string;
      };
      fields: {
        code: string;
        date: string;
        user: string;
        product: string;
        warehouse: string;
        lot: string;
        quantity: string;
        differenceQuantity: string;
        averageCost: string;
        averageCostValue: string;
      };
      table: {
        product: string;
        warehouse: string;
        lot: string;
        quantity: string;
        differenceQuantity: string;
        averageCost: string;
        averageCostValue: string;
      };
      itemsEmpty: {
        title: string;
        description: string;
      };
      notFound: {
        title: string;
        description: string;
        back: string;
      };
      invalidParamsToast: {
        title: string;
        description: string;
      };
      noData: string;
      backButton: string;
    };
  };
}
