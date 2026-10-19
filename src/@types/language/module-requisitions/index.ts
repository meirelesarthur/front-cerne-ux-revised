// src/@types/language/module-requisitions/index.ts
// Interface de tradução do módulo "Requisição/Saída" (Requisition —
// Estoque, escrita, 97-Esteiras/002, Tarefas 04/05). O conteúdo mora em
// src/constants/languages/{idioma}/languageRequisitions.ts. Molde
// estrutural DIRETO de `module-farm-transfers/index.ts`, sem o subfluxo
// financeiro (inexistente nesta feature) e com o bloco `form.fields.header`
// ajustado ao cabeçalho real (requisitante/classificação/área/centro de
// custo/armazém-filtro, mirror `RequisitionCreateForm`).
//
// `form.validation.*` — chaves usadas pelo schema Yup
// (`requisition-create-schema.ts`).
export interface ModuleRequisitions {
  requisition: {
    /** "Requisição/Saída" (label do menu). */
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
        createdAt: string;
      };
      actions: {
        view: string;
        delete: string;
        /** "Documento para Assinatura" — gera o PDF de modelo (`status.value === 1`). */
        generateDocument: string;
        /** "Importar Documento Assinado" (`status.value === 1`). */
        importDocument: string;
        /** "Documento Assinado" — abre o arquivo real assinado (`status.value === 2`). */
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
      /** Toast de erro genérico ao gerar/abrir o documento (blob), mirror `FoodBeat.list.reportErrorToast`. */
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
        requester: string;
        classification: string;
        area: string;
        product: string;
        warehouse: string;
        quantity: string;
        user: string;
        createdAt: string;
      };
      backButton: string;
      deleteButton: string;
    };
    /** Modal de importação do documento assinado (Tarefa 06) — single-step, mirror ESTRUTURAL de `stockCorrection.importModal` sem a etapa `result`. */
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
    form: {
      title: {
        create: string;
      };
      fields: {
        header: {
          code: string;
          user: string;
          /** "Data" — correção pós-entrega (achado do dono): campo readonly
           *  decorativo mostrando a data/hora atual, mirror do legado
           *  (`FH06 "created (display)"`, é o `created_at` do registro, NÃO
           *  entra no payload de criação). */
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
        /** Desde `GAP-RS-11`: `costCenter`/`warehouse` migraram do
         *  cabeçalho para POR ITEM (achado pós-entrega, evidência visual
         *  do dono). */
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
      };
      validation: {
        requesterRequired: string;
        classificationRequired: string;
        costCenterRequired: string;
        warehouseRequired: string;
        itemsMin: string;
        itemStockRequired: string;
        itemQuantityRequired: string;
        quantityMin: string;
        numberType: string;
      };
    };
  };
}
