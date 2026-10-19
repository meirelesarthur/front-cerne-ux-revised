// src/@types/language/module-accounts/index.ts
// Interface de tradução do módulo "Contas Bancárias" (Account — Cadastros
// Base / Financeiros, execução 025, TASK-FE-561). Arquivo NOVO e
// independente, mirror estrutural de `module-providers` (canônico novo). O
// conteúdo mora em
// src/constants/languages/{idioma}/languageAccounts.ts.
//
// TASK-FE-561 cobre o pacote completo (singular/plural para queryKey,
// opções dos enums `type`/`type_cnab`, listagem, filtro e formulário) de uma
// vez só — ao contrário de `module-providers` (incremental por Tarefa), pois
// esta execução fatiou a fundação de dados (560) e as constantes/i18n (561)
// em Tarefas separadas, mas o pacote i18n em si é consumido integralmente
// pelas Tarefas de UI seguintes (564/565/566).

export interface ModuleAccounts {
  account: {
    singularLabel: string;
    pluralLabel: string;

    /**
     * Tela de LISTAGEM (grid) — TASK-FE-564. Reestruturado nesta Tarefa
     * (nada ainda consumia o shape anterior de TASK-FE-561 — grep
     * confirmado antes da mudança) para o padrão completo de Estados de UI
     * já usado por `packages`/`categoryAnimals` (pageTitle/pageSubtitle,
     * emptyState com variante filtrada, noFarmSelected — guard de fazenda
     * ativa, `farm.context` ESTRITO).
     */
    list: {
      pageTitle: string;
      pageSubtitle: string;
      columns: {
        description: string;
        bank: string;
        agency: string;
        account: string;
        type: string;
        limit: string;
        balance: string;
        isEnabled: string;
        ticket: string;
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
      /** Sem fazenda ativa — backend `farm.context` ESTRITO, zero chamada de rede (mirror Packages). */
      noFarmSelected: {
        title: string;
        description: string;
      };
      deleteConfirm: {
        title: string;
        description: string;
        warning: string;
      };
      deletedToast: string;
      /** Guarda de exclusão heurística client-side (mirror do mock — backend não garante, GAP-BE-260/261). */
      deleteBlocked: {
        title: string;
        balance: string;
        dependents: string;
        hint: string;
        confirm: string;
      };
    };

    /** Drawer de FILTRO da listagem (`<Form formFilter>`) — TASK-FE-564. */
    filter: {
      title: string;
      search: string;
      searchPlaceholder: string;
      type: string;
      typeAll: string;
      isEnabled: string;
      isEnabledAll: string;
      enabledOptions: {
        active: string;
        inactive: string;
      };
    };

    /** Formulário create+edit — TASK-FE-565/566. */
    form: {
      title: {
        create: string;
        edit: string;
      };
      subtitle: {
        create: string;
        edit: string;
      };
      sections: {
        general: string;
        ticket: string;
        farms: string;
      };
      fields: {
        bank: string;
        agency: string;
        account: string;
        type: string;
        code: string;
        description: string;
        limit: string;
        balance: string;
        isEnabled: string;
        useCashBook: string;
        provider: string;
        investmentAccount: string;
        isTicket: string;
        bankContract: string;
        bankAgreement: string;
        typeCnab: string;
        proprietaries: string;
        farms: string;
      };
      placeholders: Record<string, string>;
      /** Rótulos do enum `AccountType` (backend, C/P/I/L). */
      typeOptions: {
        current: string;
        savings: string;
        investment: string;
        cashBook: string;
      };
      /** Rótulos do enum `Cnab` (backend, 1/2). */
      cnabOptions: {
        cnab240: string;
        cnab400: string;
      };
      hints: {
        balanceReadOnly: string;
        investmentAccountFilter: string;
      };
      /**
       * TASK-FE-566 — bundle de textos do `CheckboxListField` "Fazendas
       * Vinculadas" (`farm_uuids`), mirror `Issuers::form.farms`
       * (`searchPlaceholder`/`selectAllLabel`/`deselectAllLabel`/
       * `selectedCountLabel`/`emptyLabel`/`errorLabel`/`retryLabel`).
       * Coexiste com `fields.farms` (rótulo curto do campo, já existente).
       */
      farms: {
        searchPlaceholder: string;
        selectAllLabel: string;
        deselectAllLabel: string;
        selectedCountLabel: string;
        emptyLabel: string;
        errorLabel: string;
        retryLabel: string;
      };
      /**
       * TASK-FE-566 — bundle de textos do `CheckboxListField` "Proprietários"
       * (`proprietary_uuids`), mirror `form.farms` acima. TASK-FE-567 fecha
       * `GAP-FE-155` (endpoint `/proprietaries/options` real, `TASK-BE-568`)
       * e remove `unavailableHint` (deixou de fazer sentido — endpoint
       * existe); `emptyLabel` passa a cobrir o caso de lista vazia/curta por
       * proprietário órfão do pivô `proprietary_tenant` (estado de UI
       * honesto, não um erro).
       */
      proprietaries: {
        searchPlaceholder: string;
        selectAllLabel: string;
        deselectAllLabel: string;
        selectedCountLabel: string;
        emptyLabel: string;
        emptyNoFarmsLabel: string;
        errorLabel: string;
        retryLabel: string;
      };
      validation: {
        bankRequired: string;
        agencyRequired: string;
        agencyMaxLength: string;
        accountRequired: string;
        accountMaxLength: string;
        typeRequired: string;
        codeRequired: string;
        codeMaxLength: string;
        descriptionRequired: string;
        descriptionMaxLength: string;
        limitRequired: string;
        bankContractRequired: string;
        bankContractMaxLength: string;
        bankAgreementRequired: string;
        bankAgreementMaxLength: string;
        typeCnabRequired: string;
        proprietariesRequired: string;
      };
      savedToast: string;
    };
  };
}
