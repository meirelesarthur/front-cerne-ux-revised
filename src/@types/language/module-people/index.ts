// src/@types/language/module-people/index.ts
// Tipos de i18n do módulo PESSOAS UNIFICADO (Person — Cadastros Base).
// Cobre as 5 Tarefas de tela (301-305) num único módulo (TASK-FE-300 —
// "preencher já com todos os rótulos previstos para não fatiar i18n entre
// Tarefas").

export interface ModulePeopleRoleLabels {
  proprietary: string;
  employee: string;
  provider: string;
  client: string;
  user: string;
}

export interface ModulePeople {
  person: {
    singularLabel: string;
    roles: ModulePeopleRoleLabels;
    roleHints: ModulePeopleRoleLabels;

    list: {
      pageTitle: string;
      pageSubtitle: string;
      searchPlaceholder: string;
      deletedToast: string;
      table: {
        name: string;
        document: string;
        email: string;
        roles: string;
        noRole: string;
        actions: string;
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
      deleteDialog: {
        title: string;
        description: string;
        warning: string;
      };
    };

    filter: {
      title: string;
      search: string;
      role: string;
      roleAll: string;
    };

    steps: {
      basico: string;
      endereco: string;
    };

    form: {
      title: { create: string; edit: string };
      subtitle: { create: string; edit: string };

      basico: {
        subtitle: string;
        nif: string;
        nameFisica: string;
        namePj: string;
        nicknameFisica: string;
        nicknamePj: string;
        email: string;
        phone: string;
        rolesLabel: string;
        rolesHint: string;
        roleAdded: string;
        nifFoundWarning: string;
      };

      endereco: {
        subtitle: string;
        zipCode: string;
        city: string;
        address: string;
        number: string;
        district: string;
      };

      proprietary: {
        subtitle: string;
        stateRegistrations: string;
        stateRegistrationShort: string;
        addStateRegistration: string;
        emptyStateRegistrations: string;
        farms: string;
        addFarm: string;
        emptyFarms: string;
        farm: string;
        percentage: string;
      };

      employee: {
        subtitle: string;
        office: string;
        function: string;
        commission: string;
        vlTimeProductive: string;
        vlTimeUnproductive: string;
        baseSalary: string;
        goalSalary: string;
        centerId: string;
        birthday: string;
        bank: {
          title: string;
          bankId: string;
          accountType: string;
          agency: string;
          account: string;
          pixType: string;
          pix: string;
        };
      };

      provider: {
        subtitle: string;
        type: string;
        typeOptions: {
          resale: string;
          industry: string;
          service: string;
          carrier: string;
          commissioned: string;
        };
        commission: string;
        hourValue: string;
        stateRegistration: string;
        cityRegistration: string;
        contact: string;
        contactPhone: string;
        branches: string;
        addBranch: string;
        emptyBranches: string;
        branchNif: string;
        branchName: string;
        branchStateRegistration: string;
        branchZipCode: string;
        branchCity: string;
        branchAddress: string;
        sellers: string;
        addSeller: string;
        emptySellers: string;
        sellerName: string;
        sellerEmail: string;
        sellerPhone: string;
      };

      client: {
        subtitle: string;
        cellphone: string;
        contact: string;
        contactPhone: string;
        cityRegistration: string;
        farmName: string;
        finalCustomer: string;
        finalCustomerHint: string;
        taxpayer: string;
        taxpayerHint: string;
        country: string;
        idAbroad: string;
        stateRegistrations: string;
        stateRegistrationShort: string;
        addStateRegistration: string;
        emptyStateRegistrations: string;
      };

      user: {
        subtitle: string;
        password: string;
        passwordConfirmation: string;
        passwordHint: string;
        editPasswordNotice: string;
        purchasingAssistant: string;
        purchasingAssistantHint: string;
        farms: string;
        roles: string;
        bosses: string;
        farmsSearchPlaceholder: string;
        rolesSearchPlaceholder: string;
        bossesSearchPlaceholder: string;
        selectedCount: string;
        toggleRoleWarning: string;
        /** TASK-FE-337 — modal de confirmação exibido antes de salvar quando o toggle "Usuário" é desligado numa Pessoa que JÁ TINHA usuário ativo (transição tinha→OFF). */
        deactivateDialog: {
          title: string;
          message: string;
          confirm: string;
        };
      };

      /**
       * TASK-FE-338 (execução 023, generalização do achado F/TASK-FE-337
       * para os 4 papéis NÃO-usuário) — modal de confirmação exibido antes
       * de salvar quando um ou mais dos papéis Proprietário/Funcionário/
       * Fornecedor/Cliente é desligado numa Pessoa que JÁ TINHA aquele
       * papel ativo (transição tinha→OFF). Cobre o caso de MÚLTIPLOS
       * papéis desmarcados de uma vez numa única confirmação — `message`
       * usa o placeholder `{roles}` (mesmo padrão de interpolação de
       * `PlanAccountsImport.result.preservedTitle::{count}`), substituído
       * pela lista de rótulos (`roles.*`) dos papéis afetados, separados
       * por vírgula.
       */
      roleDeactivateDialog: {
        title: string;
        message: string;
        confirm: string;
      };

      pixTypeOptions: {
        cpfCnpj: string;
        email: string;
        phone: string;
        random: string;
      };

      footer: {
        back: string;
        next: string;
        save: string;
        saving: string;
        close: string;
        stepCounter: {
          label: string;
          of: string;
        };
      };

      toasts: {
        createdSuccess: string;
        updatedSuccess: string;
        upsertSuccess: string;
      };

      unsavedChanges: {
        title: string;
        message: string;
        confirm: string;
        cancel: string;
      };

      validation: {
        nifRequired: string;
        nifInvalid: string;
        nameRequired: string;
        nameMaxLength: string;
        nicknameRequired: string;
        nicknameMaxLength: string;
        emailInvalid: string;
        emailRequiredForAccess: string;
        cityRequired: string;
        addressRequired: string;
        numberRequired: string;
        numberMaxLength: string;
        districtRequired: string;
        districtMaxLength: string;
        functionRequired: string;
        birthdayRequired: string;
        farmRequired: string;
        percentageRange: string;
        typeRequired: string;
        finalCustomerRequired: string;
        taxpayerRequired: string;
        countryRequired: string;
        branchNifRequired: string;
        branchCityRequired: string;
        branchAddressRequired: string;
        sellerNameRequired: string;
        passwordRequired: string;
        passwordMin: string;
        passwordConfirmationMismatch: string;
      };
    };
  };
}
