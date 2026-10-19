// src/@types/language/module-contracts/index.ts
// -----------------------------------------------------------------------------
// Interface de tradução do módulo "Gestão de Contratos" (Contract —
// Financeiro, esteira 97-Esteiras/023, TASK-CTR-FE-02). Mirror estrutural de
// `ModuleRequestPurchases` (chave singular `contract`, mesmo padrão de
// `requestPurchase`), podado ao escopo real de Contract (sem tabs/trâmite/
// anexos/histórico).
//
// `singularLabel`/`pluralLabel` alimentam `queryKey.contracts.*`
// (`TASK-CTR-FE-03`, convenção canônica derivada da tradução — NUNCA string
// literal). O conteúdo mora em
// src/constants/languages/{idioma}/languageContracts.ts.
// -----------------------------------------------------------------------------

export interface ModuleContracts {
  contract: {
    singularLabel: string;
    pluralLabel: string;
    /** Rótulo do módulo (heading de menu/breadcrumb). */
    titleModule: string;

    // ============================================
    // LISTAGEM (`TASK-CTR-FE-07`)
    // ============================================
    list: {
      pageTitle: string;
      pageSubtitle: string;
      table: {
        code: string;
        number: string;
        provider: string;
        employee: string;
        date: string;
        expirationDate: string;
        installments: string;
        quantity: string;
        amount: string;
        actions: {
          edit: string;
          delete: string;
        };
      };
      emptyState: {
        titleEmpty: string;
        titleFiltered: string;
        descriptionEmpty: string;
        descriptionFiltered: string;
        cta: string;
      };
      deletedToast: string;
    };

    // ============================================
    // FILTRO (drawer da listagem)
    // ============================================
    filter: {
      title: string;
      search: string;
      searchPlaceholder: string;
      provider: string;
      employee: string;
    };

    // ============================================
    // FORMULÁRIO (cabeçalho + seção de itens, `TASK-CTR-FE-08`)
    // ============================================
    form: {
      title: { create: string; edit: string };
      subtitle: { create: string; edit: string };
      fields: {
        provider: string;
        employee: string;
        number: string;
        date: string;
        expirationDate: string;
        installments: string;
        quantity: string;
        unitValueSc: string;
        amount: string;
      };
      placeholders: {
        provider: string;
        employee: string;
        number: string;
      };
      validation: {
        providerRequired: string;
        employeeRequired: string;
        numberRequired: string;
        numberMaxLength: string;
        dateRequired: string;
        expirationDateRequired: string;
        installmentsRequired: string;
        installmentsMin: string;
        quantityRequired: string;
        quantityMin: string;
        unitValueScRequired: string;
        unitValueScMin: string;
        itemsMinOne: string;
        itemWarehouseRequired: string;
        itemProductRequired: string;
        itemQuantityRequired: string;
        itemQuantityMin: string;
      };
      itemsSection: {
        title: string;
        addButton: string;
        emptyState: string;
        fields: {
          warehouse: string;
          product: string;
          quantity: string;
        };
        removeButton: string;
      };
    };
  };
}
