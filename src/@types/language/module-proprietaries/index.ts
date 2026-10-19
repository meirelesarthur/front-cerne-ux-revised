// src/@types/language/module-proprietaries/index.ts
// Interface de tradução do módulo "Proprietários" (Proprietary — Cadastros
// Base). Arquivo NOVO e independente — NÃO reaproveita `module-people`
// (Proprietary-contrato.md `## 4.2`: "não estende `PersonRequest` por
// herança", mesma independência arquitetural já usada por
// `module-providers`). O conteúdo mora em
// src/constants/languages/{idioma}/languageProprietarios.ts.
//
// TASK-PY-FE-01 cobre só a infra (singular/plural para queryKey, mensagens
// de validação do schema Yup) + ESQUELETO dos blocos `list`/`filter`/
// `form.fields`/`form.farms`/`form.stateRegistrations` (copy completo fica
// para TASK-PY-FE-02/03, mesmo padrão incremental de `module-providers`).
//
// Sem enum de `type` (Proprietary não tem campo de tipo/categoria,
// Proprietary-contrato.md `## 4.5`) — por isso, ao contrário de
// `ModuleProviders`, este módulo NÃO tem `typeOptions`/`pixTypeOptions`/
// `accountTypeOptions`.
//
// Exclusão é HARD-DELETE físico com guarda 422 (DA-PY-05, diferente do
// SOFT-delete de `Provider`) — por isso `list.actions` usa `delete` (não
// `deactivate`) e existe o bloco raiz `deleteBlocked` (TASK-PY-FE-02, mirror
// BYTE-A-BYTE de `ModuleContadores.deleteBlocked` — chave no nível raiz da
// entidade, irmã de `list`/`filter`/`form`, NÃO aninhada em `list` — mesmo
// shape `{resource,table,count}[]` de `ProprietaryInUseError`, molde direto
// de `ContadorInUseError`/`AddressingInUseError`).

export interface ModuleProprietaries {
  proprietary: {
    singularLabel: string;
    pluralLabel: string;

    /** Tela de LISTAGEM (grid) — esqueleto, copy completo em TASK-PY-FE-02. */
    list: {
      pageTitle: string;
      pageSubtitle: string;
      table: {
        document: string;
        name: string;
        nickname: string;
        city: string;
        percentage: string;
        status: string;
        active: string;
        inactive: string;
      };
      actions: {
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
      /** Diálogo de confirmação do HARD-DELETE (DA-PY-05) — molde de `deactivateDialog` de `Provider`, adaptado para exclusão física. */
      deleteDialog: {
        title: string;
        description: string;
        warning: string;
        confirm: string;
      };
      deletedToast: string;
      error: {
        message: string;
        retry: string;
      };
    };

    /** Drawer de FILTRO da listagem — esqueleto, copy completo em TASK-PY-FE-02. */
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
    };

    /** Diálogo de aviso de exclusão BLOQUEADA (422 `errors.in_use[]`),
     *  migrado para o `InUseBlockedDialog` genérico — molde byte-a-byte de
     *  `ModuleContadores.deleteBlocked`/`ModuleAddressing.deleteBlocked`.
     *  `tableLabels` mapeia as 12 tabelas reais de
     *  `CheckProprietaryDependenciesAction::RESTRICT_TABLES`. */
    deleteBlocked: {
      title: string;
      description: string;
      /** Template `"{resource} ({count})"` — `.replace()`, sem lib de
       *  interpolação (mesmo padrão do projeto). O backend já devolve
       *  `resource` como frase legível — exibida literalmente. */
      resourceLabel: string;
      tableLabels: {
        expenses: string;
        incomes: string;
        movements: string;
        transfers: string;
        areas: string;
        invoices: string;
        equipments: string;
        cashBooks: string;
        inputEntries: string;
        sales: string;
        tickets: string;
        traceabilityConfigs: string;
      };
    };

    /** Formulário create+edit — esqueleto, copy completo em TASK-PY-FE-03. */
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
        nif: string;
        nickname: string;
        name: string;
        email: string;
        phone: string;
        zipCode: string;
        address: string;
        number: string;
        district: string;
        city: string;
      };
      /** Autofill de CEP (ViaCEP + GET /cities?iso=) — molde `Contador`/`Provider`, TASK-PY-FE-03. */
      cepAutofill: {
        notFound: { title: string; description: string };
        cityNotResolved: { title: string; description: string };
        networkError: { title: string; description: string };
      };
      /** Avisos do autopreenchimento por NIF (Pessoa já cadastrada) — paridade legado. */
      nifFoundWarning: string;
      nifFoundWarningEditing: string;
      /** Proprietário já cadastrado na fazenda ativa — redireciona para a edição (UT-000774, D1). */
      nifAlreadyProprietaryRedirectWarning: string;
      nifPermissionDeniedWarning: string;
      /** Bloco `proprietary.farms[]` (participação societária por fazenda) — TASK-PY-FE-03. */
      farms: {
        empty: string;
        add: string;
        removeAria: string;
        fields: {
          farm: string;
          percentage: string;
        };
      };
      /** Bloco `proprietary.state_registration_numbers[]` (repeater simples) — TASK-PY-FE-03. */
      stateRegistrations: {
        title: string;
        empty: string;
        add: string;
        removeAria: string;
        fields: {
          value: string;
        };
      };
      validation: {
        nifRequired: string;
        nifInvalid: string;
        nameRequired: string;
        nameMaxLength: string;
        nicknameRequired: string;
        nicknameMaxLength: string;
        emailRequired: string;
        emailInvalid: string;
        emailMaxLength: string;
        addressRequired: string;
        addressMaxLength: string;
        numberRequired: string;
        numberMaxLength: string;
        districtRequired: string;
        districtMaxLength: string;
        cityRequired: string;
        farmRequired: string;
        /** Array `farms` vazio — mínimo 1 linha (TASK-PY-FE-03). */
        farmsMinRequired: string;
        percentageRange: string;
      };
    };
  };
}
