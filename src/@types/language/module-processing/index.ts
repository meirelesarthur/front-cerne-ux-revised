// src/@types/language/module-processing/index.ts
// Interface de tradução do módulo "Processamentos" (Processing — Operacional
// > Pecuária, 97-Esteiras/039, TASK-FE-039-PROC-01). O conteúdo mora em
// src/constants/languages/{idioma}/languageProcessamentos.ts. Molde
// estrutural DIRETO de `module-transfer-abc-batch/index.ts` (mesma esteira,
// cabeçalho + repeater de animais), acrescido de `status.{pending,finished}`
// (enum client-side, mirror `batches.batch.statusOptions`) e do sub-repeater
// `identification` (mirror `module-birth-animals`, mesmo catálogo físico
// `id_animals`).
//
// Chave TOP-LEVEL `processamentos` (Tarefa explícita, front-plan-proc.md
// §3.1) — mirror do padrão de módulo próprio já usado por
// `livestock`/`diets`/`dietBeats`.
export interface ModuleProcessing {
  processing: {
    singularLabel: string;
    pluralLabel: string;
    status: {
      pending: string;
      finished: string;
    };
    list: {
      pageTitle: string;
      columns: {
        code: string;
        date: string;
        type: string;
        quantity: string;
        status: string;
      };
      actions: {
        view: string;
        finish: string;
        /** REWORK (039, PROC-05). */
        cancel: string;
      };
      filter: {
        title: string;
        status: string;
        /** REWORK (039, PROC-09, FD-R2 desbloqueada). */
        batch: string;
        area: string;
        grazing: string;
      };
      emptyState: {
        titleEmpty: string;
        descriptionEmpty: string;
      };
      error: {
        message: string;
        retry: string;
      };
      finishedToast: string;
      /** REWORK (039, PROC-05) — toast do `useRequest` (`typesRequest:'apply'`). */
      cancelToast: string;
      /** 095 (D7) — mensagem própria p/ `code: PURCHASE_CANCEL_HAS_WEIGHINGS`. */
      cancelBlockedByWeighings: string;
    };
    /** REWORK (039, PROC-05) — modal de confirmação `ModalAction`, compartilhado entre `index.tsx` e `ProcessingDetalhe.tsx`. */
    cancelModal: {
      title: string;
      /** NUNCA promete reversão de categoria/raça/peso (RW-D, fiel ao legado). */
      body: string;
    };
    detail: {
      pageTitleTemplate: string;
      notFound: {
        title: string;
        description: string;
        back: string;
      };
      fields: {
        code: string;
        date: string;
        type: string;
        quantity: string;
        farm: string;
        status: string;
        isStock: string;
        arrobaValue: string;
      };
      backButton: string;
      /** round-6 (round6-fix-plan.md §3.3) — títulos das seções empilhadas do Detalhe (só em `FINISHED`). */
      sections: {
        header: string;
        animals: string;
        weighing: string;
        ultrasound: string;
        sanitary: string;
      };
      /** round-6 — mensagens de lista vazia por seção. */
      empty: {
        animals: string;
        ultrasound: string;
        sanitaryItems: string;
      };
      /** round-6 — colunas de `ProcessingDetailAnimalsTable` (round6-fix-plan.md §3.2). */
      animalsTable: {
        identification: string;
        category: string;
        breed: string;
        specie: string;
        batch: string;
        categoryMatrice: string;
        reproductiveStatus: string;
        birthDate: string;
        weight: string;
        lastWeight: string;
        lastWeightDate: string;
        priceKilo: string;
        priceArroba: string;
        ua: string;
        unitValue: string;
      };
      /** round-6 — colunas de `ProcessingDetailUltrasoundTable`. */
      ultrasoundTable: {
        identification: string;
        date: string;
        aol: string;
        egs: string;
        marm: string;
        classification: string;
      };
      /** round-6 — `InfoField`s do bloco Pesagem (`item.weighing`). */
      weighingFields: {
        date: string;
        isStock: string;
        arrobaValue: string;
      };
      /** round-6 — `InfoField`s + colunas de `ProcessingDetailSanitaryBlock`. */
      sanitaryTable: {
        date: string;
        product: string;
        warehouse: string;
        measurement: string;
        quantity: string;
        totalQuantity: string;
        observation: string;
      };
    };
    form: {
      title: {
        finish: string;
      };
      summary: {
        code: string;
        /** REWORK (039, PROCFID-01) — antigo "Origem", renomeado p/ "Tipo" (fidelidade `_forms.blade.php:7-27`). */
        type: string;
      };
      fields: {
        header: {
          date: string;
          /** REWORK (039, PROCFID-01) — antigo "Entra em Estoque?", renomeado p/ "Movimentação ABC Corte". */
          isStock: string;
          arrobaValue: string;
          /** REWORK (039, PROCFID-01) — select Sim/Não novo, flag que controla o bloco sanitário (Onda 2). */
          sanitary: string;
        };
        animal: {
          category: string;
          breed: string;
          batch: string;
          weight: string;
          value: string;
          /** REWORK (039, round-3, PROC-R3-02) — lista dinâmica de `category_matrices`
           *  (Lactação/Multípara/…), ALVO A confirma que é ESTE o "Estágio Reprodutivo"
           *  do legado (`category_matrice_id`). round-5 (correção do dono) —
           *  obrigatório quando a categoria é FÊMEA (`is_reproductive===true`); o campo
           *  "Status Reprodutivo" (`reproductive_status`) que existia ao lado foi extinto. */
          categoryMatrice: string;
          /** REWORK (039, PROCFID-02) — somente leitura, hidratado do `prepare` (`last_weight`). */
          lastWeight: string;
          /** REWORK (039, PROCFID-02) — editável, sugestão inicial do `prepare` (`birth_date`). */
          birthDate: string;
          /** REWORK (039, PROCFID-02) — select Sim/Não, libera `aol`/`egs`/`marm`/`classification`. */
          hasUltrasound: string;
          aol: string;
          egs: string;
          marm: string;
          classification: string;
          removeAnimal: string;
          sectionTitle: string;
          emptyAnimals: string;
          /** DEC-139 — wizard 1-animal-por-vez, "{current}"/"{total}" — mirror do contador "Animal N de M" do legado. */
          wizardStepTemplate: string;
        };
        identification: {
          sectionTitle: string;
          typeLabel: string;
          valueLabel: string;
          addRow: string;
          removeRow: string;
          emptyRows: string;
          noIdentificationOptionLabel: string;
          /** PROC-10 (FD-R3 desbloqueada) — dup-check ao vivo, mirror `BirthAnimalIdentificationRow`. "{{identification}}" é substituído. */
          duplicateWarningTitle: string;
          duplicateWarningDescription: string;
        };
        /** Onda 2 (PROCFID-04) — bloco "Item Sanitário", header-level, condicionado a `sanitary===true` (mirror `_card-sanitary-item.blade.php`). */
        sanitaryItem: {
          sectionTitle: string;
          addItem: string;
          removeItem: string;
          warehouse: string;
          product: string;
          measurement: string;
          stock: string;
          /** "Dose Animal" — dose por animal, o servidor multiplica pelo nº de animais (CV-006). */
          quantity: string;
          observation: string;
          /** Aviso client-side (`toaster`, NÃO bloqueia submit) quando `quantity × nº animais > saldo` — mirror do `swal` do legado. */
          stockInsufficientWarning: string;
        };
      };
      guard: {
        notPendingTitle: string;
        notPendingDescription: string;
        backButton: string;
      };
      unsavedChangesWarning: string;
      /** Dialog de confirmação de saída sem salvar (`useUnsavedChangesGuard`), mirror `languageBreedingSeasons.ts`. */
      unsavedChangesDialog: {
        title: string;
        description: string;
        confirmButton: string;
      };
      /**
       * 063-est03-9-reprovacoes, TASK-063-PROC-QA3-07 — aviso ao selecionar
       * um Lote sem área nem módulo vinculado (`ProcessingAnimalRow.tsx`,
       * mirror `_card_animal.blade.php:179-246`, `swal("Atenção",...)`).
       * Confirmar abre `ChangeBatchModuleAreaModal`; o campo Lote já foi
       * desselecionado ANTES do aviso aparecer.
       */
      batchWithoutAreaOrGrazingWarning: {
        title: string;
        description: string;
        confirmButton: string;
      };
      /** Toast de `onInvalid` do submit (mirror `finishText.invalidFieldsToast` de `FinishMovementSale.tsx`). */
      invalidFieldsToast: string;
      /** PROC-04 — falha do `prepare` (404/500) degrada para o form manual, não trava a tela. */
      prepareErrorToast: string;
      /** PROC-06 — autosave + recuperação de rascunho (`useFormDraftAutosave`). */
      draft: {
        title: string;
        /** "{timestamp}" substituído por `formatDate(draftTimestamp, 'dd/MM/yyyy HH:mm')`. */
        descriptionTemplate: string;
        /** Fallback sem timestamp (não deveria ocorrer em uso normal, mas evita string vazia). */
        description: string;
        confirmButton: string;
        discardButton: string;
      };
      /** PROC-07 — `ProcessingSummaryPanel` (resumos por categoria/lote + progresso). Nome distinto de `form.summary` (resumo read-only do topo, já existente). */
      liveSummary: {
        /** "{filled}"/"{total}" substituídos. */
        progressTemplate: string;
        categoryTableTitle: string;
        batchTableTitle: string;
        categoryColumns: {
          category: string;
          quantity: string;
          unitValue: string;
          total: string;
        };
        batchColumns: {
          batch: string;
          quantity: string;
          totalUa: string;
          averageWeight: string;
          averagePriceKg: string;
          averagePriceArroba: string;
        };
      };
      /** PROC-11 — import de planilha (Compra-only) + download de modelo, mirror `BirthAnimalImportModal`. */
      importModal: {
        button: string;
        title: string;
        subtitle: string;
        downloadShortcut: string;
        downloadTemplateError: string;
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
        rowErrorsTitle: string;
        cancelButton: string;
        submitButton: string;
        successToast: string;
      };
      validation: {
        dateRequired: string;
        arrobaValueRequired: string;
        numberType: string;
        categoryRequired: string;
        breedRequired: string;
        batchRequired: string;
        /** round-5 (correção do dono) — obrigatório INLINE quando `is_reproductive===true` (categoria FÊMEA). */
        categoryMatriceRequired: string;
        weightRequired: string;
        valueRequired: string;
        identificationTypeRequired: string;
        identificationRequired: string;
        identificationsMin: string;
        animalsMin: string;
        /** REWORK (039, PROCFID-02) — `required_if:has_ultrasound,true` (RECOMMENDED no servidor). */
        aolRequired: string;
        egsRequired: string;
        marmRequired: string;
        classificationRequired: string;
        classificationMaxLength: string;
        /** Onda 2 (PROCFID-04) — mirror `required_if:*,sanitary,true` do servidor (`guardSanitaryItems`). */
        sanitaryWarehouseRequired: string;
        sanitaryProductRequired: string;
        sanitaryMeasurementRequired: string;
        sanitaryQuantityRequired: string;
        sanitaryItemsMin: string;
      };
    };
  };
}
