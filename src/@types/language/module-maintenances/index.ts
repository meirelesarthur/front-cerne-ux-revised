// src/@types/language/module-maintenances/index.ts
// Interface de tradução do módulo Gestão de Frota — Manutenções (Maintenance,
// F-103) — domínio PRÓPRIO (mirror `module-supplies`). O conteúdo mora em
// `src/constants/languages/{idioma}/languageMaintenances.ts`.
//
// Tarefa 43 (fundação: rota/listagem/visualização/exclusão) → Tarefa 44
// (formulário criar/editar com cascatas) → Tarefa 45 ("Gerar Financeiro").
// Populada de uma vez (todas as 3 Tarefas desta execução) para não fatiar o
// arquivo entre lotes — mirror da decisão já tomada para os tipos de escrita
// em `@/@types/v2/Maintenances`.

export interface ModuleMaintenances {
  maintenance: {
    singularLabel: string;
    pluralLabel: string;
    list: {
      pageTitle: string;
      pageSubtitle: string;
      deletedToast: string;
      table: {
        code: string;
        date: string;
        requester: string;
        actions: string;
      };
      itemsTable: {
        equipment: string;
        warehouse: string;
        product: string;
        measurement: string;
        hourMeter: string;
        mileage: string;
        quantity: string;
        amount: string;
        totalAmount: string;
        executor: string;
        laborCost: string;
        note: string;
      };
      actions: {
        view: string;
        edit: string;
        delete: string;
      };
      filter: {
        title: string;
        equipment: string;
        equipmentPlaceholder: string;
        startDate: string;
        endDate: string;
      };
      emptyState: {
        title: string;
        description: string;
        titleFiltered: string;
        descriptionFiltered: string;
        cta: string;
      };
      errorState: {
        title: string;
        description: string;
        retry: string;
      };
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
        requester: string;
      };
      items: {
        title: string;
        addItem: string;
        removeItem: string;
        emptyRow: string;
        fields: {
          equipment: string;
          hourMeter: string;
          mileage: string;
          warehouse: string;
          product: string;
          measurement: string;
          quantity: string;
          stock: string;
          note: string;
          executorType: string;
          employee: string;
          employeeHours: string;
          provider: string;
          providerTotal: string;
        };
        placeholders: {
          equipment: string;
          warehouse: string;
          product: string;
          measurement: string;
          employee: string;
          provider: string;
          requester: string;
        };
        executorTypeOptions: {
          employee: string;
          provider: string;
        };
      };
      stockExceedsDialog: {
        title: string;
        intro: string;
        informedQuantityLabel: string;
        stockQuantityLabel: string;
        confirm: string;
      };
      errors: {
        invalidFields: string;
      };
    };
    detail: {
      title: string;
      sections: {
        header: string;
        items: string;
      };
      actions: {
        edit: string;
        delete: string;
        generateFinancial: string;
      };
      notFound: {
        title: string;
        description: string;
        back: string;
      };
    };
    generateFinancial: {
      pageTitlePrefix: string;
      backToDetail: string;
      providerBlock: {
        fields: {
          provider: string;
          number: string;
          typeTitle: string;
          proprietary: string;
          note: string;
          fiscalDocument: string;
          total: string;
        };
        placeholders: {
          number: string;
          typeTitle: string;
          proprietary: string;
        };
      };
      apportionment: {
        title: string;
        addButton: string;
        removeButton: string;
        emptyLabel: string;
        sumBadgeLabel: string;
        sumNotClosed: string;
        fields: {
          category: string;
          center: string;
          value: string;
        };
        placeholders: {
          category: string;
          center: string;
        };
      };
      installments: {
        title: string;
        generateButton: string;
        addButton: string;
        removeButton: string;
        emptyLabel: string;
        sumBadgeLabel: string;
        overwriteConfirm: string;
        fields: {
          installmentCount: string;
          firstDueDate: string;
          intervalDays: string;
          dueDate: string;
          value: string;
        };
      };
      errors: {
        noProviderItems: string;
        alreadyGenerated: string;
        apportionmentNotClosed: string;
        installmentsRequired: string;
        installmentsInvalid: string;
      };
      actions: {
        generate: string;
        cancel: string;
      };
      notFound: {
        title: string;
        description: string;
        back: string;
      };
    };
  };
}
