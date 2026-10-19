// src/@types/language/module-financial-categories/index.ts
// Interface de tradução do módulo de CATEGORIAS FINANCEIRAS (FinancialCategory
// — Cadastros Base / Financeiro), execução 023. Espelha a convenção do módulo
// irmão de mesma natureza (module-groupers — nested-set financeiro),
// simplificada porque a árvore de FinancialCategory só tem 2 níveis
// navegáveis pela API atual (grupo→folha, GAP-FE-100) — sem
// `loadingChildren`/busca sob demanda (a árvore inteira já vem numa única
// resposta, TASK-FE-311). O conteúdo mora em
// src/constants/languages/{idioma}/languageFinancialCategories.ts.
//
// TASK-FE-311 cobre `list`/`filter`. TASK-FE-312 adiciona `form` (criar/editar,
// incl. multiselect de Centros de Custo — GAP-FE-103, seleção não persistida).
// TASK-FE-317 (execução 023) troca `centersField` (multiselect chapado,
// TASK-FE-315) por `centersTree` — árvore tri-state (`CategoryTreeSelector`,
// generalizado), mesmo espírito de `languageCostCenters.categoriesTree`
// (TASK-FE-316), bloco PRÓPRIO (não compartilhado entre módulos de domínio
// diferentes), acrescido de `errorLabel`/`retryLabel` (estado de erro de
// rede, DoD desta Tarefa — o campo antigo já tinha isso via `CheckboxListField`).

export interface ModuleFinancialCategories {
  financialCategory: {
    singularLabel: string;
    list: {
      pageTitle: string;
      pageSubtitle: string;
      deletedToast: string;
      table: {
        code: string;
        description: string;
        typeGrouper: string;
        classification: string;
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
      deleteConfirm: {
        title: string;
        description: string;
        warning: string;
      };
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
      classification: string;
      classificationAll: string;
      classificationOptions: {
        unclassified: string;
        capex: string;
        opex: string;
      };
    };
    /** Formulário de criação (só como filho de um grupo, `?parentUuid=`)/edição — TASK-FE-312. */
    form: {
      title: { create: string; edit: string; createChild: string };
      subtitle: { create: string; edit: string; createChild: string };
      fields: {
        description: string;
        isEnabled: string;
        type: string;
        grouper: string;
        generatesObligationOrRight: string;
        classification: string;
        accountingGrouper: string;
        centers: string;
        parent: string;
        code: string;
        class: string;
      };
      placeholders: {
        description: string;
      };
      classificationOptions: {
        unclassified: string;
        capex: string;
        opex: string;
      };
      classLabels: {
        synthetic: string;
        analytical: string;
      };
      hints: {
        codeGenerated: string;
        classPreviewBadge: string;
        typeGrouperInherited: string;
        classificationLockedSynthetic: string;
        /** TASK-FE-1091 — Tipo/Agrupador/Gera obrigação travados por fazenda/tenant, fora do fluxo de herança do pai (ex.: editando). */
        lockedByTenantContext: string;
      };
      parentPreview: {
        loading: string;
        errorTitle: string;
        errorDescription: string;
      };
      centersTree: {
        expandAll: string;
        collapseAll: string;
        selectAll: string;
        deselectAll: string;
        /** Grupo Sintético sem nenhuma folha do tenant atual. */
        emptyGroup: string;
        /** Árvore inteira sem nenhum grupo (universo vazio). */
        noCategories: string;
        searchPlaceholder: string;
        /** Busca ativa sem nenhum match. */
        noResults: string;
        /** TASK-FE-317 — estado de erro de rede (`isError`/`onRetry`). */
        errorLabel: string;
        retryLabel: string;
      };
      validation: {
        descriptionRequired: string;
        descriptionMaxLength: string;
        typeRequired: string;
        grouperRequired: string;
        classificationRequired: string;
      };
    };
    /** "Imprimir relatório" (TASK-MV-FE-07) — HTML client-side, todas as
     *  páginas, sem filtro, botão vive no card de Rateio de Movement (mirror
     *  `ModulePlanAccounts.planAccount.report`, com `columnType` extra que o
     *  de PlanAccount não tem). */
    report: {
      tooltip: string;
      documentTitle: string;
      columnCode: string;
      columnClass: string;
      columnType: string;
      columnDescription: string;
      metaCountSingular: string;
      metaCountPlural: string;
      errorToast: string;
      popupBlockedToast: string;
    };
  };
}
