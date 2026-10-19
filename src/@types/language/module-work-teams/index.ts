// src/@types/language/module-work-teams/index.ts
// -----------------------------------------------------------------------------
// Interface de tradução do módulo de EQUIPES (Team — equipe de fazenda,
// Administrativo / Gestão Pessoal). Espelha a convenção de module-functions/
// module-markers. O conteúdo mora em
// src/constants/languages/{idioma}/languageWorkTeams.ts.
//
// Namespace `workTeams` — NUNCA `teams` (GAP-EQ-FE-01): `languageGB.teams` já
// é ocupado pelo domínio SaaS/billing ("Meus Times", `module-teams`). Ver
// front-contract-equipes.md §1.3.
//
// TASK-EQ-FE-01 cobre `list` + `filter` + `deleteDialog` + `reportButton`
// (fundação + Tela 1, listagem). TASK-EQ-FE-02/03 adicionam `form` (campos do
// formulário create/edit/visualizar + repeater de integrantes).
// -----------------------------------------------------------------------------

export interface ModuleWorkTeams {
  workTeam: {
    singularLabel: string;
    pluralLabel: string;
    list: {
      pageTitle: string;
      pageSubtitle: string;
      deletedToast: string;
      table: {
        name: string;
        description: string;
        supervisor: string;
        /** `supervisor` pode vir `null` (`whenLoaded`) — traço, nunca célula vazia/undefined. */
        supervisorEmpty: string;
        status: string;
        statusActive: string;
        statusInactive: string;
        createdAt: string;
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
      error: {
        message: string;
        retry: string;
      };
    };
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
    /** Diálogo de exclusão — cópia literal herdada do design system `cerne`
     *  (front-contract-equipes.md §2.5). `descriptionTemplate` contém o
     *  placeholder `{name}`, interpolado na tela antes de ir ao componente
     *  (o `DeleteConfirmDialog` compartilhado não faz template string). */
    deleteDialog: {
      title: string;
      descriptionTemplate: string;
    };
    /** Botão de relatório PDF do header da listagem (`GAP-EQ-FE-07`) — blob +
     *  `downloadBlob`, nunca `window.open`. */
    reportButton: {
      label: string;
      successToast: string;
      exportError: {
        title: string;
        description: string;
      };
    };
    /** Formulário criar/editar/visualizar (TASK-EQ-FE-02/03) — Tela 2. */
    form: {
      title: {
        create: string;
        edit: string;
        /** Título do modo somente-leitura (`isReadOnly`, `GAP-EQ-FE-04`,
         *  TASK-EQ-FE-03) — usuário com só `teams_view`. */
        view: string;
      };
      /** Rótulo do único botão do footer em modo visualização — nenhum
       *  botão de salvar é montado (TASK-EQ-FE-03). */
      backButton: string;
      fields: {
        name: string;
        description: string;
        employeeUuid: string;
        isEnabled: string;
      };
      placeholders: {
        name: string;
        description: string;
        employeeUuid: string;
      };
      /** Mensagens de validação Yup (`team-schema.ts`). */
      validation: {
        nameMaxLength: string;
        descriptionMaxLength: string;
        /** Linha do repeater com só UM dos dois campos (Tipo/Integrante)
         *  preenchido — linha totalmente vazia é válida (filtrada no
         *  submit, `GAP-EQ-FE-03`); só a incompletude PARCIAL é erro. */
        memberRowIncomplete: string;
      };
      /** Bloco "Integrantes" — repeater com cascata Tipo → Integrante. */
      members: {
        sectionTitle: string;
        addButton: string;
        removeRowButton: string;
        /** Repeater sem nenhuma linha — `"Nenhum integrante cadastrado."`
         *  (cópia literal do design system `cerne`, §2.5). */
        emptyState: string;
        /** `"Preencha todos os campos antes de adicionar novos."` — cópia
         *  literal do legado, mantida (`GAP-EQ-FE-03`). */
        incompleteRowWarning: string;
        memberPlaceholder: string;
        memberPlaceholderNoType: string;
        /** Erro da cascata (opções do Integrante) + ação de retry — o
         *  legado falhava em silêncio (CLM-021/DIV-007), correção direta. */
        optionsError: string;
        optionsRetry: string;
        table: {
          type: string;
          member: string;
          active: string;
        };
        typeOptions: {
          employee: string;
          thirdParty: string;
        };
      };
      /** Diálogo de saída sem salvar — mesma cópia do DS (front-contract-equipes.md §2.5). */
      unsavedChanges: {
        title: string;
        message: string;
        confirm: string;
      };
      /** Banner de erro de negócio no topo do form — 422 SEM `errors`
       *  (duplicidade/coerência de tipo, contrato de tela §5.6). */
      businessErrorFallback: string;
    };
  };
}
