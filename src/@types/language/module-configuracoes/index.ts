// src/@types/language/module-configuracoes/index.ts
// Interface de tradução do módulo CONFIGURAÇÕES (TASK-HP-06). Contém a
// entidade `help` ("Tutoriais") e, desde TASK-APP-FE-01 (2026-08-06), a
// entidade `app` ("Aplicativos"). Espelha a convenção de
// `module-cost-centers`/`module-roles`. O conteúdo mora em
// `src/constants/languages/{idioma}/languageConfiguracoes.ts`.
//
// Mensagens de VALIDAÇÃO do formulário NÃO vivem aqui — vêm de
// `fieldValidationSchema(languageGB)` + `languageGB.defaltStrings.validations.*`
// (fonte única do projeto para mensagens Yup, ver
// `src/validations/field-validation-schema.ts`). Este módulo só guarda
// rótulos de UI (título, colunas, campos, toasts, empty state).

export interface ModuleConfiguracoes {
  help: {
    singularLabel: string;
    pluralLabel: string;
    list: {
      pageTitle: string;
      pageSubtitle: string;
      deletedToast: string;
      table: {
        url: string;
        screen: string;
        createdAt: string;
      };
      actions: {
        edit: string;
        delete: string;
      };
      emptyState: {
        title: string;
        description: string;
        titleFiltered: string;
        descriptionFiltered: string;
        cta: string;
      };
    };
    filter: {
      title: string;
      screen: string;
      screenPlaceholder: string;
    };
    form: {
      title: { create: string; edit: string };
      subtitle: { create: string; edit: string };
      fields: {
        url: string;
        screen: string;
      };
      placeholders: {
        url: string;
        screen: string;
      };
    };
    deleteDialog: {
      title: string;
    };
  };
  /** Aplicativos (App — versões de release de app móvel, TASK-APP-FE-01). */
  app: {
    singularLabel: string;
    pluralLabel: string;
    list: {
      pageTitle: string;
      pageSubtitle: string;
      deletedToast: string;
      table: {
        platform: string;
        version: string;
        releaseDate: string;
        deadline: string;
        createdAt: string;
      };
      actions: {
        edit: string;
        delete: string;
      };
      emptyState: {
        title: string;
        description: string;
        titleFiltered: string;
        descriptionFiltered: string;
        cta: string;
      };
    };
    filter: {
      title: string;
      platform: string;
      platformPlaceholder: string;
      version: string;
      versionPlaceholder: string;
    };
    form: {
      title: { create: string; edit: string };
      subtitle: { create: string; edit: string };
      fields: {
        platform: string;
        version: string;
        description: string;
        releaseDate: string;
        deadline: string;
      };
      placeholders: {
        platform: string;
        version: string;
        description: string;
      };
    };
    deleteDialog: {
      title: string;
    };
  };
  /**
   * Configuração (settings singleton de plataforma, execução 032,
   * TASK-FE-2600). Mensagens de VALIDAÇÃO do formulário NÃO vivem aqui —
   * vêm de `fieldValidationSchema(languageGB)` +
   * `languageGB.defaltStrings.validations.*` (ver
   * `config-schema.ts`), mesma convenção do resto deste módulo.
   */
  config: {
    singularLabel: string;
    pluralLabel: string;
    pageTitle: string;
    pageSubtitle: string;
    sections: {
      operational: string;
      mercadoPago: string;
      signup: string;
      support: string;
      videoIntro: string;
    };
    fields: {
      diasTeste: string;
      diasAlertaPagamento: string;
      diasAssinarContrato: string;
      contratoCertificado: string;
      minutosOnline: string;
      diasAlertaVencimentoCertificado: string;
      mercadopagoPublicKey: string;
      mercadopagoAccessToken: string;
      afiliadoPadrao: string;
      planoPadrao: string;
      whatsappLinkSuporte: string;
      respCnpj: string;
      respNome: string;
      respEmail: string;
      respFone: string;
    };
    secretPlaceholder: {
      configured: string;
      empty: string;
    };
    videoIntro: {
      uploadCta: string;
      replaceCta: string;
      successToast: string;
    };
    booleanOptions: {
      yes: string;
      no: string;
    };
    saveSuccessToast: string;
    readOnlyNotice: string;
  };
}
