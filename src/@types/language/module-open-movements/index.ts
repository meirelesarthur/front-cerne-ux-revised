// src/@types/language/module-open-movements/index.ts
// Interface de tradução do módulo "Saldo Inicial" (OpenMovement — Cadastros
// Base / Financeiros, execução 031, TASK-FE-031-35). Mirror estrutural de
// `module-financial-categories` (list/filter/form), acrescido de `detail`
// (tela de Visualização, TASK-FE-031-38 — sem Edição, contrato §2). O
// conteúdo mora em
// src/constants/languages/{idioma}/languageOpenMovements.ts.

export interface ModuleOpenMovements {
  openMovement: {
    singularLabel: string;
    pluralLabel: string;
    list: {
      pageTitle: string;
      pageSubtitle: string;
      deletedToast: string;
      table: {
        code: string;
        account: string;
        date: string;
        value: string;
        proprietary: string;
      };
      actions: {
        view: string;
        delete: string;
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
      };
    };
    filter: {
      title: string;
      startDate: string;
      endDate: string;
      account: string;
      accountPlaceholder: string;
      proprietary: string;
      proprietaryPlaceholder: string;
    };
    /** Formulário de criação (SEM Edição — veredito do legado + dono, contrato §2). */
    form: {
      title: { create: string };
      subtitle: { create: string };
      fields: {
        account: string;
        type: string;
        typeCategory: string;
        proprietary: string;
        date: string;
        value: string;
        interest: string;
        document: string;
        note: string;
      };
      placeholders: {
        account: string;
        proprietary: string;
        document: string;
        note: string;
      };
      /** Valores fixos exibidos (display-only, fora do payload — contrato §5). */
      fixedValues: {
        type: string;
        typeCategory: string;
      };
      apportionments: {
        sectionTitle: string;
        sectionHint: string;
        sumLabel: string;
        sumHint: string;
        emptyTitle: string;
        addRowLabel: string;
        removeRowLabel: string;
        fields: {
          category: string;
          costCenter: string;
          value: string;
        };
        placeholders: {
          category: string;
          costCenter: string;
        };
        /** Correção pós-E2E rodada 1 (C1) — helper do campo Categoria travado (única opção aplicável). */
        categoryLockedHelper: string;
      };
      validation: {
        accountRequired: string;
        dateRequired: string;
        valueRequired: string;
        valueNotZero: string;
        documentMaxLength: string;
        noteMaxLength: string;
        proprietaryRequired: string;
        itemsMinLength: string;
        itemCategoryRequired: string;
        itemCostCenterRequired: string;
        itemValueRequired: string;
        itemValueMin: string;
      };
    };
    /** Tela de Visualização (read-only) — TASK-FE-031-38. */
    detail: {
      sections: {
        identification: string;
        apportionments: string;
      };
      fields: {
        account: string;
        type: string;
        typeCategory: string;
        date: string;
        document: string;
        value: string;
        interest: string;
        note: string;
        proprietary: string;
      };
      table: {
        category: string;
        costCenter: string;
        value: string;
      };
      notFound: {
        title: string;
        description: string;
        back: string;
      };
      noData: string;
    };
  };
}
