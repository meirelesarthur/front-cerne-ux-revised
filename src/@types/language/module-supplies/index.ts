// src/@types/language/module-supplies/index.ts
// Interface de tradução do módulo Gestão de Frota — Abastecimentos (Supply) —
// domínio PRÓPRIO (mirror `module-appropriations`). O conteúdo mora em
// `src/constants/languages/{idioma}/languageSupplies.ts`.
//
// Tarefa 40 (fundação: rota/listagem/visualização/exclusão) → Tarefa 41
// (formulário criar/editar com as 4 cascatas).

export interface ModuleSupplies {
  supply: {
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
        createdAt: string;
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
        note: string;
        responsible: string;
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
        user: string;
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
          responsible: string;
          note: string;
        };
        placeholders: {
          equipment: string;
          warehouse: string;
          product: string;
          measurement: string;
          responsible: string;
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
        back: string;
      };
      notFound: {
        title: string;
        description: string;
        back: string;
      };
    };
  };
}
