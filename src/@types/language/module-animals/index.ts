// src/@types/language/module-animals/index.ts
// Interface de tradução do módulo "Rebanho" (Animal — Cadastros Base /
// Pecuários, execução 027). Arquivo NOVO e independente — mirror estrutural
// de `module-category-animals` (i18n modular por módulo). O conteúdo mora em
// src/constants/languages/{idioma}/languageAnimals.ts.
//
// TASK-FE-880 cobre a camada de infra (singular/plural para queryKey, opções
// dos enums `type`/`reproductive_status`). TASK-FE-881 completa `list`/
// `filter` (copy real da tela de listagem). `form.*` (TASK-FE-882..885) fica
// para as Tarefas seguintes, mesmo padrão incremental de `module-category-
// animals`/`module-opening-balances`.

export interface ModuleAnimals {
  animal: {
    singularLabel: string;
    pluralLabel: string;

    /** Fábrica `type-options.ts` — enum `type` (single/no_id). */
    typeOptions: {
      single: string;
      noId: string;
    };

    /** Fábrica `reproductive-status-options.ts` — enum `reproductive_status` (1|2|3). */
    reproductiveStatusOptions: {
      pregnant: string;
      empty: string;
      calved: string;
    };

    /** Fábrica `animal-status-options.ts` (Tarefa 26, FM-04) — enum `status` (A/P/D/L/S/R). */
    statusOptions: {
      active: string;
      pending: string;
      death: string;
      loss: string;
      sale: string;
      deleted: string;
    };

    /** Fábrica `animal-origin-options.ts` (Tarefa 26, FM-05) — filtro `origin` (B/P/C). */
    originOptions: {
      birth: string;
      processing: string;
      registration: string;
    };

    /** Fábrica `depreciation-type-options.ts` — enum `depreciation_type` (0|1), TASK-FE-885. */
    depreciationTypeOptions: {
      withResidual: string;
      withoutResidual: string;
    };

    /** Tela de LISTAGEM (grid, 7 colunas) — TASK-FE-881. */
    list: {
      pageTitle: string;
      pageSubtitle: string;
      deletedToast: string;
      table: {
        type: string;
        identificationType: string;
        identificationTypeEmpty: string;
        identification: string;
        /** "S/ID" — animal sem nenhum registro no pivot de identificação. */
        identificationEmpty: string;
        category: string;
        batch: string;
        batchEmpty: string;
        /** Template `{count}` — 2º+ lote do vínculo N:N (ex.: "+{count}"). */
        batchMore: string;
        weight: string;
        /** Tarefa 26 (LM-12). */
        status: string;
        /** Tarefa 26 (LM-14). */
        reproductiveStatus: string;
        /** Tarefa 26 (LM-14) — `reproductive_status === null` ("N/I"). */
        reproductiveStatusEmpty: string;
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
      deleteConfirm: {
        title: string;
        description: string;
        warning: string;
      };
      error: {
        message: string;
        retry: string;
      };

      /**
       * Barra de ações em lote (Tarefa 27 — casca; Tarefas 28/29/30 plugam
       * as ações). Adaptação do `BulkActionBar` do design system `cerne`.
       */
      bulkBar: {
        /** `role="toolbar"` da barra. */
        ariaLabel: string;
        /** `aria-label` do botão `X` que limpa a seleção. */
        clearSelection: string;
        /** Template `{count}` — singular (1 selecionado). */
        selectedOne: string;
        /** Template `{count}` — plural (0 ou 2+ selecionados). */
        selectedMany: string;
        /** Rótulo do botão "Status Reprodutivo" (Tarefa 28). */
        reproductiveStatus: string;
        /** Rótulo do botão "Transferir de Lote" (Tarefa 30). */
        batchTransfer: string;
        /** Ação destrutiva "Apagar Animais" (Tarefa 29). */
        deleteMany: {
          action: string;
          /** Palavra de confirmação digitada — mesma chave alimenta o rótulo e a comparação (pt: 'APAGAR', en: 'DELETE', es: 'BORRAR'). */
          confirmWord: string;
        };
      };
    };

    /** Tela DEDICADA "Gestão Animais" (Operacional > Pecuária, execução 017) — mesmo
     *  componente de `list` (`AnimalListScreen`), só título/subtítulo próprios. */
    managementScreen: {
      pageTitle: string;
      pageSubtitle: string;
    };

    /** Drawer de FILTRO da listagem (6 campos: search/categoria/lote/status/origem/status reprodutivo) — TASK-FE-881 + Tarefa 26. */
    filter: {
      title: string;
      search: string;
      searchPlaceholder: string;
      category: string;
      categoryAll: string;
      batch: string;
      batchAll: string;
      /** Tarefa 26 (FM-04). */
      status: string;
      statusAll: string;
      /** Tarefa 26 (FM-05). */
      origin: string;
      originAll: string;
      /** Tarefa 26 (FM-06). */
      reproductiveStatus: string;
      reproductiveStatusAll: string;
    };

    /**
     * Diálogos das 3 ações em lote (Tarefas 28/29/30). Cada bloco cobre
     * título, corpo (com `{count}` interpolado) e rótulos de campo/rodapé
     * próprios — os rótulos de rodapé genéricos ("Cancelar") vêm de
     * `languageGB.defaltStrings`, não duplicados aqui.
     */
    dialogs: {
      reproductiveStatus: {
        title: string;
        /** Template `{count}`. */
        countTemplate: string;
        pregnancyDate: string;
        birthForecast: string;
        submitButton: string;
        /** Template `{count}` — usa o `updated` devolvido pelo servidor. */
        successMessage: string;
      };
      deleteMany: {
        title: string;
        /** Template `{count}`. */
        countTemplate: string;
        warning: string;
        /** Template `{word}` — substituído pela palavra de confirmação traduzida. */
        confirmLabel: string;
        submitButton: string;
        /** Template `{count}` — usa o `deleted` devolvido pelo servidor. */
        successMessage: string;
        /** 095 — título do bloco de animais bloqueados por vínculos. */
        blockedTitle: string;
        /** Template `{count}` — animais bloqueados além do limite visível. */
        blockedMore: string;
        /** Aviso quando o servidor truncou `blocked_uuids`. */
        blockedTruncated: string;
        /** Botão que remove os bloqueados da seleção. */
        blockedDeselect: string;
      };
      batchTransfer: {
        title: string;
        /** Template `{count}`. */
        countTemplate: string;
        sameBatchMode: string;
        perAnimalMode: string;
        batchLabel: string;
        batchPlaceholder: string;
        animalColumnLabel: string;
        submitButton: string;
        /** Template `{count}` — usa `selectedAnimals.length` (endpoint sem contagem própria). */
        successMessage: string;
      };
    };

    /** Ações de header (Baixar modelo/Exportar reais nesta Tarefa; Importar completo em TASK-FE-886). */
    excel: {
      downloadTemplate: string;
      downloadTemplateError: string;
      export: string;
      exportError: string;
      /** Modal de importação (`AnimalImportModal.tsx`, TASK-FE-886) — mirror
       * `PlanAccountImportModal`/`OpeningBalanceImportModal` (ABORT-ALL). */
      import: {
        menuLabel: string;
        title: string;
        subtitle: string;
        instructions: string;
        downloadShortcut: string;
        warning: { title: string; description: string };
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
        rowErrors: { title: string };
        result: {
          created: string;
          childrenCreated: string;
        };
        importSuccessToast: string;
        cancelButton: string;
        submitButton: string;
        closeButton: string;
      };
    };

    /**
     * Formulário ÚNICO create/edit (`CreateOrUpdateAnimal.tsx`) — TASK-FE-882
     * (casca + Fotos + Dados Básicos) + TASK-FE-883 (Pesos/Valores). Blocos de
     * TASK-FE-884/885 (Genealogia/Reprodutivo/Bezerro/Depreciação) estendem
     * este mesmo bucket `form` nas Tarefas seguintes.
     */
    form: {
      title: { create: string; edit: string };
      subtitle: { create: string; edit: string };

      fields: {
        photo: string;
        type: string;
        quantity: string;
        specie: string;
        category: string;
        breed: string;
        entryDate: string;
        birthDate: string;
        identificationType: string;
        identification: string;
        weight: string;
        priceKiloAlive: string;
        furDescription: string;
        note: string;
        startWeight: string;
        valueUnitary: string;
        unityAnimalUa: string;
        priceArrobaAlive: string;

        // ---- Genealogia (§3.4.4, TASK-FE-884) ----
        motherAnimal: string;
        fatherAnimal: string;

        // ---- Estágio/Status Reprodutivo (§3.4.5, TASK-FE-884) ----
        categoryMatrice: string;
        reproductiveStatus: string;
        birthForecast: string;

        // ---- Bezerro (§3.4.6, TASK-FE-884) ----
        childCategory: string;
        childBirthDate: string;
        childWeight: string;
        childIdentificationType: string;
        childIdentification: string;

        // ---- Depreciação (§3.4.7, TASK-FE-885) ----
        depreciationType: string;
        vlAcquisition: string;
        residual: string;
        depreciation: string;
        lifeBens: string;
        vlResidual: string;
        vlDepreciate: string;
        /** Readonly/calculado (TASK-FE-902) — "Vl. Depreciado" do legado, já exposto por `AnimalResource.depreciation.vl_depreciated`. */
        vlDepreciated: string;
        /** Readonly/calculado (TASK-FE-902) — "Sd. a Depreciar" do legado, já exposto por `AnimalResource.depreciation.sd_depreciate`. */
        sdDepreciate: string;
      };

      placeholders: {
        type: string;
        specie: string;
        category: string;
        breed: string;
        identificationType: string;
        identification: string;
        motherAnimal: string;
        fatherAnimal: string;
        categoryMatrice: string;
        reproductiveStatus: string;
        childCategory: string;
        childIdentificationType: string;
        depreciationType: string;
      };

      hints: {
        specieRequired: string;
        /** Aviso de semântica de lote — exibido junto ao campo `quantity` (Contrato §5, Opção B). */
        quantityBatch: string;
        /** Placeholder ("—") dos 4 campos calculados enquanto `weight`/`price_kilo_alive` não são números válidos. */
        calculatedEmpty: string;
      };

      /** Bloco de identificação dinâmica (`useFieldArray`, §3.4.2). */
      identifications: {
        sectionTitle: string;
        sectionHint: string;
        emptyTitle: string;
        addRowLabel: string;
        removeRowLabel: string;
        /** Exibido no lugar do bloco quando `type = "Sem Identificação"` (S/ID automático). */
        noIdHint: string;
        /** TASK-FE-931 — aviso NÃO-BLOQUEANTE (toast `warning`) disparado no
         * `blur` do campo quando `GET /animals/verify-identification` retorna
         * `exists: true` (outro animal ATIVO da fazenda já usa a mesma
         * identificação). Não impede o submit (Animal-contrato.md §21.6). */
        duplicateWarningTitle: string;
        /** `{{identification}}` é substituído pelo valor digitado. */
        duplicateWarningDescription: string;
      };

      /** Textos do `ImageUpload` (bloco Fotos). */
      image: {
        dropzoneTitle: string;
        dropzoneDragging: string;
        changeLabel: string;
        removeLabel: string;
        errorType: string;
        errorSize: string;
      };

      /** Títulos/avisos dos blocos condicionais (TASK-FE-884/885). */
      sections: {
        genealogy: string;
        reproductiveStatus: string;
        child: {
          title: string;
          hint: string;
          createOnlyHint: string;
        };
        depreciation: string;
      };
    };
  };
}
