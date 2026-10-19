// src/@types/language/module-devolutions/index.ts
// Interface de tradução do módulo "Devolução/Entrada" (Devolution — Estoque,
// escrita, 97-Esteiras/037). O conteúdo mora em
// src/constants/languages/{idioma}/languageDevolutions.ts. Mirror estrutural
// de `module-requisitions/index.ts` (listagem/filtro/detalhe/form/
// importDocumentModal) fundido com `module-correcao-estoque/index.ts`
// (`importModal` de planilha xlsx, já que Devolução tem AMBOS os fluxos).
//
// Divergências vs. `module-requisitions`:
//   - `list.columns` ACRESCENTA `date` (além de `createdAt` — as DUAS colunas).
//   - `detail.fields` ACRESCENTA `status`/`amount`/`costCenter` (que
//     Requisição omite por `GAP-RS-03`, mas Devolução expõe no `show()`).
//   - `detail` ACRESCENTA `editButton` (Requisição não tem — não edita).
//   - `form.title` ACRESCENTA `edit` (tela de visualização/edição mesclada,
//     `FID-11`).
//   - `form.fields` ACRESCENTA `update` (labels específicos da tela de
//     edição: produto/armazém atuais, "Trocar Estoque").
//   - `form.validation` ACRESCENTA `dateRequired` (campo `date` é editável
//     real aqui, `required` em ambos os verbos).
//   - `importModal.result` usa `codesLabel` (PLURAL) + `groupsProcessedLabel`
//     em vez do `codeLabel` singular de `StockCorrection` — reflete
//     `DevolutionImportResultResource::codes` (array, `FID-14`).
export interface ModuleDevolutions {
  devolution: {
    singularLabel: string;
    pluralLabel: string;
    list: {
      columns: {
        code: string;
        product: string;
        quantity: string;
        warehouse: string;
        costCenter: string;
        user: string;
        status: string;
        /** `date` do payload — divergência vs. Requisição, coluna ADICIONAL a `createdAt`. */
        date: string;
        createdAt: string;
      };
      actions: {
        /** "Ver/Editar" — tela única mescla ver+editar (`FID-11`, decisão #1). */
        view: string;
        delete: string;
        generateDocument: string;
        importDocument: string;
        viewSignedDocument: string;
      };
      emptyState: {
        titleEmpty: string;
        descriptionEmpty: string;
        titleFiltered: string;
        descriptionFiltered: string;
        cta: string;
      };
      deletedToast: string;
      documentErrorToast: string;
    };
    filter: {
      title: string;
      product: string;
      productPlaceholder: string;
      warehouse: string;
      warehousePlaceholder: string;
      costCenter: string;
      costCenterPlaceholder: string;
      dateFrom: string;
      dateTo: string;
    };
    detail: {
      title: string;
      invalidParamsToast: {
        title: string;
        description: string;
      };
      notFound: {
        title: string;
        description: string;
      };
      fields: {
        code: string;
        /** `DevolutionDetail::type` — ausente em `RequisitionDetail` (Requisição não expõe `type` no detalhe). */
        type: string;
        requester: string;
        classification: string;
        area: string;
        product: string;
        warehouse: string;
        quantity: string;
        user: string;
        createdAt: string;
        /** Ausentes em `RequisitionDetail` (`GAP-RS-03`) — Devolução expõe no `show()`. */
        status: string;
        amount: string;
        costCenter: string;
      };
      backButton: string;
      /** Requisição não tem (`RT-06 NAO_APLICAVEL`) — Devolução mescla ver+editar. */
      editButton: string;
      deleteButton: string;
    };
    /** Modal de importação do documento assinado — mirror ESTRUTURAL 1:1 de `requisitions.requisition.importDocumentModal`. */
    importDocumentModal: {
      title: string;
      subtitle: string;
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
      cancelButton: string;
      submitButton: string;
      importSuccessToast: string;
      genericErrorToast: string;
    };
    /** Modal de importação de planilha XLSX — mirror ESTRUTURAL `stockCorrections.stockCorrection.importModal`, com `result` PLURAL (`codes[]`). */
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
      /** `codes: string[]` — PLURAL, divergência OBRIGATÓRIA vs. `StockCorrection` (`codeLabel` singular). */
      result: {
        codesLabel: string;
        groupsProcessedLabel: string;
        rowsProcessedLabel: string;
      };
      cancelButton: string;
      submitButton: string;
      closeButton: string;
      importSuccessToast: string;
      downloadTemplateError: string;
    };
    form: {
      title: {
        create: string;
        /** Requisição não tem (sem `update`) — Devolução mescla ver+editar (`FID-11`). */
        edit: string;
      };
      fields: {
        header: {
          code: string;
          user: string;
          date: string;
          requester: string;
          classification: string;
          area: string;
        };
        classificationOptions: {
          notClassified: string;
          capex: string;
          opex: string;
        };
        item: {
          product: string;
          measurement: string;
          stockAvailable: string;
          quantity: string;
          unitValue: string;
          totalValue: string;
          costCenter: string;
          warehouse: string;
          addItem: string;
          removeItem: string;
          sectionTitle: string;
          insufficientStock: string;
          duplicateStock: string;
          footerTotalLabel: string;
        };
        /** Labels específicos da tela de visualização/edição (Tarefa 09, GAP de contrato #2). */
        update: {
          productCurrent: string;
          warehouseCurrent: string;
          changeStock: string;
          changeStockPlaceholder: string;
          saveButton: string;
        };
      };
      validation: {
        requesterRequired: string;
        classificationRequired: string;
        costCenterRequired: string;
        itemsMin: string;
        itemStockRequired: string;
        itemQuantityRequired: string;
        quantityMin: string;
        numberType: string;
        /** `date` é EDITÁVEL real aqui (divergência vs. Requisição, onde é decorativo). */
        dateRequired: string;
      };
    };
  };
}
