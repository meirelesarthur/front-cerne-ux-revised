// src/@types/language/module-input-entries/index.ts
// Interface de tradução do módulo "Entrada de Insumos" (InputEntry) —
// domínio PRÓPRIO (mirror `module-invoices`), esteira 037. Conteúdo em
// `src/constants/languages/{idioma}/languageInputEntries.ts`.

export interface ModuleInputEntries {
  inputEntry: {
    singularLabel: string;
    pluralLabel: string;

    list: {
      pageTitle: string;
      pageSubtitle: string;
      deletedToast: string;
      table: {
        code: string;
        date: string;
        farm: string;
        proprietary: string;
        user: string;
        totalAmount: string;
      };
      actions: {
        view: string;
        edit: string;
        delete: string;
      };
      emptyState: {
        titleEmpty: string;
        descriptionEmpty: string;
        titleFiltered: string;
        descriptionFiltered: string;
        cta: string;
      };
    };

    filter: {
      title: string;
      proprietary: string;
      startDate: string;
      endDate: string;
    };

    form: {
      title: {
        create: string;
        edit: string;
      };
      subtitle: {
        create: string;
        edit: string;
      };
      fields: {
        code: string;
        date: string;
        responsible: string;
        farm: string;
        harvest: string;
        proprietary: string;
        note: string;

        product: string;
        measurement: string;
        quantity: string;
        unitValue: string;
        totalValue: string;
        generateStock: string;
        warehouse: string;
        appropriationType: string;
        providerLot: string;
        shelfLife: string;
        cultivation: string;
        category: string;
        center: string;
        area: string;
        batch: string;

        automaticWriteoff: string;
        account: string;
        movementDate: string;
        accountBalancePreview: string;
      };
      placeholders: {
        harvest: string;
        proprietary: string;
        product: string;
        measurement: string;
        warehouse: string;
        appropriationType: string;
        cultivation: string;
        category: string;
        center: string;
        area: string;
        batch: string;
        account: string;
      };
      /** CORRECAO-R1/E5 — Select local do Entrada/Insumos (Agricultura "1" /
       *  Pecuária "2"), NÃO reutiliza `invoices.invoice.appropriationTypeOptions`. */
      appropriationTypeOptions: {
        agriculture: string;
        livestock: string;
      };
      sections: {
        items: string;
        automaticWriteoff: string;
      };
      itemRow: {
        addButton: string;
        removeButton: string;
        emptyLabel: string;
      };
      hints: {
        insufficientBalanceWarning: string;
        productLockedWhenSaved: string;
      };
      validation: {
        dateRequired: string;
        dateFuture: string;
        itemsRequired: string;
        productRequired: string;
        measurementRequired: string;
        quantityRequired: string;
        quantityMin: string;
        unitValueRequired: string;
        warehouseRequiredWhenGenerateStock: string;
        appropriationTypeMaxLength: string;
        providerLotMaxLength: string;
        providerLotRequiredWhenHasLot: string;
        shelfLifeRequiredWhenHasLot: string;
        categoryRequired: string;
        centerRequired: string;
        accountRequiredWhenAutomaticWriteoff: string;
        movementDateRequiredWhenAutomaticWriteoff: string;
      };
      errors: {
        invalidFields: string;
      };
    };

    detail: {
      invalidParamsToast: {
        title: string;
        description: string;
      };
      deleteButton: string;
      /** Fallback de campo vazio/ausente na tela de DETALHE (somente
       *  leitura), mesma convenção de `products.product.detail.notInformed`. */
      notInformed: string;
      notFound: {
        title: string;
        description: string;
        back: string;
      };
      sections: {
        generalData: string;
      };
      /** Bloco "Baixa Automática" da tela de DETALHE — equivalente de
       *  LEITURA do `movement` devolvido pelo contrato (`InputEntryMovementRef`),
       *  já que a seção do formulário (`form.sections.automaticWriteoff`) é
       *  WRITE-ONLY (nunca reidrata o `movement` existente). */
      movement: {
        code: string;
        value: string;
        date: string;
        account: string;
        empty: string;
      };
    };
  };
}
