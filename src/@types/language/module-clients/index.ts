// src/@types/language/module-clients/index.ts
// Interface de tradução do módulo "Clientes" (Client — Cadastros Base).
// Arquivo NOVO e independente — NÃO reaproveita `module-people` (mesma
// independência arquitetural já usada por `module-proprietaries`/
// `module-providers`). O conteúdo mora em
// src/constants/languages/{idioma}/languageClientes.ts.
//
// ⚠️ SCAFFOLD ADIANTADO POR ESPELHAMENTO (TASK-CL-FE-01) — escrito ANTES de
// `Client-contrato.md`/backend existirem, mirror byte-a-byte de
// `ModuleProprietaries` (irmão estruturalmente mais próximo). Sem enum de
// `type` (Client não tem campo de tipo/categoria) e SEM bloco `farms`
// (diferente de `ModuleProprietaries`) — em vez disso, os campos de papel
// fiscais/comerciais ficam em `form.fields`/`form.client` +
// `form.stateRegistrations` (repeater, mesmo shape de
// `ModuleProprietaries.form.stateRegistrations`).
//
// Exclusão é HARD-DELETE físico com guarda 422 por DEFAULT (fork dependente
// do contrato, ver `client-service.ts`) — por isso `list.actions` usa
// `delete` (não `deactivate`) e existe o bloco raiz `deleteBlocked` (mirror
// BYTE-A-BYTE de `ModuleProprietaries.deleteBlocked`/
// `ModuleContadores.deleteBlocked`).

export interface ModuleClients {
  client: {
    singularLabel: string;
    pluralLabel: string;

    /** Tela de LISTAGEM (grid) — TASK-CL-FE-02. */
    list: {
      pageTitle: string;
      pageSubtitle: string;
      table: {
        document: string;
        name: string;
        nickname: string;
        city: string;
        cellphone: string;
        status: string;
        active: string;
        inactive: string;
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
      /** Diálogo de confirmação do HARD-DELETE (default assumido) — molde de `deleteDialog` de `Proprietary`. */
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

    /** Drawer de FILTRO da listagem — TASK-CL-FE-02. */
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

    /** Diálogo de aviso de exclusão BLOQUEADA (422 `errors.in_use[]`,
     *  migrado para o `InUseBlockedDialog` genérico) — molde byte-a-byte de
     *  `ModuleProprietaries.deleteBlocked`. `tableLabels` mapeia as 14
     *  tabelas reais de `CheckClientDependenciesAction::RESTRICT_TABLES`
     *  (mesmo padrão de `ModuleAddressing`/`ModuleFunctions`). */
    deleteBlocked: {
      title: string;
      description: string;
      resourceLabel: string;
      tableLabels: {
        budgets: string;
        charges: string;
        ctes: string;
        harvestProducts: string;
        incomes: string;
        moduleWeighings: string;
        movementSales: string;
        movements: string;
        nves: string;
        orders: string;
        saleContracts: string;
        sales: string;
        transferAbcBatches: string;
        transfers: string;
      };
    };

    /** Formulário create+edit — TASK-CL-FE-03. */
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
      /** Autofill de CEP (ViaCEP + GET /cities?iso=) — molde `Proprietary`/`Contador`. */
      cepAutofill: {
        notFound: { title: string; description: string };
        cityNotResolved: { title: string; description: string };
        networkError: { title: string; description: string };
        /** DEFEITO-CLIENTES-01 (2026-07-30) — ViaCEP respondeu, mas sem
         *  logradouro/bairro (comum em CEPs de cidade pequena/rural, sem
         *  numeração de rua). Endereço/Bairro ficam para preenchimento
         *  manual — este toast existe para não parecer "autofill quebrado". */
        partialData: { title: string; description: string };
      };
      /** Prefill de CPF/CNPJ (TASK-CL-FE-04, `97-Esteiras/012`) — descrição do
       *  toast mostrado ao encontrar uma Pessoa já cadastrada com o mesmo NIF
       *  (`onBlur`, criação); título reusa `singularLabel` (mesmo padrão de
       *  `StepDadosBasicos.tsx::handleNifBlur`). */
      nifFoundWarning: string;
      /** AJUSTE DE HOMOLOGAÇÃO (dono, 2026-07-30, `97-Esteiras/012`) — variante
       *  do toast acima usada quando o prefill dispara em EDIÇÃO (documento
       *  alterado para o de outra Pessoa já cadastrada): deixa explícito que
       *  os dados de OUTRA pessoa substituíram o que estava no formulário. */
      nifFoundWarningEditing: string;
      /** Bloco `client.*` — campos fiscais/comerciais do papel (mirror
       *  `StepCliente.tsx`/`languagePeople.ts:169-185`, cópia literal).
       *  `isEnabled` ADICIONADO — AJUSTE DE HOMOLOGAÇÃO (dono, 2026-07-30):
       *  `is_enabled` ("Ativo*") passou a ser campo do form. */
      client: {
        cellphone: string;
        contact: string;
        contactPhone: string;
        cityRegistration: string;
        farmName: string;
        isEnabled: string;
        finalCustomer: string;
        finalCustomerHint: string;
        taxpayer: string;
        taxpayerHint: string;
        country: string;
        idAbroad: string;
      };
      /** Bloco `client.state_registrations[]` (repeater simples) — mirror `ModuleProprietaries.form.stateRegistrations`. */
      stateRegistrations: {
        /** Título da seção do repeater — "IE do cliente" (EST-07). */
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
        stateRegistrationInvalid: string;
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
        countryRequired: string;
      };
    };

    /** Tela de VISUALIZAÇÃO (somente leitura) — lote 01/EST-085 passada 2,
     *  mirror estrutural de `ModuleBaseRegistrations.trough.detail` /
     *  `DetalheCentroCusto.tsx`. Person raiz + papel Client achatados nos
     *  mesmos painéis do `ClientDetail` (@types/v2/CadastrosBase/client). */
    detail: {
      sections: {
        generalData: string;
        address: string;
        client: string;
        stateRegistrations: string;
      };
      fields: {
        nif: string;
        name: string;
        nickname: string;
        email: string;
        phone: string;
        address: string;
        number: string;
        district: string;
        zipCode: string;
        city: string;
        cellphone: string;
        contact: string;
        contactPhone: string;
        cityRegistration: string;
        farmName: string;
        finalCustomer: string;
        taxpayer: string;
        country: string;
        idAbroad: string;
      };
      stateRegistrationsEmpty: string;
      actions: {
        edit: string;
      };
      notFound: {
        title: string;
        description: string;
        back: string;
      };
    };
  };
}
