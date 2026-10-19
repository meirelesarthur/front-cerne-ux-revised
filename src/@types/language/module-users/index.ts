// src/@types/language/module-users/index.ts
// Interface de tradução do módulo de USUÁRIOS (User — CRUD administrativo,
// Cadastros Base / Pessoas). Espelha a convenção de module-markers/
// module-functions. O conteúdo mora em
// src/constants/languages/{idioma}/languageUsers.ts.
//
// TASK-FE-800 (Execução 027, fundação) cobre `list` + `filter` + `form` +
// `actions` (Ativar/Desativar/Redefinir Senha/Desativar conta). As telas
// (TASK-FE-805..812) consomem esta interface sem precisar estendê-la.

export interface ModuleUsers {
  user: {
    singularLabel: string;
    pluralLabel: string;
    list: {
      pageTitle: string;
      pageSubtitle: string;
      table: {
        name: string;
        email: string;
        role: string;
        /** Template "+{count}" — badge de roles adicionais além da 1ª exibida (§3.3 do contrato). */
        roleMore: string;
        status: string;
        statusActive: string;
        statusInactive: string;
        lastActivity: string;
        photo: string;
      };
      actions: {
        edit: string;
        /** F-206 (PLANO-FIDELIDADE-VISUALIZAR-EXCLUIR) — ação "Visualizar" nova,
         *  sempre disponível na linha (mesmo padrão de `CentroCusto`/`Produtos`:
         *  a própria rota de listagem já exige `users_view`, sem gate extra por
         *  item). Abre `UserViewDialog` (modal read-only), NÃO uma rota nova. */
        view: string;
      };
      emptyState: {
        titleEmpty: string;
        descriptionEmpty: string;
        titleFiltered: string;
        descriptionFiltered: string;
        cta: string;
      };
      error: {
        message: string;
        retry: string;
      };
    };
    /** 7 campos (§3.5 do contrato) — os 3 últimos (`tenant`/`plan`/`tenantStatus`)
     *  só são exibidos para `Gestor_Plataf`, gate de UI resolvido na Tarefa de tela. */
    filter: {
      title: string;
      search: string;
      searchPlaceholder: string;
      role: string;
      roleAll: string;
      isActive: string;
      isActiveAll: string;
      /** Rótulos das 2 opções do Select `is_active` (mirror `ModuleMarkers.filter.enabledOptions`). */
      activeOptions: { active: string; inactive: string };
      online: string;
      onlineAll: string;
      /** Rótulos das 2 opções do Select `online` (mirror `activeOptions` acima). */
      onlineOptions: { online: string; offline: string };
      inactiveDays: string;
      inactiveDaysAll: string;
      /** Rótulos "por extenso" dos 7 presets numéricos de `inactive_days`
       *  (1/7/15/30/90/180/365) — fonte real:
       *  `../agro365/resources/views/users/index.blade.php:59-72` (o legado
       *  nunca mostra o número puro, sempre "Mais de X"). Consumido pela
       *  fábrica `user-inactive-days-options.ts` (TASK-FE-808, correção de
       *  fidelidade do lote 3b) — os VALORES numéricos não mudam, só o label. */
      inactiveDaysOptions: {
        oneDay: string;
        oneWeek: string;
        oneFortnight: string;
        oneMonth: string;
        oneQuarter: string;
        oneSemester: string;
        oneYear: string;
      };
      tenant: string;
      tenantAll: string;
      plan: string;
      planAll: string;
      tenantStatus: string;
      tenantStatusAll: string;
      /** Rótulos dos 4 valores do enum `TenantStatus` (1-4, contrato §1.5) —
       *  fábrica `(languageGB) => Map` em `tenant-status-options.ts` (TASK-FE-801). */
      tenantStatusOptions: {
        active: string;
        defaulting: string;
        suspended: string;
        cancelled: string;
      };
    };
    form: {
      title: { create: string; edit: string };
      subtitle: { create: string; edit: string };
      sectionPerson: string;
      sectionAccount: string;
      sectionLinks: string;
      /** TASK-FE-900 — reversão E2E: bloco "Pessoa" volta a ser inline
       *  (nif/name/email/phone/city/address), CREATE e EDIT com os MESMOS
       *  campos (nunca mais um picker de Pessoa).
       *  TASK-FE-912 (2º E2E) — `number`/`district` removidos (sem
       *  equivalente no legado, que usa 1 único campo de endereço livre);
       *  `contactEmail` removido como campo distinto — a tela passou a ter 1
       *  único `email`, que alimenta login E contato no payload (D-02
       *  continua válida no modelo de dados). */
      fields: {
        nif: string;
        name: string;
        /** ÚNICO e-mail da tela (TASK-FE-912) — alimenta `users.email` (login) E `people.email` (contato). */
        email: string;
        phone: string;
        city: string;
        address: string;
        password: string;
        passwordConfirmation: string;
        isActive: string;
        /** Rótulo restaurado do legado (§18.5.3) — "Conferente de Compras?", era "Auxiliar de compras". */
        isPurchasingAssistant: string;
        photo: string;
        /** Rótulo restaurado do legado (§18.5.3) — "Perfil de Usuário", era "Perfis". */
        roleUuids: string;
        farmUuids: string;
        bossUuids: string;
      };
      placeholders: {
        email: string;
      };
      /** TASK-FE-903 — toast do prefill por NIF (mirror `nifFoundWarning`/
       *  `nifFoundWarningEditing` de `ModuleClients`). */
      nifFoundWarning: string;
      nifFoundWarningEditing: string;
      /** TASK-FE-812 — textos do bloco "Vínculos" (`CheckboxListField`, mirror
       *  `ModulePeople.form.user.*SearchPlaceholder`/`selectedCount`). */
      rolesSearchPlaceholder: string;
      farmsSearchPlaceholder: string;
      bossesSearchPlaceholder: string;
      selectedCount: string;
      /** Aviso exibido no lugar dos campos de senha na EDIÇÃO — mirror
       *  `u.editPasswordNotice` de `StepUsuario.tsx` (Pessoas). */
      editPasswordNotice: string;
      /** Aviso de que `email` (login) é somente-leitura na edição — TASK-FE-900
       *  restaura a exceção do legado: `Gestor_Plataf` PODE editar (§18.5.2). */
      emailReadonlyNotice: string;
      /** TASK-FE-904 (GAP-BE-471) — `removeLabel` religado: o backend voltou a
       *  suportar `remove_photo`, então `ImageUpload` é usado COM `onRemove`
       *  de novo (botão "Remover" volta a aparecer). */
      hints: {
        photoAccepted: string;
        photoMaxSize: string;
      };
      image: {
        dropzoneTitle: string;
        dropzoneDragging: string;
        changeLabel: string;
        removeLabel: string;
        errorType: string;
        errorSize: string;
      };
      validation: {
        nifRequired: string;
        nifInvalid: string;
        nameRequired: string;
        nameMaxLength: string;
        emailRequired: string;
        emailInvalid: string;
        emailMaxLength: string;
        cityRequired: string;
        addressRequired: string;
        addressMaxLength: string;
        passwordRequired: string;
        passwordMin: string;
        passwordConfirmationMismatch: string;
        roleUuidsMin: string;
        farmUuidsMin: string;
      };
    };
    /** Rótulos + textos de confirmação das ações de linha (§3.3 do contrato):
     *  Ativar/Desativar (`PATCH .../status`, toggle `is_active` — SEPARADO de
     *  Excluir), Redefinir Senha (`POST .../reset-password`), Excluir
     *  (`DELETE`, F-206/PLANO-FIDELIDADE-VISUALIZAR-EXCLUIR — hard-delete
     *  REAL no backend, copy de exclusão PERMANENTE, NUNCA mais
     *  "desativação"). */
    actions: {
      activate: string;
      deactivate: string;
      activateConfirmTitle: string;
      activateConfirmDescription: string;
      deactivateConfirmTitle: string;
      deactivateConfirmDescription: string;
      resetPassword: string;
      resetPasswordConfirmTitle: string;
      resetPasswordConfirmDescription: string;
      resetPasswordSuccess: string;
      activateSuccess: string;
      deactivateSuccess: string;
      /** F-206 — renomeado de `deactivateAccount*` (desativação segura, NUNCA
       *  hard-delete) para `deleteUser*` (hard-delete físico real,
       *  `UserInUseException` 422 se houver vínculo operacional — ver
       *  `resolveMutationErrorMessage`, mensagem pública já vem da API). */
      deleteUser: string;
      deleteUserConfirmTitle: string;
      deleteUserConfirmDescription: string;
      deleteUserSuccess: string;
    };
    /** F-206 — modal READ-ONLY "Visualizar" (`UserViewDialog.tsx`), reusa
     *  `GET /users/{uuid}` (`getUser`, sem mudança de API). Só campos que o
     *  contrato (`UserDetail`) realmente devolve — SEM MOCK: datas de
     *  aceite/verificação do legado NÃO entram aqui (ausentes do Resource
     *  atual, ver nota em `UserViewDialog.tsx`). */
    viewDialog: {
      title: string;
      sectionPerson: string;
      sectionAccount: string;
      sectionLinks: string;
      fields: {
        nif: string;
        name: string;
        nickname: string;
        loginEmail: string;
        contactEmail: string;
        phone: string;
        address: string;
        city: string;
        isActive: string;
        isPurchasingAssistant: string;
        lastActivity: string;
        roles: string;
        farms: string;
        bosses: string;
      };
      noValue: string;
      noRoles: string;
      noFarms: string;
      noBosses: string;
      loadError: string;
      close: string;
    };
  };
}
