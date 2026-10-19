// src/@types/language/module-birth-animals/index.ts
// -----------------------------------------------------------------------------
// Interface de tradução do módulo de NASCIMENTOS (BirthAnimal — Operacional >
// Pecuária, TASK-NASC-FE-01). Espelha a convenção de `module-movement-sales/
// index.ts`. Conteúdo mora em
// src/constants/languages/{idioma}/languageBirthAnimals.ts.
//
// Namespace `birthAnimals` — LIVRE, sem colisão com `transfers`/`movementSales`.
//
// TASK-NASC-FE-01 (fundação) cobre `list` + `filter` + `deleteDialog` +
// `banners` (trava de Editar/Excluir por `has_weaning`, `BirthAnimalWeaningBanner`)
// + `detail` (tela de visualização dedicada, contrato §6). TASK-NASC-FE-02
// (formulário, contrato §7) acrescenta `form` (cabeçalho + identificação
// dinâmica + aviso de data de lote). A Tarefa 20 acrescenta `import`/`export`.
// -----------------------------------------------------------------------------

export interface ModuleBirthAnimals {
  birthAnimal: {
    singularLabel: string;
    pluralLabel: string;
    list: {
      pageTitle: string;
      pageSubtitle: string;
      deletedToast: string;
      table: {
        code: string;
        mother: string;
        fatherText: string;
        newborn: string;
        breed: string;
        weight: string;
        date: string;
      };
      actions: {
        view: string;
        edit: string;
        delete: string;
        editDisabledTooltip: string;
        deleteDisabledTooltip: string;
      };
      emptyState: {
        titleEmpty: string;
        descriptionEmpty: string;
        titleFiltered: string;
        descriptionFiltered: string;
      };
      error: {
        message: string;
        retry: string;
      };
    };
    filter: {
      title: string;
      identification: string;
      breed: string;
      startDate: string;
      endDate: string;
    };
    deleteDialog: {
      title: string;
      descriptionTemplate: string;
    };
    /** Trava de Editar/Excluir (`has_weaning`, contrato §5.3/§6) — mirror
     *  `TransferGuardBanners`/`MovementSaleLockBanners`. */
    banners: {
      weaningLocked: string;
    };
    detail: {
      pageTitleTemplate: string;
      notFound: {
        title: string;
        description: string;
        back: string;
      };
      sections: {
        header: string;
        identifications: string;
      };
      fields: {
        code: string;
        date: string;
        mother: string;
        fatherText: string;
        fatherAnimal: string;
        newborn: string;
        breed: string;
        category: string;
        specie: string;
        birthNote: string;
        batch: string;
        transferBatch: string;
        weight: string;
        furDescription: string;
        note: string;
        photo: string;
      };
      identificationsTable: {
        type: string;
        identification: string;
        empty: string;
      };
      backButton: string;
    };
    /** Formulário de criar/editar (contrato §7, TASK-NASC-FE-02). */
    form: {
      title: {
        create: string;
        edit: string;
      };
      fields: {
        code: string;
        date: string;
        specie: string;
        category: string;
        breed: string;
        birthNote: string;
        weight: string;
        mother: string;
        fatherText: string;
        batch: string;
        transferBatch: string;
        furDescription: string;
        note: string;
        photo: string;
      };
      placeholders: {
        specie: string;
        category: string;
        breed: string;
        birthNote: string;
        mother: string;
        fatherText: string;
        batch: string;
        transferBatch: string;
      };
      hints: {
        codeGeneratedOnSave: string;
        specieRequired: string;
      };
      image: {
        dropzoneTitle: string;
        dropzoneDragging: string;
        changeLabel: string;
        removeLabel: string;
        errorType: string;
        errorSize: string;
      };
      identifications: {
        sectionTitle: string;
        sectionHint: string;
        emptyTitle: string;
        addRowLabel: string;
        removeRowLabel: string;
        typeLabel: string;
        typePlaceholder: string;
        valueLabel: string;
        valuePlaceholder: string;
        duplicateWarningTitle: string;
        duplicateWarningDescription: string;
      };
      batchDateWarning: {
        title: string;
      };
    };
    /** Import/export de planilha (contrato §9, Tarefa 20) — mirror
     *  `Animals.excel`, `BirthAnimalImportModal.tsx`. Resposta de sucesso é só
     *  `{created}` (sem `children_created`, diferente de Animal). */
    excel: {
      headerButtonLabel: string;
      downloadTemplate: string;
      downloadTemplateError: string;
      import: {
        title: string;
        subtitle: string;
        instructions: string;
        downloadShortcut: string;
        warning: {
          title: string;
          description: string;
        };
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
        rowErrors: {
          title: string;
        };
        result: {
          created: string;
        };
        importSuccessToast: string;
        noPermission: string;
        cancelButton: string;
        submitButton: string;
        closeButton: string;
      };
    };
  };
}
