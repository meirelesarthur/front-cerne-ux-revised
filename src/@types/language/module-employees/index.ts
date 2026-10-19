// src/@types/language/module-employees/index.ts
// Interface de tradução do módulo "Funcionários" (Employee — Cadastros
// Base). Arquivo NOVO e independente — NÃO reaproveita `module-people`
// (mesma independência arquitetural de `EmployeeRequest` não estender
// `PersonRequest`, DA-EMP-11). O conteúdo mora em
// src/constants/languages/{idioma}/languageEmployees.ts.
//
// TASK-EMP-FE-01 cobre a infra (singular/plural para queryKey, mensagens de
// validação do schema Yup, esqueleto de `list`/`filter`/`form.fields`) —
// `TASK-EMP-FE-02`/`03`/`04` estendem `list`/`form` conforme a tela é
// materializada, mesmo padrão incremental já usado em `module-providers`/
// `module-clients`.

export interface ModuleEmployees {
  employee: {
    singularLabel: string;
    pluralLabel: string;

    /** Rótulos do enum `PixType` (backend, 0-3) — mirror `module-providers`. */
    pixTypeOptions: {
      cpfCnpj: string;
      email: string;
      phone: string;
      random: string;
    };

    /** Rótulos de `account_type` (string livre `C`/`P`) — mirror `StepFuncionario.tsx`. */
    accountTypeOptions: {
      checking: string;
      savings: string;
    };

    /** Tela de LISTAGEM (grid) — `TASK-EMP-FE-02`. */
    list: {
      pageTitle: string;
      pageSubtitle: string;
      table: {
        document: string;
        name: string;
        email: string;
        phone: string;
        office: string;
        createdAt: string;
        status: string;
        active: string;
        inactive: string;
      };
      actions: {
        edit: string;
        deactivate: string;
        /** Ação condicional de linha (funcionário INATIVO) — reativa via
         * `PATCH /employees/{uuid}/activate`. Convive com `deactivate`
         * (mutuamente exclusivas por linha, nunca as duas ao mesmo tempo). */
        activate: string;
        /** Exclui o registro (`DELETE /employees/{uuid}`, 095). */
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
      /** Toast de sucesso da reativação (mirror `deactivatedToast`). */
      activatedToast: string;
      /** Toast de sucesso da exclusão (095). */
      deletedToast: string;
      /** Diálogo de DESATIVAÇÃO (`PATCH …/deactivate`) — reversível. */
      deactivateDialog: {
        title: string;
        description: string;
        warning: string;
        confirm: string;
      };
      /** Diálogo de EXCLUSÃO (`DELETE`, 095) — irreversível. */
      deleteDialog: {
        title: string;
        description: string;
        warning: string;
        confirm: string;
      };
      /** Diálogo de confirmação da reativação — mirror `deactivateDialog`.
       * `warning` é OBRIGATÓRIO: sem `warningText` explícito, o
       * `DeleteConfirmDialog` cai no fallback global
       * `languageGB.admin.common.deleteDialog.warning` ("Esta ação é
       * permanente e não pode ser desfeita...") — FALSO para ativação, que é
       * reversível (pode desativar de novo). Achado do Tester, corrigido
       * nesta chave. */
      activateDialog: {
        title: string;
        description: string;
        warning: string;
        confirm: string;
      };
    };

    /** Drawer de FILTRO da listagem — `TASK-EMP-FE-02`. Sem filtro de FK (DA-EMP-04). */
    filter: {
      title: string;
      search: string;
      searchPlaceholder: string;
      startDate: string;
      endDate: string;
      isEnabled: string;
      isEnabledAll: string;
      enabledOptions: {
        active: string;
        inactive: string;
      };
    };

    /** Formulário create+edit — `TASK-EMP-FE-03`. */
    form: {
      title: {
        create: string;
        edit: string;
      };
      subtitle: {
        create: string;
        edit: string;
      };
      /** Título da seção "Vínculo Empregatício" (bloco `employee.*`) — TASK-EMP-FE-03. */
      employmentSectionTitle: string;
      /** TASK-EMP-FE-05 (correção `ERRO-05`) — toast do prefill de CPF/CNPJ
       *  (`onBlur`, criação); mirror `languageClientes.ts` (`TASK-CL-FE-04`). */
      nifFoundWarning: string;
      /** Variante do toast acima usada quando o prefill dispara em EDIÇÃO
       *  (documento alterado para o de outra Pessoa já cadastrada) — deixa
       *  explícito que os dados de OUTRA pessoa substituíram o formulário. */
      nifFoundWarningEditing: string;
      /** TASK-EMP-FE-05 — SEM equivalente em Clientes (divergência
       *  deliberada, Decisão do dono `ERRO-05` 2026-08-02): aviso quando o
       *  lookup de NIF retorna 403 (usuário sem `people_view`) — nunca
       *  string literal, nunca a string crua do backend. */
      nifPermissionDeniedWarning: string;
      /** UT-000712 (correção, esteira 100) — toast informativo disparado no
       *  modo CRIAÇÃO quando `handleNifBlur` encontra um Employee JÁ
       *  EXISTENTE (mesmo CPF/CNPJ) na fazenda ativa; o form redireciona para
       *  a edição desse Employee em vez de prefill parcial (decisão do
       *  dono). */
      employeeAlreadyExistsRedirectWarning: string;
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
        office: string;
        function: string;
        commission: string;
        vlTimeProductive: string;
        baseSalary: string;
        goalSalary: string;
        centerId: string;
        birthday: string;
      };
      bank: {
        title: string;
        bankId: string;
        accountType: string;
        agency: string;
        account: string;
        pixType: string;
        pix: string;
      };
      /** TASK-EMP-FE-03 — autofill de endereço via ViaCEP no `onBlur` de
       * `zip_code` (mirror Fornecedores/Clientes). */
      cepAutofill: {
        notFound: { title: string; description: string };
        cityNotResolved: { title: string; description: string };
        networkError: { title: string; description: string };
      };
      /** Bloco opcional `create_user`/`role` (DA-EMP-06) — TASK-EMP-FE-04. */
      user: {
        sectionTitle: string;
        createUser: string;
        role: string;
        /** 422 tipado `errors.create_user` (`hasReachedUsersLimits`,
         * `EmployeeController::store()`) — mensagem SEMPRE traduzida, nunca a
         * string literal devolvida pelo backend (SEVERIDADE). */
        limitReachedError: string;
        /** Falta de `roles_tenant_view` (`usePermissions().can()`) — bloqueia
         * (nunca esconde) o switch `create_user` e o select `role`,
         * TASK-EMP-FE-06/ERRO-06. */
        rolePermissionDenied: string;
        /** GAP-EMP-01/TASK-EMP-FE-07 — bloqueio PREVENTIVO (antes do submit)
         * quando `users_quota.limit_reached===true` (`GET /me/farms/current`).
         * Complementar a `limitReachedError` (422 pós-submit, rede de
         * segurança mantida), não a substitui. */
        usersQuotaReached: string;
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
        emailRequiredForUser: string;
        phoneMaxLength: string;
        addressRequired: string;
        addressMaxLength: string;
        numberRequired: string;
        numberMaxLength: string;
        districtRequired: string;
        districtMaxLength: string;
        cityRequired: string;
        officeMaxLength: string;
        functionRequired: string;
        birthdayRequired: string;
        birthdayNotFuture: string;
        baseSalaryRequired: string;
        baseSalaryMin: string;
        /** TASK-EMP-FE-04 — `role` obrigatório quando `create_user===true`. */
        roleRequired: string;
      };
    };
  };
}
