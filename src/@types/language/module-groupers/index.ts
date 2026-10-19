// src/@types/language/module-groupers/index.ts
// Interface de tradução do módulo de AGRUPADORES (Grouper — Cadastros Base /
// Financeiro). Espelha a convenção do módulo de Atividades
// (module-activities), adaptada para a natureza HIERÁRQUICA do Grouper
// (código gerado server-side, condição Categoria/Cálculo, tipo Custo/
// Receita/Depreciação/Financeiro). O conteúdo mora em
// src/constants/languages/{idioma}/languageGroupers.ts.
//
// TASK-FE-029 cobre apenas a fundação de dados (sem UI) — esta interface já
// antecipa as seções `list`/`filter`/`form` completas para consumo direto
// pelas telas de TASK-FE-030/031 (árvore/formulário), evitando retrabalho de
// i18n na próxima Tarefa.

export interface ModuleGroupers {
  grouper: {
    singularLabel: string;
    list: {
      pageTitle: string;
      pageSubtitle: string;
      deletedToast: string;
      table: {
        code: string;
        name: string;
        description: string;
        type: string;
        condition: string;
        order: string;
        operations: string;
        status: string;
        active: string;
        inactive: string;
      };
      actions: {
        edit: string;
        delete: string;
        addChild: string;
        expand: string;
        collapse: string;
      };
      emptyState: {
        titleEmpty: string;
        descriptionEmpty: string;
        titleFiltered: string;
        descriptionFiltered: string;
        cta: string;
      };
      /** Diálogo de confirmação de exclusão (TASK-FE-030) — copy própria mencionando
       *  cascata de subárvore (aviso defensivo: a ação "Excluir" só aparece na UI para
       *  nós sem filhos, mas a mensagem cobre o 422 real do backend em caso de corrida
       *  entre sessões, ver contrato §4/achado lateral). */
      deleteConfirm: {
        title: string;
        description: string;
        warning: string;
      };
      /** Estado de carregamento/erro ao expandir um nó (busca de filhos sob demanda). */
      loadingChildren: string;
      error: {
        message: string;
        retry: string;
      };
    };
    filter: {
      title: string;
      search: string;
      searchPlaceholder: string;
      isEnabled: string;
      isEnabledAll: string;
      enabledOptions: {
        active: string;
        inactive: string;
      };
      type: string;
      typeAll: string;
      typeOptions: {
        cost: string;
        revenue: string;
        depreciation: string;
        financial: string;
      };
      condition: string;
      conditionAll: string;
      conditionOptions: {
        category: string;
        calculation: string;
      };
    };
    /** Formulário de criação/edição (TASK-FE-031) — name/description/type/condition/is_enabled/order/formula/parent_uuid. */
    form: {
      title: { create: string; edit: string; createChild: string };
      subtitle: { create: string; edit: string };
      fields: {
        name: string;
        description: string;
        type: string;
        condition: string;
        isEnabled: string;
        order: string;
        formula: string;
        parent: string;
      };
      placeholders: {
        name: string;
        description: string;
        formula: string;
      };
      parentPlaceholder: {
        root: string;
      };
      typeOptions: {
        cost: string;
        revenue: string;
        depreciation: string;
        financial: string;
      };
      conditionOptions: {
        category: string;
        calculation: string;
      };
      validation: {
        nameRequired: string;
        nameMaxLength: string;
        descriptionMaxLength: string;
        typeRequired: string;
        conditionRequired: string;
        isEnabledRequired: string;
        orderRequired: string;
        orderMin: string;
        formulaMaxLength: string;
      };
    };
  };
}
