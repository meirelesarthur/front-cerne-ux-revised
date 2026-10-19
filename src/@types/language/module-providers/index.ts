// src/@types/language/module-providers/index.ts
// Interface de tradução do módulo "Fornecedores" (Provider — Cadastros Base).
// Arquivo NOVO e independente — NÃO reaproveita `module-people` (contrato
// `Provider-FrontEnd-contrato.md ## 11` item 5: "i18n modular por módulo",
// mesma independência arquitetural de `ProviderRequest` não estender
// `PersonRequest`). O conteúdo mora em
// src/constants/languages/{idioma}/languageProviders.ts.
//
// TASK-PR-FE-01 cobriu só o necessário à camada de infra (singular/plural
// para queryKey, opções do enum `type`, mensagens de validação do schema
// Yup). TASK-PR-FE-02 estende `list`/`filter` (copy da tela de listagem) —
// `form` (Tabs Dados/Conta/Filiais/Vendedores) fica para TASK-PR-FE-03 em
// diante, mesmo padrão incremental já usado em `module-banks`/
// `module-nature-operations`.

export interface ModuleProviders {
  provider: {
    singularLabel: string;
    pluralLabel: string;

    /** Rótulos do enum `ProviderTypeEnum` (backend, 1-6, DA-PR-09). */
    typeOptions: {
      fornecedor: string;
      funcionario: string;
      terceirizado: string;
      transportador: string;
      comissionado: string;
      inseminador: string;
    };

    /** Rótulos do enum `PixType` (backend, 0-3, aba "Conta") — TASK-PR-FE-04. */
    pixTypeOptions: {
      cpfCnpj: string;
      email: string;
      phone: string;
      random: string;
    };

    /** Rótulos de `account_type` (string livre `C`/`P`, aba "Conta") — TASK-PR-FE-04. */
    accountTypeOptions: {
      checking: string;
      savings: string;
    };

    /** Tela de LISTAGEM (grid) — TASK-PR-FE-02. */
    list: {
      pageTitle: string;
      pageSubtitle: string;
      table: {
        document: string;
        name: string;
        city: string;
        type: string;
        status: string;
        active: string;
        inactive: string;
      };
      actions: {
        edit: string;
        deactivate: string;
        activate: string;
        delete: string;
      };
      emptyState: {
        titleEmpty: string;
        descriptionEmpty: string;
        titleFiltered: string;
        descriptionFiltered: string;
        cta: string;
      };
      deactivatedToast: string;
      activatedToast: string;
      deletedToast: string;
      deactivateDialog: {
        title: string;
        description: string;
        warning: string;
        confirm: string;
      };
      activateDialog: {
        title: string;
        description: string;
        warning: string;
        confirm: string;
      };
      deleteDialog: {
        title: string;
        description: string;
        warning: string;
        confirm: string;
      };
    };

    /** Drawer de FILTRO da listagem — TASK-PR-FE-02. */
    filter: {
      title: string;
      search: string;
      searchPlaceholder: string;
      type: string;
      typeAll: string;
      city: string;
      cityAll: string;
      isEnabled: string;
      isEnabledAll: string;
      enabledOptions: {
        active: string;
        inactive: string;
      };
    };

    /** Formulário create+edit (Tabs Dados/Conta/Filiais/Vendedores) — TASK-PR-FE-03. */
    form: {
      title: {
        create: string;
        edit: string;
      };
      subtitle: {
        create: string;
        edit: string;
      };
      tabs: {
        dados: string;
        conta: string;
        filiais: string;
        vendedores: string;
      };
      /** Placeholder das abas 1-3 (Conta/Filiais/Vendedores), preenchidas por TASK-PR-FE-04/05/06. */
      comingSoon: string;
      /** Prefill de NIF raiz (TASK-PR-FE-12, correção `ERRO-05`) — toast de sucesso, criação. */
      nifFoundWarning: string;
      /** Idem, em edição (dados de OUTRA Pessoa substituíram os do form). */
      nifFoundWarningEditing: string;
      /** 403 do endpoint reusado (`people_view` ausente) — decisão do dono, `ERRO-05`. */
      nifPermissionDeniedWarning: string;
      /** D5 (UT-000773): toast quando o fornecedor salvo está inativo e não é auto-selecionado. */
      savedInactiveNotSelected: string;
      /** Sim/Não do campo Ativo do form (distinto de `filter.enabledOptions`). */
      enabledOptions: {
        yes: string;
        no: string;
      };
      placeholders: {
        defaultCostCenter: string;
      };
      fields: {
        nif: string;
        nickname: string;
        name: string;
        stateRegistration: string;
        cityRegistration: string;
        type: string;
        commission: string;
        hourValue: string;
        email: string;
        phone: string;
        zipCode: string;
        address: string;
        number: string;
        district: string;
        city: string;
        contact: string;
        contactPhone: string;
        cellphone: string;
        isEnabled: string;
        defaultCostCenter: string;
        /** Aba "Conta" (bloco bancário, `sometimes`) — TASK-PR-FE-04. */
        bankId: string;
        accountType: string;
        agency: string;
        account: string;
        pixType: string;
        pix: string;
      };
      /** Autofill de CEP (ViaCEP + GET /cities?iso=) — molde `Contador`. */
      cepAutofill: {
        notFound: { title: string; description: string };
        cityNotResolved: { title: string; description: string };
        networkError: { title: string; description: string };
      };
      /** Aba "Filiais" (array dinâmico + autofill CNPJ via `receitaws.com.br`) — TASK-PR-FE-05. */
      branches: {
        empty: string;
        add: string;
        removeAria: string;
        fields: {
          name: string;
          nif: string;
          stateRegistration: string;
          zipCode: string;
          city: string;
          address: string;
        };
        /** Autofill `receitaws.com.br` — dependência de terceiro, tratamento gracioso obrigatório. */
        cnpjAutofill: {
          loading: string;
          notFound: { title: string; description: string };
          cityNotResolved: { title: string; description: string };
        };
      };
      /** Aba "Vendedores" (array dinâmico simples, sem autofill) — TASK-PR-FE-06. */
      sellers: {
        empty: string;
        add: string;
        removeAria: string;
        fields: {
          name: string;
          email: string;
          phone: string;
        };
      };
      validation: {
        nifRequired: string;
        nifInvalid: string;
        nameRequired: string;
        nameMaxLength: string;
        nicknameRequired: string;
        nicknameMaxLength: string;
        emailInvalid: string;
        emailMaxLength: string;
        addressRequired: string;
        addressMaxLength: string;
        numberRequired: string;
        numberMaxLength: string;
        districtRequired: string;
        districtMaxLength: string;
        cityRequired: string;
        typeRequired: string;
        commissionRequiredForType: string;
        hourValueRequiredForType: string;
        contactMaxLength: string;
        cellphoneMaxLength: string;
        defaultCostCenterInvalid: string;
        isEnabledRequired: string;
        branchNifRequired: string;
        branchCityRequired: string;
        branchAddressRequired: string;
        sellerNameRequired: string;
        sellerEmailInvalid: string;
      };
    };
  };
}
