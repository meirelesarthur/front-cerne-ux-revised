// src/@types/language/module-discount-tables/index.ts
// Interface de tradução do módulo "Descontos/Classificação" (DiscountTable —
// Operacional/Agricultura, F-032, TASK-DT-FE-01). O conteúdo mora em
// src/constants/languages/{idioma}/languageDiscountTables.ts.
//
// Shape completo declarado de uma vez (mirror `module-feeding-phases/
// index.ts`): `list`/`filter` (TASK-DT-FE-02) e `form` (TASK-DT-FE-03) já
// reservados nesta Tarefa para não reabrir este arquivo de interface em cada
// Tarefa seguinte.
export interface ModuleDiscountTables {
  discountTable: {
    titleModule: string;
    singularLabel: string;
    pluralLabel: string;
    list: {
      pageTitle: string;
      pageSubtitle: string;
      deletedToast: string;
      columns: {
        code: string;
        name: string;
        calculationBase: string;
        products: string;
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
      search: string;
      searchPlaceholder: string;
    };
    form: {
      title: {
        create: string;
        edit: string;
        view: string;
      };
      fields: {
        code: string;
        name: string;
        namePlaceholder: string;
        calculationBase: string;
        status: string;
      };
      /** Labels das opções do enum `DiscountTableCalculationBase`
       *  (`@/constants/discount-table/discount-table-calculation-base.ts`). */
      calculationBaseOptions: {
        grossWeight: string;
        cumulative: string;
      };
      /** Labels das opções do enum `DiscountTableStatus`
       *  (`@/constants/discount-table/discount-table-status.ts`). */
      statusOptions: {
        active: string;
        inactive: string;
      };
      products: {
        title: string;
        addProduct: string;
        removeProduct: string;
        emptyState: string;
      };
      picker: {
        title: string;
        searchPlaceholder: string;
        emptyState: string;
        alreadyAddedToast: string;
      };
      /** Rótulos das 6 abas de regra, ORDEM EXATA (CLM-17) — chaves pelo
       *  próprio valor do enum `DiscountRuleType`
       *  (`@/constants/discount-table/discount-rule-type.ts`). */
      ruleTypes: {
        impureza: string;
        umidade: string;
        quebrado: string;
        esverdeado: string;
        avariado: string;
        taxa_recepcao: string;
      };
      rules: {
        initialLimitPercent: string;
        finalLimitPercent: string;
        discountPercent: string;
        addRule: string;
        removeRule: string;
        emptyState: string;
      };
      /** Mensagens de validação do schema Yup (`discount-table-schema.ts`). */
      validation: {
        nameRequired: string;
        nameMax: string;
        calculationBaseRequired: string;
        statusRequired: string;
        productsMin: string;
        productUuidRequired: string;
        rulePercentRequired: string;
        rulePercentRange: string;
      };
    };
  };
}
