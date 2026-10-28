// src/@types/language/module-cost-centers/index.ts
// Interface de tradução do módulo de CENTROS DE CUSTO (Cadastros Base).
// Espelha a convenção do módulo de Perfis (module-roles). O conteúdo mora em
// src/constants/languages/{idioma}/languageCostCenters.ts.
//
// TASK-FE-002 (grid) cobriu list + filter. TASK-FE-003 (formulário de
// cadastro/edição — campos centrais) adicionou a seção `form`. TASK-FE-004
// adiciona `form.apportionments` (seção de Rateio) + chaves de validação
// correspondentes, sem alterar o que já existia. TASK-FE-013 (DEC-005) adiciona
// `list.actions.createDescendant` (ação condicional por item na grid).
// TASK-FE-014 (DEC-005) adiciona `list.emptyState.titleEmptyNoCreate`/
// `descriptionEmptyNoCreate` (3ª variação de cópia, sem CTA, para quem não
// pode criar centro de topo). TASK-FE-015 (DEC-005) adiciona o 3º modo do
// formulário ("cadastrar descendente"): `form.title.createDescendant`/
// `form.subtitle.createDescendant`, `form.hints.parentUuidFixedDescendant` e
// `form.parentPreview` (banner do antecessor — loading/erro).

export interface ModuleCostCenters {
  costCenter: {
    singularLabel: string;
    list: {
      pageTitle: string;
      pageSubtitle: string;
      deletedToast: string;
      table: {
        code: string;
        class: string;
        condition: string;
        description: string;
        active: string;
        activeLabel: string;
        inactiveLabel: string;
      };
      actions: {
        /** TASK-FE-CC-09b — abre a tela de detalhe (TASK-FE-CC-09a). */
        view: string;
        createDescendant: string;
        edit: string;
        delete: string;
      };
      emptyState: {
        titleEmpty: string;
        descriptionEmpty: string;
        /** DEC-005 — variação sem CTA para quem não pode criar centro de topo (não-Gestor_Plataf). */
        titleEmptyNoCreate: string;
        descriptionEmptyNoCreate: string;
        titleFiltered: string;
        descriptionFiltered: string;
        cta: string;
      };
    };
    filter: {
      title: string;
      search: string;
      searchPlaceholder: string;
      type: string;
      typeAll: string;
      typeOptions: {
        productive: string;
        apportioned: string;
      };
      isEnabled: string;
      isEnabledAll: string;
      enabledOptions: {
        active: string;
        inactive: string;
      };
    };
    /** Formulário de criação/edição — campos centrais (TASK-FE-003) + Rateio (TASK-FE-004) + modo descendente (TASK-FE-015). */
    form: {
      title: { create: string; edit: string; createDescendant: string };
      subtitle: { create: string; edit: string; createDescendant: string };
      sectionData: string;
      fields: {
        description: string;
        condition: string;
        isEnabled: string;
        allowPointing: string;
        type: string;
        parentUuid: string;
        code: string;
        class: string;
        categories: string;
      };
      placeholders: {
        description: string;
        parentUuid: string;
      };
      hints: {
        parentUuidImmutable: string;
        parentUuidCreate: string;
        /** DEC-005/TASK-FE-015 — hint do modo "criar descendente" (Antecessor pré-fixado, imutável). */
        parentUuidFixedDescendant: string;
        codeGenerated: string;
        classPreviewBadge: string;
      };
      conditionOptions: {
        expense: string;
        revenue: string;
        both: string;
      };
      classLabels: {
        synthetic: string;
        analytical: string;
      };
      /**
       * TASK-FE-316 (execução 023) — árvore tri-state (`CategoryTreeSelector`,
       * estendido) de Categorias Financeiras vinculadas. Substitui o bloco
       * `categoriesField` do multiselect chapado da TASK-FE-314 (mesmo
       * espírito de `languagePlanAccounts.categoriesTree`, bloco PRÓPRIO —
       * não compartilhado entre módulos de domínio diferentes — acrescido de
       * `searchPlaceholder`/`noResults` para a busca client-side).
       */
      categoriesTree: {
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
      };
      /** Seção condicional de Rateio (TASK-FE-004) — só renderizada quando `type === 'apportioned'`. */
      apportionments: {
        sectionTitle: string;
        sectionHint: string;
        addRowLabel: string;
        removeRowLabel: string;
        emptyTitle: string;
        fields: {
          costCenter: string;
          percentage: string;
        };
        placeholders: {
          costCenter: string;
        };
        sumLabel: string;
        sumHint: string;
      };
      /** DEC-005/TASK-FE-015 — banner do Antecessor no modo "criar descendente" (`GET /cost-centers/{parentUuid}`). */
      parentPreview: {
        loading: string;
        errorTitle: string;
        errorDescription: string;
      };
      validation: {
        descriptionRequired: string;
        descriptionMaxLength: string;
        conditionRequired: string;
        apportionmentsRequired: string;
        apportionmentCostCenterRequired: string;
        apportionmentPercentageRequired: string;
        apportionmentPercentageRange: string;
      };
    };
    /**
     * TASK-FE-CC-09a — tela de DETALHE (somente leitura), padrão
     * `SafraDetalhe.tsx`: `FormContainer` + `InfoField`. Reaproveita a maior
     * parte dos rótulos já existentes em `form.fields`/`form.apportionments`/
     * `list.table` — este bloco só acrescenta o que não tinha precedente
     * (título dos painéis, estado 404, rótulo do botão Editar).
     */
    detail: {
      actions: {
        edit: string;
      };
      generalData: {
        title: string;
      };
      categories: {
        title: string;
        empty: string;
      };
      apportionments: {
        title: string;
      };
      /** uuid válido mas centro de custo não encontrado (outro tenant/excluído). */
      notFound: {
        title: string;
        description: string;
        back: string;
      };
    };
  };
}
