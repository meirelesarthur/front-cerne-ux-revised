// src/@types/language/module-movements/index.ts
// Interface de tradução do módulo "Mov. Caixa/Bancário" (Movement —
// Financeiro, TASK-MV-FE-01). Mirror estrutural de `module-open-movements`
// (list/filter/form), acrescido do cabeçalho completo (22 campos), das
// opções de `type`/`type_category` e do bloco `allocation` (form dedicado de
// rateio, `PATCH .../allocation` — Movement-contrato-tela.md §4). O conteúdo
// mora em src/constants/languages/{idioma}/languageMovements.ts.

export interface ModuleMovements {
  movement: {
    singularLabel: string;
    pluralLabel: string;
    list: {
      /** Título de tela: "Mov. Caixa/Bancário" — mirror sidebar `fin-cai`
       *  (`navigationTree.ts`), NÃO o rótulo genérico "Movimento". */
      pageTitle: string;
      pageSubtitle: string;
      deletedToast: string;
      table: {
        code: string;
        date: string;
        type: string;
        typeCategory: string;
        account: string;
        proprietary: string;
        value: string;
        totalAllocated: string;
        interest: string;
      };
      actions: {
        edit: string;
        allocation: string;
        delete: string;
        viewOpeningBalance: string;
      };
      footer: {
        pageTotal: string;
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
        cascadeTitle: string;
        /** `{count}` é substituído pela quantidade de títulos gerados. */
        cascadeDescription: string;
        cascadeConfirm: string;
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
      type: string;
      category: string;
      categoryPlaceholder: string;
      harvest: string;
      harvestPlaceholder: string;
      categoryType: string;
      categoryTypePlaceholder: string;
      categoryDisabledHint: string;
      valueMin: string;
      valueMax: string;
    };
    /** Formulário completo create/edit (22 campos, Movement-contrato-tela.md §2/§5). */
    form: {
      title: { create: string; edit: string };
      subtitle: { create: string; edit: string };
      fields: {
        date: string;
        type: string;
        typeCategory: string;
        account: string;
        destinationAccount: string;
        originAccount: string;
        farm: string;
        proprietary: string;
        client: string;
        provider: string;
        value: string;
        interest: string;
        document: string;
        note: string;
        fiscalDocument: string;
        generatesObligation: string;
      };
      placeholders: {
        account: string;
        destinationAccount: string;
        originAccount: string;
        farm: string;
        proprietary: string;
        client: string;
        provider: string;
        document: string;
        note: string;
      };
      /** TASK-MV-FE-11 — `aria-label` do botão criar/editar Cliente
       *  (`ClientFormModal`) ao lado do `SelectAsyncPaginate` de Cliente.
       *  TASK-MV-FE-13 — idem para Fornecedor (`ProviderFormModal`). */
      actions: {
        addClientAria: string;
        editClientAria: string;
        addProviderAria: string;
        editProviderAria: string;
      };
      /** TASK-MV-FE-09 (Ajustes 4/7) — tooltips de ajuda ao lado do label,
       *  mirror `Field.tsx`/`CreateBatchArea.tsx` (convenção `hints.<campo>Tooltip`). */
      hints: {
        documentTooltip: string;
        fiscalDocumentTooltip: string;
      };
      /** Labels das opções de `type` (fábrica `movementTypeOptions`, só E/S —
       *  Decisão #4 do contrato de API, `I` inacessível nesta tela). */
      typeOptions: {
        income: string;
        expense: string;
      };
      /** Labels das opções de `type_category` (fábrica
       *  `movementTypeCategoryOptions`, E/S/T/F — `I` inacessível). */
      typeCategoryOptions: {
        income: string;
        expense: string;
        transfer: string;
        financing: string;
        initialBalance: string;
      };
      allocations: {
        sectionTitle: string;
        sectionHint: string;
        sumLabel: string;
        remainingLabel: string;
        overLabel: string;
        balancedLabel: string;
        sumHint: string;
        emptyTitle: string;
        addRowLabel: string;
        removeRowLabel: string;
        fields: {
          category: string;
          center: string;
          planAccount: string;
          harvest: string;
          value: string;
          percent: string;
        };
        placeholders: {
          category: string;
          center: string;
          planAccount: string;
          harvest: string;
        };
        /** TASK-MV-FE-07 (addendum §8) — 3 botões de impressão do card de
         *  Rateio (Categoria/Conta Contábil/Rateio do movimento), presentes
         *  nas 3 telas que renderizam `MovementAllocationEditor`. */
        reports: {
          categoryTooltip: string;
          planAccountTooltip: string;
          allocationTooltip: string;
          allocationDocumentTitle: string;
          allocationColumnCategory: string;
          allocationColumnPlanAccount: string;
          allocationColumnCenter: string;
          allocationColumnValue: string;
          allocationColumnPercent: string;
          allocationTotalLabel: string;
          /** Renderizado quando `plan_account_uuid` da linha é `null` — nunca "—" via fallback silencioso. */
          allocationPlanAccountEmpty: string;
          errorToast: string;
          popupBlockedToast: string;
        };
      };
      validation: {
        dateRequired: string;
        typeRequired: string;
        typeCategoryRequired: string;
        accountRequired: string;
        destinationAccountRequired: string;
        proprietaryRequired: string;
        valueRequired: string;
        valueNotZero: string;
        documentMaxLength: string;
        noteMaxLength: string;
        allocationsMinLength: string;
        allocationCategoryRequired: string;
        allocationCenterRequired: string;
        allocationValueRequired: string;
        allocationValueMin: string;
        allocationsSumMismatch: string;
      };
      /** TASK-MV-FE-05 — toast informativo pós-submit quando o servidor
       *  devolve `generated_obligation_draft` (Decisão #9) e NÃO existe,
       *  ainda, tela de Expense/Income pronta para receber o state de
       *  navegação (Movement-contrato-tela.md, "Riscos" da TASK-MV-FE-05).
       *  Não bloqueia o fluxo — só avisa. */
      openingBalanceNotice: string;
      cascadeSave: {
        title: string;
        /** `{count}` é substituído pela quantidade de títulos gerados. */
        description: string;
        confirm: string;
      };
      obligationDraftGenerated: {
        title: string;
        /** Modal OFX: não redireciona (como o legado) — só informa. */
        ofxNotice: string;
        navigating: string;
        noPermission: string;
      };
    };
    /** Formulário dedicado de edit-rateio (`PATCH .../allocation`) — SEM
     *  cabeçalho editável, mirror do `MovementAllocationEditor` reusado
     *  (Movement-contrato-tela.md §4). */
    allocation: {
      title: string;
      subtitle: string;
      headerValueLabel: string;
      toastSuccess: string;
    };
  };
}
