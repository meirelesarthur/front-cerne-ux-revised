// src/@types/language/module-base-registrations/index.ts
// Interface de tradução do módulo agregador CADASTROS BASE (Base Registrations).
// Telas aninhadas: diagnosisPregnancy (Diagnóstico de Gestação), bodyScore
// (Escore Corporal — TASK-BS-FE-01), parameterWeight (Parâmetros / Peso —
// TASK-PW-FE-01/02).

export interface ModuleBaseRegistrations {
  titleModule: string;
  diagnosisPregnancy: {
    singularLabel: string;
    pluralLabel: string;
    list: {
      pageTitle: string;
      pageSubtitle: string;
      deletedToast: string;
      table: {
        description: string;
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
    form: {
      title: { create: string; edit: string };
      subtitle: { create: string; edit: string };
      fields: {
        description: string;
        isEnabled: string;
      };
      placeholders: {
        description: string;
      };
      validation: {
        descriptionRequired: string;
        descriptionMaxLength: string;
      };
    };
  };

  /** Escore Corporal (BodyScore, TASK-BS-FE-01) — mirror `diagnosisPregnancy`
   *  (description/is_enabled) + FK de Espécie (`specie_uuid`, opcional no
   *  server, CLIENT-required por fidelidade ao Blade — contrato §4). Rótulo
   *  de `is_enabled` = "Habilitado" (GAP-BS-FE-01, [AVALIADO] — decisão do
   *  dono, fiel ao Blade legado), representação booleana "Sim"/"Não" (Doc
   *  Bruta `00-Documentacao_Bruta/BodyScore/01-BodyScore.md ## 6`, options
   *  reais do `<select>` do legado) — NÃO "Status"/"Ativo"/"Inativo". */
  bodyScore: {
    singularLabel: string;
    pluralLabel: string;
    list: {
      pageTitle: string;
      pageSubtitle: string;
      deletedToast: string;
      table: {
        description: string;
        specie: string;
        isEnabled: string;
        yes: string;
        no: string;
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
    };
    filter: {
      title: string;
      search: string;
      searchPlaceholder: string;
      specie: string;
      specieAll: string;
    };
    form: {
      title: { create: string; edit: string };
      subtitle: { create: string; edit: string };
      fields: {
        description: string;
        isEnabled: string;
        specie: string;
      };
      placeholders: {
        description: string;
        specie: string;
      };
      validation: {
        descriptionRequired: string;
        descriptionMaxLength: string;
        specieRequired: string;
      };
    };
  };

  accountingGroupers: {
    singularLabel: string;
    pluralLabel: string;
    list: {
      pageTitle: string;
      pageSubtitle: string;
      deletedToast: string;
      table: {
        code: string;
        name: string;
        order: string;
        isEnabled: string;
        active: string;
        inactive: string;
        actions: string;
      };
      actions: {
        edit: string;
        addChild: string;
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
    };
    /** Formulário de criação/edição (TASK-ACG-02). */
    form: {
      title: { create: string; createChild: string; edit: string };
      subtitle: { create: string; edit: string };
      fields: {
        code: string;
        name: string;
        isEnabled: string;
        order: string;
        parent: string;
      };
      placeholders: {
        name: string;
      };
      /** Placeholder do combo Antecessor quando o nó é/será RAIZ (sem pai). */
      parentPlaceholder: {
        root: string;
      };
      hints: {
        codeGenerated: string;
      };
      validation: {
        nameRequired: string;
        nameMaxLength: string;
        isEnabledRequired: string;
        orderRequired: string;
        orderMin: string;
      };
    };
    /** Diálogo dedicado de exclusão bloqueada (422 `errors.in_use[]`) — ver
     *  `AccountingGrouperInUseDialog.tsx`. */
    deleteBlocked: {
      title: string;
      description: string;
      /** Template de linha por vínculo — placeholders literais `{count}` e
       *  `{resource}` substituídos via `.replace()`. */
      resourceLabel: string;
      /** Rótulos por `table` físico (canário `InUseBlockedDialog` genérico,
       *  FRONT-03-InUseBlockedDialog.md) — `resource` cru do backend é
       *  ignorado (hardcoded PT-BR), ver `accounting-grouper-in-use-table-labels.ts`. */
      tableLabels: { accounting_groupers: string; financial_categories: string };
    };
  };
  additionalInfo: {
    singularLabel: string;
    pluralLabel: string;
    list: {
      pageTitle: string;
      pageSubtitle: string;
      deletedToast: string;
      table: {
        description: string;
        info: string;
        isActive: string;
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
        titleEmptyNoCreate: string;
        descriptionEmptyNoCreate: string;
        titleFiltered: string;
        descriptionFiltered: string;
        cta: string;
      };
    };
    filter: {
      title: string;
      search: string;
      searchPlaceholder: string;
      isActive: string;
      isActiveAll: string;
      activeOptions: {
        active: string;
        inactive: string;
      };
    };
    /** Formulário de criação/edição (TASK-AI-04) — description/info/is_active. */
    form: {
      title: { create: string; edit: string };
      subtitle: { create: string; edit: string };
      fields: {
        description: string;
        info: string;
        isActive: string;
      };
      placeholders: {
        description: string;
        info: string;
      };
      validation: {
        descriptionRequired: string;
        descriptionMaxLength: string;
        infoRequired: string;
        infoMaxLength: string;
      };
    };
  };
  addressing: {
    singularLabel: string;
    pluralLabel: string;
    pageTitle: string;
    pageSubtitle: string;
    deletedToast: string;
    /** Rótulo de nível computado LOCALMENTE a partir do campo numérico
     *  `type` (1-4) — NUNCA vem do backend (`type_label` é PT-BR fixo,
     *  `AddressingType::label()`, quebraria i18n EN/ES). Ver "Achado
     *  técnico" em TASK-AD-03a. */
    levels: {
      1: string;
      2: string;
      3: string;
      4: string;
    };
    table: {
      description: string;
      level: string;
      childrenCount: string;
    };
    tree: {
      expand: string;
      collapse: string;
    };
    actions: {
      edit: string;
      /** Template `"Adicionar {level}"` — `.replace("{level}", ...)`, mesmo
       *  padrão de interpolação sem lib usado em `useRequest.tsx`. */
      addChild: string;
      delete: string;
    };
    empty: {
      message: string;
      cta: string;
    };
    error: {
      message: string;
      retry: string;
    };
    filter: {
      title: string;
      search: string;
      searchPlaceholder: string;
    };
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
        description: string;
        parentInfo: string;
      };
      parentInfo: {
        /** Exibida quando não há pai (criação de Setor-raiz). */
        noParent: string;
      };
      placeholders: {
        description: string;
      };
      validation: {
        descriptionRequired: string;
      };
    };
    deleteBlocked: {
      title: string;
      description: string;
      /** Template de linha por vínculo — placeholders literais `{count}` e
       *  `{resource}` substituídos via `.replace()` (sem lib de interpolação
       *  no projeto, mesmo padrão usado em `useRequest.tsx`). */
      resourceLabel: string;
      /** Rótulos por `table` físico (canário `InUseBlockedDialog` genérico,
       *  FRONT-03-InUseBlockedDialog.md) — `resource` cru do backend é
       *  ignorado (hardcoded PT-BR), ver `addressing-in-use-table-labels.ts`. */
      tableLabels: { addressings: string; products: string };
    };
  };
  // Rateio - Categoria Financeira (Apportionment, TASK-AP-FE-02).
  apportionment: {
    singularLabel: string;
    pluralLabel: string;
    list: {
      pageTitle: string;
      pageSubtitle: string;
      deletedToast: string;
      table: {
        financialCategory: string;
        totalHa: string;
        totalPercentage: string;
        actions: string;
      };
      actions: { edit: string; delete: string };
      emptyState: {
        titleEmpty: string;
        descriptionEmpty: string;
        titleFiltered: string;
        descriptionFiltered: string;
        cta: string;
      };
    };
    filter: {
      title: string;
      search: string;
      searchPlaceholder: string;
    };
    form: {
      title: { create: string; edit: string };
      subtitle: { create: string; edit: string };
      fields: {
        financialCategory: string;
        activity: string;
        ha: string;
        percentage: string;
        costCentersSectionTitle: string;
        costCenter: string;
        unsetedHa: string;
        costCenterHa: string;
        costCenterHaPercentage: string;
        totalHa: string;
        totalPercentage: string;
      };
      placeholders: {
        financialCategory: string;
        costCenter: string;
      };
      validation: {
        financialCategoryRequired: string;
        itemsMinLength: string;
        centerRequired: string;
        haRequired: string;
        haMin: string;
        haExceedsAvailable: string;
        haPercentageMax: string;
        haPercentageExceedsRemaining: string;
      };
      addCenterRowLabel: string;
      removeCenterRowLabel: string;
    };
  };
  bank: {
    singularLabel: string;
    pluralLabel: string;
    list: {
      pageTitle: string;
      pageSubtitle: string;
      deletedToast: string;
      table: {
        code: string;
        name: string;
      };
      actions: {
        edit: string;
        delete: string;
      };
      search: {
        placeholder: string;
      };
      emptyState: {
        titleEmpty: string;
        descriptionEmpty: string;
        titleEmptyNoCreate: string;
        descriptionEmptyNoCreate: string;
        titleFiltered: string;
        descriptionFiltered: string;
        cta: string;
      };
      /** Copy do `DeleteConfirmDialog`. */
      deleteConfirm: {
        title: string;
        message: string;
        warning: string;
      };
    };
    /** Formulário de criação/edição — 2 campos: code, name (sem Select). */
    form: {
      title: { create: string; edit: string };
      subtitle: { create: string; edit: string };
      fields: {
        code: string;
        name: string;
      };
      placeholders: {
        code: string;
        name: string;
      };
      validation: {
        codeRequired: string;
        codeMaxLength: string;
        /** 422 de `code` duplicado (Rule::unique) — TASK-BANK-FE-03, Bug #1. */
        codeDuplicate: string;
        nameRequired: string;
        nameMaxLength: string;
      };
    };
  };

  headband: {
    singularLabel: string;
    pluralLabel: string;
    type: {
      central: string;
      partnerLogo: string;
    };
    list: {
      pageTitle: string;
      pageSubtitle: string;
      deletedToast: string;
      table: {
        position: string;
        description: string;
        type: string;
        partners: string;
        partnersNone: string;
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
    };
    filter: {
      title: string;
      type: string;
      typeAll: string;
      partner: string;
      partnerPlaceholder: string;
    };
    form: {
      title: { create: string; edit: string };
      subtitle: { create: string; edit: string };
      fields: {
        description: string;
        link: string;
        position: string;
        type: string;
        image: string;
        partner: string;
        partners: string;
      };
      placeholders: {
        description: string;
        link: string;
        position: string;
      };
      hints: {
        imageAccepted: string;
        imageMaxSize: string;
      };
      image: {
        dropzoneTitle: string;
        dropzoneDragging: string;
        changeLabel: string;
        errorType: string;
        errorSize: string;
      };
      partnersChecklist: {
        searchPlaceholder: string;
        selectAllLabel: string;
        deselectAllLabel: string;
        selectedCountLabel: string;
        emptyLabel: string;
        errorLabel: string;
        retryLabel: string;
      };
      validation: {
        descriptionRequired: string;
        descriptionMaxLength: string;
        linkRequired: string;
        linkMaxLength: string;
        positionRequired: string;
        positionMin: string;
        positionMax: string;
        typeRequired: string;
      };
      businessRule: {
        limitReached: string;
        svgNotAccepted: string;
      };
    };
  };
  birthNote: {
    singularLabel: string;
    pluralLabel: string;
    list: {
      pageTitle: string;
      pageSubtitle: string;
      deletedToast: string;
      table: {
        description: string;
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
    };
    /** Drawer de filtro — SÓ `search` (nenhum Select de status: backend aceita `is_enabled` mas nenhuma tela consome). */
    filter: {
      title: string;
      search: string;
      searchPlaceholder: string;
    };
    /** Formulário de criação/edição (TASK-FE-102) — description/is_enabled, sem FK. */
    form: {
      title: { create: string; edit: string };
      subtitle: { create: string; edit: string };
      fields: {
        description: string;
        isEnabled: string;
      };
      placeholders: {
        description: string;
      };
      validation: {
        descriptionRequired: string;
        descriptionMaxLength: string;
      };
    };
  };
  categoryType: {
    singularLabel: string;
    pluralLabel: string;
    list: {
      pageTitle: string;
      pageSubtitle: string;
      deletedToast: string;
      table: {
        description: string;
        isEnabled: string;
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
        titleEmptyNoCreate: string;
        descriptionEmptyNoCreate: string;
        titleFiltered: string;
        descriptionFiltered: string;
        cta: string;
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
        description: string;
        isEnabled: string;
      };
      placeholders: {
        description: string;
      };
      validation: {
        descriptionRequired: string;
        descriptionMaxLength: string;
      };
    };
  };
  diagnosticTechnique: {
    singularLabel: string;
    pluralLabel: string;
    list: {
      pageTitle: string;
      pageSubtitle: string;
      deletedToast: string;
      table: {
        description: string;
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
    };
    /** Drawer de filtro — SÓ `search` (nenhum Select de status: backend não aceita). */
    filter: {
      title: string;
      search: string;
      searchPlaceholder: string;
    };
    /** Formulário de criação/edição (TASK-FE-019) — description/is_enabled, sem FK. */
    form: {
      title: { create: string; edit: string };
      subtitle: { create: string; edit: string };
      fields: {
        description: string;
        isEnabled: string;
      };
      placeholders: {
        description: string;
      };
      validation: {
        descriptionRequired: string;
        descriptionMaxLength: string;
      };
    };
  };
  /**
   * Administrativo — Gestão Documentos — Documentos (DocumentManagement,
   * Tarefas 12/13, `[[Documentos-Frontend-Contrato]]` §2). Módulo IRMÃO de
   * `documentTypes` (mesmo grupo de menu) — paginação REAL, reaproveita a
   * infraestrutura de anexo dinâmico já em produção por Equipment. Tarefa 12
   * cobre `list`/`filter` — `form`/`attachmentRow` são consumidos só a
   * partir da Tarefa 13.
   */
  documentManagements: {
    singularLabel: string;
    pluralLabel: string;
    list: {
      pageTitle: string;
      pageSubtitle: string;
      deletedToast: string;
      table: {
        code: string;
        description: string;
        documentType: string;
        validity: string;
        alertDays: string;
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
        titleEmptyNoCreate: string;
        descriptionEmptyNoCreate: string;
        titleFiltered: string;
        descriptionFiltered: string;
        cta: string;
      };
      error: {
        message: string;
        retry: string;
      };
      deleteConfirm: {
        title: string;
        description: string;
        confirmLabel: string;
        cancelLabel: string;
      };
    };
    filter: {
      title: string;
      documentType: string;
      documentTypeAll: string;
      startDate: string;
      endDate: string;
      dateRangeInvalid: string;
    };
    /** Formulário de criação/edição (Tarefa 13). */
    form: {
      title: { create: string; edit: string; view: string };
      subtitle: { create: string; edit: string };
      fields: {
        code: string;
        documentType: string;
        description: string;
        validity: string;
        alertDays: string;
        observation: string;
        attachmentName: string;
        attachmentFile: string;
      };
      placeholders: {
        documentType: string;
      };
      hints: {
        codeGenerated: string;
      };
      sections: {
        attachments: string;
      };
      validation: {
        documentTypeRequired: string;
        descriptionRequired: string;
        descriptionMaxLength: string;
        observationMaxLength: string;
        attachmentNameMaxLength: string;
      };
      toasts: {
        createSuccess: string;
        updateSuccess: string;
      };
    };
    /** Linha do bloco de anexos dinâmicos (Tarefa 13) — mirror EXATO de
     *  `ModuleEquipments.equipment.form.attachmentRow`. */
    attachmentRow: {
      addButton: string;
      removeButton: string;
      emptyLabel: string;
      defaultName: string;
      dropzoneTitle: string;
      dropzoneDragging: string;
      changeLabel: string;
      clearFileLabel: string;
      replaceLabel: string;
      existingFileLabel: string;
      errorType: string;
      errorSize: string;
    };
  };
  /**
   * Administrativo — Gestão Documentos — Tipo Documento (DocumentType,
   * TASK-DT-FE-01). `singularLabel` é o label EXATO do legado ("Tipo
   * Documento", não "Tipo de Documento") — mirror do item de menu. Esta
   * Tarefa cobre só `list`/`filter` — `form.*` é adicionado em TASK-DT-FE-02.
   */
  documentTypes: {
    singularLabel: string;
    pluralLabel: string;
    list: {
      pageTitle: string;
      pageSubtitle: string;
      deletedToast: string;
      table: {
        code: string;
        name: string;
        order: string;
        isEnabled: string;
        active: string;
        inactive: string;
        actions: string;
      };
      actions: {
        edit: string;
        addChild: string;
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
    };
    /** Formulário de criação/edição (TASK-DT-FE-02). */
    form: {
      title: { create: string; createChild: string; edit: string };
      subtitle: { create: string; edit: string };
      fields: {
        code: string;
        name: string;
        isEnabled: string;
        order: string;
        parent: string;
      };
      placeholders: {
        name: string;
      };
      /** Placeholder do combo Antecessor quando o nó é/será RAIZ (sem pai). */
      parentPlaceholder: {
        root: string;
      };
      hints: {
        codeGenerated: string;
      };
      validation: {
        nameRequired: string;
        nameMaxLength: string;
        isEnabledRequired: string;
        orderRequired: string;
      };
    };
  };
  familyEquipment: {
    singularLabel: string;
    pluralLabel: string;
    list: {
      pageTitle: string;
      pageSubtitle: string;
      deletedToast: string;
      table: {
        image: string;
        description: string;
        typeDepreciation: string;
        lifeBens: string;
        active: string;
        activeLabel: string;
        inactiveLabel: string;
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
    };
    filter: {
      title: string;
      search: string;
      searchPlaceholder: string;
      typeDepreciation: string;
      typeDepreciationAll: string;
      typeDepreciationOptions: {
        semResidual: string;
        comResidual: string;
      };
      isEnabled: string;
      isEnabledAll: string;
      enabledOptions: {
        active: string;
        inactive: string;
      };
    };
    /** Formulário de criação/edição (TASK-FE-FE-02). */
    form: {
      title: { create: string; edit: string };
      subtitle: { create: string; edit: string };
      fields: {
        description: string;
        typeDepreciation: string;
        depreciation: string;
        residual: string;
        lifeBens: string;
        vlTimeProductive: string;
        vlTimeUnproductive: string;
        isEnabled: string;
        image: string;
      };
      placeholders: {
        description: string;
      };
      hints: {
        residualConditional: string;
        imageAccepted: string;
        imageMaxSize: string;
      };
      typeDepreciationOptions: {
        semResidual: string;
        comResidual: string;
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
        descriptionRequired: string;
        descriptionMaxLength: string;
        typeDepreciationRequired: string;
        depreciationRange: string;
        residualRequired: string;
        residualRange: string;
        lifeBensPositive: string;
        vlTimeMin: string;
      };
    };
  };
  /** Cadastro tenant-scoped "Forragem" (Fodder), Pecuária/Grazing —
   *  TASK-FD-FE-01 (fundação + listagem + exclusão bloqueada). Molde:
   *  `identificationType` (shape de 2 campos, sem filtro) + `deleteBlocked`
   *  mirror `parameterWeight` (422 estruturado `errors.in_use.grazings`). */
  fodder: {
    singularLabel: string;
    pluralLabel: string;
    list: {
      pageTitle: string;
      pageSubtitle: string;
      deletedToast: string;
      table: {
        description: string;
        status: string;
        active: string;
        inactive: string;
      };
      actions: {
        edit: string;
        delete: string;
      };
      /** Sem variantes "filtrado" — esta tela não tem filtro de busca (DA-FD-11). */
      emptyState: {
        titleEmpty: string;
        descriptionEmpty: string;
        cta: string;
      };
    };
    /** Diálogo dedicado de exclusão bloqueada (422 `errors.in_use.grazings`) —
     *  ver `FodderInUseDialog.tsx`. SEM CTA de navegação (`Grazing` não migrado). */
    deleteBlocked: {
      title: string;
      description: string;
      /** Template de linha por vínculo — placeholders literais `{count}` e
       *  `{resource}` substituídos via `.replace()`. */
      resourceLabel: string;
      tableLabels: { grazings: string };
    };
    /** Formulário de criação/edição (TASK-FD-FE-02) — description/is_enabled, sem FK. */
    form: {
      title: { create: string; edit: string };
      subtitle: { create: string; edit: string };
      fields: {
        description: string;
        isEnabled: string;
      };
      placeholders: {
        description: string;
      };
      validation: {
        descriptionRequired: string;
        descriptionMaxLength: string;
      };
    };
  };
  /** Módulo Pastejo (Grazing), Pecuária/núcleo transacional — TASK-GZ-FE-01
   *  (fundação + listagem + exclusão bloqueada até 13 tabelas). Molde:
   *  `fodder` (listagem sem filtro) + `deleteBlocked` generalizado para até
   *  13 chaves simultâneas (`Grazing-FrontEnd-contrato.md ## 7.2`). O bloco
   *  `form.*` completo (todos os 7 campos) é adicionado por
   *  `TASK-GZ-FE-02`/`03` — aqui só o necessário para o schema Yup
   *  (fundação compartilhada) e a listagem+diálogo compilarem. */
  grazing: {
    singularLabel: string;
    pluralLabel: string;
    list: {
      pageTitle: string;
      pageSubtitle: string;
      deletedToast: string;
      table: {
        code: string;
        description: string;
        fodder: string;
        date: string;
        color: string;
        controlProductivity: string;
        areasCount: string;
        areasSum: string;
      };
      actions: {
        edit: string;
        delete: string;
      };
      /** Sem variantes "filtrado" — esta tela não tem filtro de busca
       *  (legado não tem busca, Doc Bruta §7 item 1). */
      emptyState: {
        titleEmpty: string;
        descriptionEmpty: string;
        cta: string;
      };
    };
    /** Fábrica Sim/Não do campo de negócio `control_productivity` — Badge da
     *  coluna nesta Tarefa, `Select` do formulário em `TASK-GZ-FE-02`. */
    controlProductivityOptions: {
      yes: string;
      no: string;
    };
    /** Fábrica da paleta FECHADA de 14 cores (`grazing-color-options.ts`),
     *  TASK-GZ-FE-02 — mirror EXATO de `App\Enums\AreaColor` (backend),
     *  rótulos traduzidos de `AreaColor::label()` (PT-BR) para os 3 idiomas.
     *  Correção de rota frente ao contrato de tela original (`<input
     *  type="color">` nativo previsto quando a lista ainda dependia de
     *  `TASK-AR-02`) — ver cabeçalho de `grazing-color-options.ts`. */
    colorOptions: {
      white: string;
      blue: string;
      black: string;
      green: string;
      yellow: string;
      red: string;
      gray: string;
      lightGray: string;
      lightBlue: string;
      darkBlue: string;
      turquoise: string;
      darkGreen: string;
      lightGreen: string;
      orange: string;
    };
    /** Mensagens de validação do schema Yup (`grazings-schema.ts`) —
     *  fundação compartilhada criada por `TASK-GZ-FE-01`, bloco `form.*`
     *  completo (title/subtitle/fields/placeholders/hints) adicionado por
     *  `TASK-GZ-FE-02` (formulário — campos base). */
    form: {
      title: { create: string; edit: string };
      subtitle: { create: string; edit: string };
      fields: {
        description: string;
        fodder: string;
        date: string;
        code: string;
        color: string;
        controlProductivity: string;
        responsible: string;
        areas: string;
      };
      placeholders: {
        description: string;
        fodder: string;
      };
      hints: {
        codeGenerated: string;
        areasPlaceholder: string;
      };
      validation: {
        descriptionRequired: string;
        descriptionMaxLength: string;
        fodderRequired: string;
        dateRequired: string;
        colorFormat: string;
        colorRequired: string;
        areasMin: string;
        areasRequired: string;
      };
      invalidFieldsToast: string;
    };
    /** Mapa de seleção de piquetes (`GrazingMap.tsx`, TASK-GZ-FE-03) —
     *  estados de UI (loading/erro/vazio/sem fazenda ativa), contadores
     *  (selecionados/soma de hectares em preview) e o toast de conflito de
     *  exclusividade Área↔Pastejo (`GET /areas/valid-insert`,
     *  `Grazing-FrontEnd-contrato.md ## 6`/`## 7.1`). `{count}`/`{value}`/
     *  `{code}`/`{description}` são placeholders literais substituídos via
     *  `.replace()` (mesmo padrão de `deleteBlocked.resourceLabel`). */
    map: {
      loading: string;
      noActiveFarm: string;
      errorState: {
        title: string;
        description: string;
        retry: string;
      };
      emptyState: {
        title: string;
        description: string;
      };
      selectedCountLabel: string;
      areaSumPreviewLabel: string;
      conflictToast: {
        title: string;
        description: string;
      };
      validateErrorToast: string;
    };
  };
  // IBPT (Tabela Fiscal de Incidência Tributária, execução 032, TASK-FE-2410/
  // 2414) — catálogo GLOBAL, 3 telas: Listagem (sem filtro, sem Editar — não
  // há endpoint de update), Import (upload multipart, página dedicada) e
  // Visualização (cabeçalho + grade paginada de itens, Modelo B sem Tabs).
  ibpt: {
    singularLabel: string;
    pluralLabel: string;
    list: {
      pageTitle: string;
      pageSubtitle: string;
      deletedToast: string;
      table: { uf: string; versao: string; itemsCount: string };
      actions: { view: string; delete: string };
      emptyState: { titleEmpty: string; descriptionEmpty: string; cta: string };
    };
    import: {
      title: { create: string };
      subtitle: { create: string };
      fields: { uf: string; versao: string; file: string };
      fileUpload: {
        label: string;
        hint: string;
        dropzoneTitle: string;
        dropzoneDraggingTitle: string;
        changeLabel: string;
        removeLabel: string;
        errorTypeMessage: string;
        errorSizeMessage: string;
      };
      warning: { title: string; description: string };
      rowErrors: { title: string };
      validation: {
        ufRequired: string;
        versaoRequired: string;
        versaoMaxLength: string;
        fileRequired: string;
      };
      cancelButton: string;
      submitButton: string;
      importSuccessToast: string;
    };
    detail: {
      pageTitle: string;
      itemsLabel: string;
      fields: { uf: string; versao: string; itemsCount: string };
      table: {
        codigo: string;
        nacionalFederal: string;
        importadoFederal: string;
        estadual: string;
        municipal: string;
      };
      notFound: { title: string; description: string; back: string };
    };
  };
  identificationType: {
    singularLabel: string;
    pluralLabel: string;
    list: {
      pageTitle: string;
      pageSubtitle: string;
      deletedToast: string;
      table: {
        description: string;
        status: string;
        active: string;
        inactive: string;
      };
      actions: {
        edit: string;
        delete: string;
      };
      /** Sem variantes "filtrado" — esta tela não tem filtro de busca. */
      emptyState: {
        titleEmpty: string;
        descriptionEmpty: string;
        cta: string;
      };
    };
    /** Formulário de criação/edição (TASK-FE-039) — description/is_enabled, sem FK. */
    form: {
      title: { create: string; edit: string };
      subtitle: { create: string; edit: string };
      fields: {
        description: string;
        isEnabled: string;
      };
      placeholders: {
        description: string;
      };
      validation: {
        descriptionRequired: string;
        descriptionMaxLength: string;
      };
    };
  };
  indexer: {
    singularLabel: string;
    pluralLabel: string;
    list: {
      pageTitle: string;
      pageSubtitle: string;
      deletedToast: string;
      table: {
        description: string;
        descriptive: string;
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
    };
    /** Drawer de filtro — SÓ `search` (o backend filtra `description` OU `descriptive`, D9, mas a UI mantém 1 único campo). */
    filter: {
      title: string;
      search: string;
      searchPlaceholder: string;
    };
    /** Formulário de criação/edição — description/descriptive/is_enabled, sem FK. */
    form: {
      title: { create: string; edit: string };
      subtitle: { create: string; edit: string };
      fields: {
        description: string;
        descriptive: string;
        isEnabled: string;
      };
      placeholders: {
        description: string;
        descriptive: string;
      };
      validation: {
        descriptionRequired: string;
        descriptionMaxLength: string;
        descriptiveRequired: string;
        descriptiveMaxLength: string;
      };
    };
  };
  issueDfeSyncTime: {
    singularLabel: string;
    pluralLabel: string;
    list: {
      pageTitle: string;
      pageSubtitle: string;
      deletedToast: string;
      table: {
        issuer: string;
        syncHour: string;
      };
      actions: {
        edit: string;
        delete: string;
      };
      emptyState: {
        titleEmpty: string;
        descriptionEmpty: string;
        /** Variação sem CTA para quem não pode criar (não tem `issue-dfe-sync-time_create`). */
        titleEmptyNoCreate: string;
        descriptionEmptyNoCreate: string;
        cta: string;
      };
      error: {
        message: string;
        retry: string;
      };
    };
    /** Formulário de criação/edição (TASK-DFE-FE-02) — issue_uuid (Select de
     *  Emissor elegível) + sync_hour (Select estático, 13 valores). */
    form: {
      title: { create: string; edit: string };
      subtitle: { create: string; edit: string };
      fields: {
        issue: string;
        syncHour: string;
      };
      placeholders: {
        issue: string;
      };
      validation: {
        issueRequired: string;
        syncHourRequired: string;
      };
    };
  };
  lowReason: {
    singularLabel: string;
    pluralLabel: string;
    list: {
      pageTitle: string;
      pageSubtitle: string;
      deletedToast: string;
      table: {
        code: string;
        description: string;
        doMovement: string;
        isEnabled: string;
        doMovementYes: string;
        doMovementNo: string;
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
        titleEmptyNoCreate: string;
        descriptionEmptyNoCreate: string;
        titleFiltered: string;
        descriptionFiltered: string;
        cta: string;
      };
    };
    filter: {
      title: string;
      search: string;
      searchPlaceholder: string;
      isEnabled: string;
      isEnabledAll: string;
      doMovement: string;
      doMovementAll: string;
      enabledOptions: {
        active: string;
        inactive: string;
      };
      movementOptions: {
        yes: string;
        no: string;
      };
    };
    /** Formulário de criação/edição (TASK-LR-FE-02) — description/do_movement/is_enabled + `code` só leitura. */
    form: {
      title: { create: string; edit: string };
      subtitle: { create: string; edit: string };
      fields: {
        code: string;
        description: string;
        doMovement: string;
        isEnabled: string;
      };
      placeholders: {
        description: string;
      };
      hints: {
        codeGenerated: string;
      };
      validation: {
        descriptionRequired: string;
        descriptionMaxLength: string;
      };
    };
    /** Tela de VISUALIZAÇÃO (somente leitura) — lote 01/EST-085 passada 2, mirror `trough.detail`. */
    detail: {
      sections: {
        generalData: string;
      };
      fields: {
        code: string;
        description: string;
        doMovement: string;
        isEnabled: string;
      };
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
  measurement: {
    singularLabel: string;
    pluralLabel: string;
    list: {
      pageTitle: string;
      pageSubtitle: string;
      deletedToast: string;
      table: {
        name: string;
        description: string;
      };
      actions: { edit: string; delete: string };
      emptyState: {
        titleEmpty: string;
        descriptionEmpty: string;
        titleEmptyNoCreate: string;
        descriptionEmptyNoCreate: string;
        /** Variante "sem resultado" quando a busca textual não encontra nada. */
        titleFiltered: string;
        descriptionFiltered: string;
        cta: string;
      };
      /** Copy do `DeleteConfirmDialog`. */
      deleteConfirm: { title: string; description: string; warning: string };
    };
    /** Drawer de busca (acréscimo — só `search`, ver comentário do módulo). */
    filter: {
      title: string;
      search: string;
      searchPlaceholder: string;
    };
    form: {
      title: { create: string; edit: string };
      subtitle: { create: string; edit: string };
      fields: { name: string; description: string };
      placeholders: { name: string; description: string };
      validation: {
        nameRequired: string;
        nameMaxLength: string;
        descriptionRequired: string;
        descriptionMaxLength: string;
      };
    };
  };
  /** NFSe Recebidas (Nfse, domínio Fiscal, execução 033, TASK-FE-2730) —
   *  domínio NÃO é CRUD (sem `form`) — só leitura + ações de download/
   *  lançamento (`list.actions`) + tela dedicada "Buscar DFe" (`syncScreen`)
   *  + rascunho de despesa (`expenseDraft`, navega a Contas a Pagar). */
  nfse: {
    singularLabel: string;
    pluralLabel: string;
    list: {
      pageTitle: string;
      pageSubtitle: string;
      table: {
        prestador: string;
        cpfCnpj: string;
        numero: string;
        valor: string;
        dtEmissao: string;
        competencia: string;
        lancada: string;
        ibs: string;
        cbs: string;
      };
      badges: { launched: string; notLaunched: string };
      actions: { launchExpense: string; generateDanfe: string; downloadXml: string };
      emptyState: {
        /** Sem `issuer_uuid` no filtro aplicado (RN-1) — distinto de "sem resultados". */
        titleNoIssuer: string;
        descriptionNoIssuer: string;
        titleEmpty: string;
        descriptionEmpty: string;
        titleFiltered: string;
        descriptionFiltered: string;
      };
      error: { message: string; retry: string };
      downloadXmlError: string;
      downloadXmlSuccess: string;
      generateDanfeError: string;
    };
    filter: {
      title: string;
      issuer: string;
      issuerPlaceholder: string;
      issuerRequired: string;
      search: string;
      searchPlaceholder: string;
      dateFrom: string;
      dateTo: string;
      dateRangeInvalid: string;
      launched: string;
      launchedAll: string;
      launchedOptions: { yes: string; no: string };
    };
    /** Tela "Buscar DFe" (`POST /nfses`, síncrono — GAP-BE-519, TASK-FE-2734). */
    syncScreen: {
      pageTitle: string;
      pageSubtitle: string;
      issuer: string;
      issuerPlaceholder: string;
      issuerRequired: string;
      submitButton: string;
      loadingMessage: string;
      successToast: string;
      errorToast: string;
      certificateMissingError: string;
      certificateMissingLink: string;
      emptyIssuerState: string;
      successNone: string;
      environmentHomologation: string;
      retryButton: string;
      issuerLink: string;
      timeoutError: string;
    };
    /** "Lançar NFe Despesa" (`POST /nfses/{uuid}/expense-draft`, UT-000754):
     *  navega direto para Contas a Pagar `novo` com `state.nfseDraft`. */
    expenseDraft: {
      successMessage: string;
      noPermissionReason: string;
    };
  };
  parameterWeight: {
    singularLabel: string;
    pluralLabel: string;
    list: {
      pageTitle: string;
      pageSubtitle: string;
      deletedToast: string;
      table: {
        code: string;
        description: string;
        date: string;
        info: string;
      };
      actions: { edit: string; delete: string };
      emptyState: {
        titleEmpty: string;
        descriptionEmpty: string;
        titleFiltered: string;
        descriptionFiltered: string;
        cta: string;
      };
    };
    filter: {
      title: string;
      search: string;
      searchPlaceholder: string;
      dateFrom: string;
      dateTo: string;
      dateRangeInvalid: string;
    };
    deleteBlocked: {
      title: string;
      description: string;
      resourceLabel: string;
      tableLabels: { batches: string };
    };
    form: {
      title: { create: string; edit: string };
      subtitle: { create: string; edit: string };
      fields: {
        description: string;
        date: string;
        initialWeight: string;
        finalWeight: string;
        code: string;
        employee: string;
        // TASK-PW-FE-05/DA-PW-17: "Responsável" fiel ao `_forms.blade.php`
        // (quem cadastrou, sempre presente) — chave separada de `employee`
        // (responsável histórico, condicional) para não colidir semântica.
        responsible: string;
      };
      placeholders: { description: string };
      hints: {
        codeAutoGenerated: string;
        employeeHistoric: string; // template "Responsável (histórico): {name}"
      };
      validation: {
        dateInvalid: string;
        dateRequired: string;
        dateOutOfRange: string;
        weightInvalid: string;
        weightRequired: string;
        weightMin: string;
        finalWeightMustBeGreater: string;
        descriptionRequired: string;
        descriptionMaxLength: string;
      };
    };
  };
  paymentTerm: {
    singularLabel: string;
    pluralLabel: string;
    list: {
      pageTitle: string;
      pageSubtitle: string;
      deletedToast: string;
      table: {
        description: string;
        condition: string;
        type: string;
        status: string;
        active: string;
        inactive: string;
      };
      actions: { edit: string; delete: string };
      emptyState: {
        titleEmpty: string;
        descriptionEmpty: string;
        titleFiltered: string;
        descriptionFiltered: string;
        cta: string;
      };
    };
    filter: {
      title: string;
      search: string;
      searchPlaceholder: string;
      isEnabled: string;
      isEnabledAll: string;
      enabledOptions: { active: string; inactive: string };
      type: string;
      typeAll: string;
      typeOptions: { purchase: string; sale: string; both: string };
    };
    form: {
      title: { create: string; edit: string };
      subtitle: { create: string; edit: string };
      fields: {
        description: string;
        condition: string;
        type: string;
        isEnabled: string;
        outDay: string;
      };
      placeholders: { description: string; condition: string };
      typeOptions: { purchase: string; sale: string; both: string };
      outDayOptions: { yes: string; no: string };
      validation: {
        descriptionRequired: string;
        descriptionMaxLength: string;
        conditionRequired: string;
        conditionMaxLength: string;
        conditionInvalid: string;
        typeRequired: string;
      };
    };
  };
  // Cadastros Base — Configurações — Permissões (Permission, execução 032,
  // TASK-FE-2400/2404).
  permission: {
    singularLabel: string;
    pluralLabel: string;
    list: {
      pageTitle: string;
      pageSubtitle: string;
      deletedToast: string;
      table: { name: string; description: string };
      actions: { view: string; edit: string; delete: string };
      emptyState: {
        titleEmpty: string;
        descriptionEmpty: string;
        titleFiltered: string;
        descriptionFiltered: string;
        cta: string;
      };
      search: { placeholder: string };
    };
    form: {
      title: { create: string; edit: string };
      subtitle: { create: string; edit: string };
      fields: { name: string; description: string };
      validation: {
        nameRequired: string;
        nameMaxLength: string;
        descriptionRequired: string;
        descriptionMaxLength: string;
      };
    };
    detail: {
      pageTitle: string;
      fields: {
        name: string;
        description: string;
        createdAt: string;
        updatedAt: string;
      };
      actions: { edit: string };
      notFound: { title: string; description: string; back: string };
    };
  };
  // Termos e Condições (PlatformDocument, execução 032,
  // TASK-FE-2500/2501/2502) — tela ÚNICA, 2 cards independentes (Termos de
  // Uso / Políticas de Privacidade).
  platformDocuments: {
    singularLabel: string;
    page: {
      title: string;
      subtitle: string;
    };
    cards: {
      termsOfUse: {
        title: string;
        uploadHint: string;
        uploadedAt: string;
        uploadedAtWithAuthor: string;
        emptyState: string;
      };
      privacyPolicy: {
        title: string;
        uploadHint: string;
        uploadedAt: string;
        uploadedAtWithAuthor: string;
        emptyState: string;
      };
    };
    errors: {
      loadFailed: { title: string; description: string };
    };
  };
  reversalExpense: {
    singularLabel: string;
    pluralLabel: string;
    list: {
      pageTitle: string;
      pageSubtitle: string;
      deletedToast: string;
      table: {
        description: string;
        useKg: string;
        isEnabled: string;
        value: string;
        active: string;
        inactive: string;
        yes: string;
        no: string;
      };
      actions: { edit: string; delete: string };
      emptyState: {
        titleEmpty: string;
        descriptionEmpty: string;
        titleFiltered: string;
        descriptionFiltered: string;
        cta: string;
      };
    };
    filter: {
      title: string;
      search: string;
      searchPlaceholder: string;
      isEnabled: string;
      isEnabledAll: string;
      enabledOptions: { active: string; inactive: string };
    };
    form: {
      title: { create: string; edit: string };
      subtitle: { create: string; edit: string };
      fields: { description: string; isEnabled: string; value: string; useKg: string };
      placeholders: { description: string };
      useKgOptions: { yes: string; no: string };
      validation: {
        descriptionRequired: string;
        descriptionMaxLength: string;
        valueRequired: string;
        valueInvalid: string;
        valueMin: string;
      };
    };
  };
  serviceExpense: {
    singularLabel: string;
    pluralLabel: string;
    list: {
      pageTitle: string;
      pageSubtitle: string;
      deletedToast: string;
      table: {
        description: string;
        useKg: string;
        isEnabled: string;
        payTeam: string;
        hasCommission: string;
        value: string;
        active: string;
        inactive: string;
        yes: string;
        no: string;
      };
      actions: { edit: string; delete: string };
      emptyState: {
        titleEmpty: string;
        descriptionEmpty: string;
        titleFiltered: string;
        descriptionFiltered: string;
        cta: string;
      };
    };
    filter: {
      title: string;
      search: string;
      searchPlaceholder: string;
      isEnabled: string;
      isEnabledAll: string;
      enabledOptions: { active: string; inactive: string };
    };
    form: {
      title: { create: string; edit: string };
      subtitle: { create: string; edit: string };
      fields: {
        description: string;
        isEnabled: string;
        value: string;
        useKg: string;
        payTeam: string;
        hasCommission: string;
        commission: string;
      };
      placeholders: { description: string };
      useKgOptions: { yes: string; no: string };
      payTeamOptions: { yes: string; no: string };
      hasCommissionOptions: { yes: string; no: string };
      validation: {
        descriptionRequired: string;
        descriptionMaxLength: string;
        valueRequired: string;
        valueInvalid: string;
        valueMin: string;
        commissionRequired: string;
        commissionInvalid: string;
        commissionMin: string;
      };
    };
  };
  // Atualizações do Sistema (SystemUpdate, execução 031, TASK-FE-1100/1104) —
  // comunicados/changelog administrativo GLOBAL. 4 telas: Listagem, Criação/
  // Edição (`RichTextEditor`, §7.1) e Visualização (HTML sanitizado, §7.2).
  systemUpdate: {
    singularLabel: string;
    pluralLabel: string;
    list: {
      pageTitle: string;
      pageSubtitle: string;
      deletedToast: string;
      table: {
        releaseDate: string;
        description: string;
      };
      actions: {
        view: string;
        edit: string;
        delete: string;
      };
      emptyState: {
        titleEmpty: string;
        descriptionEmpty: string;
        cta: string;
      };
    };
    form: {
      title: { create: string; edit: string };
      subtitle: { create: string; edit: string };
      fields: {
        releaseDate: string;
        description: string;
      };
      placeholders: {
        description: string;
      };
      validation: {
        descriptionRequired: string;
      };
    };
    detail: {
      pageTitle: string;
      fields: {
        releaseDate: string;
        description: string;
      };
      actions: {
        edit: string;
      };
      notFound: {
        title: string;
        description: string;
        back: string;
      };
    };
    /** Popup do dashboard (GAP-BE-511, Opção A) — `SystemUpdatePendingModal`. */
    pendingModal: {
      title: string;
      dismiss: string;
    };
  };
  /** Contratantes (Tenant, TASK-TN-FE-01/02) — CRUD completo (29 campos,
   *  fidelidade ao blade legado `tenants/_forms.blade.php`). Bloco DISTINTO
   *  de `tenantParameters` abaixo (settings singleton do tenant CORRENTE,
   *  sem relação — confirmado por busca direta, não serve de precedente
   *  estrutural). */
  tenant: {
    singularLabel: string;
    pluralLabel: string;
    list: {
      pageTitle: string;
      pageSubtitle: string;
      deletedToast: string;
      table: {
        nickname: string;
        nif: string;
        status: string;
        dueDate: string;
        dueDateIndeterminate: string;
      };
      actions: {
        edit: string;
        view: string;
        delete: string;
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
        warning: string;
      };
    };
    filter: {
      title: string;
      search: string;
      searchPlaceholder: string;
      /** Limite do `search` (API `max:60`, TASK-072-FE-07). */
      searchMaxLength: string;
      status: string;
      statusAll: string;
      /** TASK-072-FE-07 (I10) — filtros do legado `tenants/index.blade.php`. */
      signature: string;
      signatureAll: string;
      dueMonth: string;
      dueMonthAll: string;
      dueDay: string;
      dueDayAll: string;
      dtAccession: string;
      startDate: string;
      endDate: string;
      role: string;
      roleAll: string;
      plan: string;
      planAll: string;
      months: {
        january: string;
        february: string;
        march: string;
        april: string;
        may: string;
        june: string;
        july: string;
        august: string;
        september: string;
        october: string;
        november: string;
        december: string;
      };
    };
    status: {
      active: string;
      defaulting: string;
      suspended: string;
      cancelled: string;
    };
    signature: {
      trial: string;
      monthly: string;
      quarterly: string;
      semiannual: string;
      annual: string;
      biannual: string;
      undetermined: string;
    };
    dueDay: {
      dayPrefix: string;
    };
    form: {
      title: { create: string; edit: string; view: string };
      subtitle: { create: string; edit: string };
      fields: {
        countryId: string;
        nif: string;
        nickname: string;
        name: string;
        email: string;
        phone: string;
        cellphone: string;
        roleId: string;
        planUuid: string;
        listAllFarms: string;
        qtdFarms: string;
        qtdUsers: string;
        exportXls: string;
        zipCode: string;
        address: string;
        city: string;
        contact: string;
        contactPhone: string;
        status: string;
        usesCashBook: string;
        useFiscal: string;
        signature: string;
        dtAccession: string;
        dueDate: string;
        dueDay: string;
        value: string;
        generateFinancial: string;
        generateTicket: string;
        cancellationReason: string;
        centers: string;
        qtdIssuers: string;
        qtdNfe: string;
        qtdCte: string;
        qtdMdfe: string;
      };
      placeholders: {
        countryId: string;
        roleId: string;
        planUuid: string;
        city: string;
        status: string;
        signature: string;
        dueDay: string;
        centersSearch: string;
        zipCode: string;
      };
      booleanOptions: {
        yes: string;
        no: string;
      };
      centersField: {
        selectAll: string;
        deselectAll: string;
        selectedCount: string;
        empty: string;
      };
      cepAutofill: {
        invalidFormat: { title: string; description: string };
        notFound: { title: string; description: string };
        cityNotResolved: { title: string; description: string };
        networkError: { title: string; description: string };
      };
      nifAutofill: {
        alreadyTenant: { title: string; description: string };
        cnpjNotFound: { title: string; description: string };
        cnpjUnavailable: { title: string; description: string };
        rateLimited: { title: string; description: string };
        networkError: { title: string; description: string };
      };
      validation: {
        countryIdRequired: string;
        nifRequired: string;
        nifInvalid: string;
        nicknameRequired: string;
        nicknameMaxLength: string;
        nameRequired: string;
        nameMaxLength: string;
        emailRequired: string;
        emailInvalid: string;
        emailMaxLength: string;
        zipCodeMaxLength: string;
        cellphoneMaxLength: string;
        contactPhoneMaxLength: string;
        phoneRequired: string;
        phoneMaxLength: string;
        roleIdRequired: string;
        planRequired: string;
        qtdFarmsRequired: string;
        qtdFarmsInvalid: string;
        qtdFarmsMin: string;
        qtdUsersRequired: string;
        qtdUsersInvalid: string;
        qtdUsersMin: string;
        exportXlsRequired: string;
        addressRequired: string;
        addressMaxLength: string;
        cityRequired: string;
        contactMaxLength: string;
        statusRequired: string;
        useFiscalRequired: string;
        signatureRequired: string;
        dtAccessionRequired: string;
        dueDateRequired: string;
        dueDayRequired: string;
        valueRequired: string;
        valueInvalid: string;
        valueMin: string;
        generateFinancialRequired: string;
        generateTicketRequired: string;
        cancellationReasonRequired: string;
        centersRequired: string;
        qtdIssuersRequired: string;
        qtdIssuersInvalid: string;
        qtdIssuersMin: string;
        qtdNfeRequired: string;
        qtdNfeInvalid: string;
        qtdNfeMin: string;
        qtdCteRequired: string;
        qtdCteInvalid: string;
        qtdCteMin: string;
        qtdMdfeRequired: string;
        qtdMdfeInvalid: string;
        qtdMdfeMin: string;
      };
    };
  };
  tenantParameters: {
    singularLabel: string;
    pluralLabel: string;
    form: {
      title: string;
      subtitle: string;
      sections: { fiscais: string };
      fields: { calcIcmsDesonerado: string };
      booleanOptions: { yes: string; no: string };
      validation: { calcIcmsDesoneradoRequired: string };
      noFarmSelected: { title: string; description: string };
      savedToast: string;
    };
  };
  typeTitle: {
    singularLabel: string;
    pluralLabel: string;
    list: {
      pageTitle: string;
      pageSubtitle: string;
      deletedToast: string;
      table: {
        description: string;
        type: string;
        factor: string;
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
      type: string;
      typeAll: string;
      typeOptions: {
        payable: string;
        receivable: string;
        both: string;
      };
    };
    /** Formulário de criação/edição (TASK-TT-02) — description/type/factor/is_enabled. */
    form: {
      title: { create: string; edit: string };
      subtitle: { create: string; edit: string };
      fields: {
        description: string;
        type: string;
        factor: string;
        isEnabled: string;
      };
      placeholders: {
        description: string;
      };
      typeOptions: {
        payable: string;
        receivable: string;
        both: string;
      };
      factorOptions: {
        add: string;
        subtract: string;
      };
      validation: {
        descriptionRequired: string;
        descriptionMaxLength: string;
        typeRequired: string;
        factorRequired: string;
      };
    };
  };
  /** Cadastros Base — Pecuários — Lote/Módulo (BatchGrazing, execução 029,
   *  TASK-FE-2000) — vínculo N:N Lote×Módulo Pastejo, SEM edição (API sem
   *  PUT/PATCH). Exclusão NÃO-DESTRUTIVA (D3/D12 do contrato de API). */
  batchGrazing: {
    singularLabel: string;
    pluralLabel: string;
    list: {
      pageTitle: string;
      pageSubtitle: string;
      deletedToast: string;
      table: {
        code: string;
        grazing: string;
        batches: string;
        date: string;
        employee: string;
        animalQuantity: string;
        uaQuantity: string;
        stockingRate: string;
      };
      actions: {
        view: string;
        delete: string;
      };
      emptyState: {
        titleEmpty: string;
        descriptionEmpty: string;
        cta: string;
      };
    };
    deleteDialog: {
      title: string;
      description: string;
      warningText: string;
      confirm: string;
    };
    removeBatchDialog: {
      title: string;
      description: string;
      warningText: string;
      confirm: string;
    };
    form: {
      title: { create: string };
      subtitle: { create: string };
      fields: {
        code: string;
        date: string;
        employee: string;
        grazing: string;
        batches: string;
        hectares: string;
        animalQuantity: string;
        uaQuantity: string;
        stockingRate: string;
      };
      placeholders: {
        code: string;
        grazing: string;
        batches: string;
      };
      hints: {
        codeGenerated: string;
        metricsPending: string;
      };
      validation: {
        dateRequired: string;
        grazingRequired: string;
        batchesRequired: string;
        batchesMin: string;
      };
    };
    detail: {
      sections: {
        generalData: string;
        metrics: string;
        batchesLinked: string;
      };
      fields: {
        code: string;
        grazing: string;
        date: string;
        employee: string;
        hectares: string;
        animalQuantity: string;
        uaQuantity: string;
        stockingRate: string;
      };
      actions: {
        removeBatch: string;
        deleteLink: string;
      };
      notFound: {
        title: string;
        description: string;
        back: string;
      };
    };
  };
  /** Cadastros Base — Pecuários — Lote/Área (BatchArea, execução 029,
   *  TASK-FE-2100) — irmã estrutural de BatchGrazing. "UA/Suporte" existe
   *  aqui (literal, cabeças/hectare, D9 do contrato de API). */
  batchArea: {
    singularLabel: string;
    pluralLabel: string;
    list: {
      pageTitle: string;
      pageSubtitle: string;
      deletedToast: string;
      table: {
        code: string;
        area: string;
        batches: string;
        date: string;
        employee: string;
        animalQuantity: string;
        uaQuantity: string;
        stockingRate: string;
      };
      actions: {
        view: string;
        delete: string;
      };
      emptyState: {
        titleEmpty: string;
        descriptionEmpty: string;
        cta: string;
      };
      filter: {
        title: string;
        batch: string;
        batchPlaceholder: string;
        area: string;
        areaPlaceholder: string;
      };
    };
    deleteDialog: {
      title: string;
      description: string;
      warningText: string;
      confirm: string;
    };
    removeBatchDialog: {
      title: string;
      description: string;
      warningText: string;
      confirm: string;
    };
    form: {
      title: { create: string };
      subtitle: { create: string };
      fields: {
        code: string;
        date: string;
        employee: string;
        area: string;
        batches: string;
        hectares: string;
        uaSupport: string;
        animalQuantity: string;
        uaQuantity: string;
        stockingRate: string;
      };
      placeholders: {
        code: string;
        area: string;
        batches: string;
      };
      hints: {
        codeGenerated: string;
        metricsPending: string;
        uaSupportTooltip: string;
      };
      validation: {
        dateRequired: string;
        areaRequired: string;
        batchesRequired: string;
        batchesMin: string;
      };
    };
    detail: {
      sections: {
        generalData: string;
        metrics: string;
        batchesLinked: string;
      };
      fields: {
        code: string;
        area: string;
        date: string;
        employee: string;
        animalQuantity: string;
        totalWeight: string;
        averageWeight: string;
        averageUaPerBatch: string;
        hectares: string;
      };
      hints: {
        averageUaPerBatchTooltip: string;
      };
      actions: {
        removeBatch: string;
        deleteLink: string;
      };
      notFound: {
        title: string;
        description: string;
        back: string;
      };
    };
  };
  /** Cadastros Base — Pecuários — Cochos (Trough, execução 029,
   *  TASK-FE-2200) — CRUD completo + visualização NOVA. Trio de localização
   *  Área/Módulo Pastejo/Curral com regra XOR e semântica "manter vs.
   *  desvincular" do Curral (D-FE-1). */
  trough: {
    singularLabel: string;
    pluralLabel: string;
    list: {
      pageTitle: string;
      pageSubtitle: string;
      deletedToast: string;
      table: {
        code: string;
        description: string;
        type: string;
        location: string;
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
    };
    filter: {
      title: string;
      search: string;
      searchPlaceholder: string;
    };
    typeOptions: {
      covered: string;
      uncovered: string;
    };
    activeOptions: {
      yes: string;
      no: string;
    };
    form: {
      title: { create: string; edit: string };
      subtitle: { create: string; edit: string };
      fields: {
        code: string;
        type: string;
        description: string;
        totalArea: string;
        grazing: string;
        area: string;
        feedlotCorral: string;
        active: string;
      };
      placeholders: {
        type: string;
        description: string;
        totalArea: string;
        grazing: string;
        area: string;
        feedlotCorral: string;
      };
      hints: {
        codeGenerated: string;
        locationExclusive: string;
        feedlotCorralKeep: string;
      };
      actions: {
        removeFeedlotCorral: string;
      };
      validation: {
        typeRequired: string;
        descriptionRequired: string;
        descriptionMaxLength: string;
        totalAreaRequired: string;
        totalAreaMin: string;
        activeRequired: string;
      };
    };
    detail: {
      sections: {
        generalData: string;
        location: string;
      };
      fields: {
        code: string;
        type: string;
        description: string;
        totalArea: string;
        area: string;
        grazing: string;
        feedlotCorral: string;
      };
      emptyLocation: string;
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
  /** Cadastros Base — Pecuários — Bebedouros (DrinkingFountain, execução
   *  029, TASK-FE-2300) — DELTA sobre Trough: rótulo "Volume(L)" + campo
   *  extra opcional `length`/"Comprimento(cm)". Menu NOVO. */
  drinkingFountain: {
    singularLabel: string;
    pluralLabel: string;
    list: {
      pageTitle: string;
      pageSubtitle: string;
      deletedToast: string;
      table: {
        code: string;
        description: string;
        type: string;
        location: string;
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
    };
    filter: {
      title: string;
      search: string;
      searchPlaceholder: string;
    };
    typeOptions: {
      covered: string;
      uncovered: string;
    };
    activeOptions: {
      yes: string;
      no: string;
    };
    form: {
      title: { create: string; edit: string };
      subtitle: { create: string; edit: string };
      fields: {
        code: string;
        type: string;
        description: string;
        totalArea: string;
        length: string;
        grazing: string;
        area: string;
        feedlotCorral: string;
        active: string;
      };
      placeholders: {
        type: string;
        description: string;
        totalArea: string;
        length: string;
        grazing: string;
        area: string;
        feedlotCorral: string;
      };
      hints: {
        codeGenerated: string;
        locationExclusive: string;
        feedlotCorralKeep: string;
      };
      actions: {
        removeFeedlotCorral: string;
      };
      validation: {
        typeRequired: string;
        descriptionRequired: string;
        descriptionMaxLength: string;
        totalAreaRequired: string;
        totalAreaMin: string;
        lengthMin: string;
        activeRequired: string;
      };
    };
    detail: {
      sections: {
        generalData: string;
        location: string;
      };
      fields: {
        code: string;
        type: string;
        description: string;
        totalArea: string;
        length: string;
        area: string;
        grazing: string;
        feedlotCorral: string;
      };
      emptyLocation: string;
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
