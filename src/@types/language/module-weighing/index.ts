// src/@types/language/module-weighing/index.ts
// -----------------------------------------------------------------------------
// Interface de tradução do módulo PESAGEM (Weighing — Operacional > Pecuária >
// Manejo, F-071, TASK-PES-FE-01). Espelha a convenção de
// `module-sanitary/index.ts` (feature irmã, mesma sessão, complexidade
// comparável) — adaptando `sections`/`fields` ao bloco de animais (peso/
// último peso/ganho/GMD/ultrassom) em vez de mão de obra.
//
// Namespace `weighing` — LIVRE, sem colisão com `sanitary`/`weaning`. NÃO
// confundir com `@/@types/v2/FeedlotMap/weighing.ts` (Mapa de Confinamento,
// execução 042, mesmo domínio de negócio, bounded context DIFERENTE — ver
// contrato-tela-lane-c-pesagem-frontend.md §4).
//
// TASK-PES-FE-01 (fundação) cobre a interface COMPLETA — list/detail/form/
// importDialog — porque as Tarefas 35-41 (telas) consomem estas chaves sem
// precisar tocar este arquivo de novo (contrato-tela §7/§12).
// -----------------------------------------------------------------------------

export interface ModuleWeighing {
  weighing: {
    singularLabel: string;
    pluralLabel: string;
    titleModule: string;

    /** Listagem — `pes-screen-list`, `pes-list-table`, `pes-filter-form` (contrato-tela §6.1). */
    list: {
      pageTitle: string;
      pageSubtitle: string;
      newButton: string;
      importButton: string;
      downloadTemplateButton: string;
      deletedToast: string;
      /** Toast de sucesso do download do Relatório Individual (correção AF_REJECTED, execução 017). */
      reportDownloadedToast: string;
      table: {
        code: string;
        date: string;
        /**
         * Coluna "Movimentação ABC Corte" (`is_stock`) — leitura direta do
         * legado (`resources/views/weighings/index.blade.php`,
         * `Form::select('is_stock', 'Movimentação ABC Corte')`/`_forms.blade.php`):
         * é o MESMO campo `is_stock` já existente em `WeighingListItem` e já
         * exposto no formulário (`form.fields.isStock`), a coluna só faltava
         * na grid migrada (GAP-FE-PES-01 fechou 6 colunas sem este campo —
         * correção AD_REJECTED, UT-000109). NÃO é campo novo, NÃO é chamada
         * de API nova.
         */
        isStock: string;
        batchOrCategory: string;
        animalsCount: string;
        averageWeight: string;
        averageGain: string;
        gmd: string;
      };
      actions: {
        view: string;
        edit: string;
        delete: string;
        /** Ação "Relatório Individual" — download blob por linha, sem tela própria (contrato-tela §1.1/§6.2). */
        report: string;
      };
      emptyState: {
        titleEmpty: string;
        descriptionEmpty: string;
        titleFiltered: string;
        descriptionFiltered: string;
      };
      filter: {
        title: string;
        batch: string;
        category: string;
        responsible: string;
      };
      deleteDialog: {
        title: string;
        descriptionTemplate: string;
      };
      error: {
        message: string;
        retry: string;
      };
    };

    /** Visualização — `pes-screen-show`, blocos Animais + Sanitário condicional (contrato-tela §6.8). */
    detail: {
      title: string;
      backButton: string;
      sections: {
        identification: string;
        animals: string;
        sanitary: string;
      };
      fields: {
        code: string;
        date: string;
        batch: string;
        category: string;
        isStock: string;
        arrobaValue: string;
        animal: string;
        weight: string;
        lastWeight: string;
        lastWeightDate: string;
        gain: string;
        gmd: string;
        ultrasound: string;
        /** Correção de fidelidade (97-Esteiras/002 execução 002 lane C) — AOL/EGS/MARM/Classe do ultrassom por linha, mirror `ProcessingDetailUltrasoundTable`. */
        aol: string;
        egs: string;
        marm: string;
        classification: string;
        warehouse: string;
        product: string;
        measurement: string;
        stock: string;
        dose: string;
        total: string;
        note: string;
      };
      emptySection: string;
      notFound: {
        title: string;
        description: string;
      };
    };

    /** Formulário create/edit — `pes-form-main` (contrato-tela §6.4/§6.5/§6.6). */
    form: {
      title: {
        create: string;
        edit: string;
      };
      sections: {
        header: string;
        animals: string;
        sanitary: string;
      };
      fields: {
        code: string;
        date: string;
        batch: string;
        category: string;
        isStock: string;
        arrobaValue: string;
        /** `Switch` "Vincular Sanitário" — habilitado só com `batch_uuid` preenchido (CL-024/OQ-P7). */
        sanitary: string;
        animal: string;
        weight: string;
        lastWeight: string;
        lastWeightDate: string;
        gain: string;
        gmd: string;
        ultrasound: string;
        /** Correção de fidelidade (97-Esteiras/002 execução 002 lane C) — visíveis/obrigatórios só quando `has_ultrasound===true` na linha, mirror `ProcessingAnimalRow`. */
        aol: string;
        egs: string;
        marm: string;
        classification: string;
        warehouse: string;
        product: string;
        measurement: string;
        stock: string;
        dose: string;
        total: string;
        note: string;
      };
      placeholders: {
        batch: string;
        category: string;
        animal: string;
        warehouse: string;
        product: string;
        measurement: string;
      };
      hints: {
        codeGeneratedOnSave: string;
        selectBatchFirst: string;
        sanitaryUnavailableInEdit: string;
      };
      addAnimal: string;
      removeAnimal: string;
      addItem: string;
      removeItem: string;
      emptyAnimalsRow: string;
      /** Aviso ao adicionar linha quando todos os animais do lote/categoria já foram escolhidos. */
      allAnimalsSelected: string;
      /** Erro da linha quando a data da pesagem conflita com a última pesagem/entrada do animal. `{reason}` e `{date}` são substituídos. */
      /** Mensagem do bloqueio de Salvar enquanto houver linha com conflito de data. */
      dateConflictBlocked: string;
      emptyItemsRow: string;
      /** Aviso de saldo insuficiente — client-side, NÃO bloqueia submit (mirror `swal` legado). */
      stockInsufficientWarning: string;
      validation: {
        dateRequired: string;
        batchOrCategoryRequired: string;
        arrobaValueRequired: string;
        animalsRequired: string;
        animalRequired: string;
        weightRequired: string;
        lastWeightRequired: string;
        lastWeightDateRequired: string;
        /** Correção de fidelidade (97-Esteiras/002 execução 002 lane C) — mirror `processing-schema.ts` (`required_if:has_ultrasound,true`). */
        aolRequired: string;
        egsRequired: string;
        marmRequired: string;
        classificationRequired: string;
        classificationMaxLength: string;
        itemsRequired: string;
        warehouseRequired: string;
        productRequired: string;
        measurementRequired: string;
        quantityRequired: string;
        quantityMin: string;
      };
      unsavedChangesDialog: {
        title: string;
        description: string;
        confirm: string;
        cancel: string;
      };
      toast: {
        createdSuccess: string;
        updatedSuccess: string;
      };
    };

    /**
     * Import/Template — `WeighingImportModal` (contrato-tela §6.3, TASK-PES-FE-03,
     * mirror MECÂNICO `BirthAnimalImportModal.tsx`/
     * `module-birth-animals.birthAnimal.excel.import`). EXTENSÃO sobre o
     * scaffold mínimo da TASK-PES-FE-01 — o shape anterior (só `title`/
     * `fields.file`/`validation.fileRequired`/`result.successTitle..
     * errorDescription`/`submitButton`/`cancelButton`/`downloadTemplateButton`)
     * não cobria os textos do `FileUpload` (dropzone/troca/remoção/erros de
     * tipo-tamanho), o aviso pré-envio (`warning`) nem as mensagens de erro
     * por linha (`rowErrors`) exigidos pelo mirror mecânico — nenhum outro
     * arquivo consumia `importDialog` até esta Tarefa (scaffold nunca lido em
     * produção), então a reestruturação é segura (ver Histórico TASK-PES-FE-03).
     */
    importDialog: {
      title: string;
      subtitle: string;
      instructions: string;
      downloadShortcut: string;
      warning: {
        title: string;
        description: string;
      };
      fields: {
        file: string;
      };
      fileUpload: {
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
      submitButton: string;
      cancelButton: string;
      closeButton: string;
      downloadTemplateButton: string;
    };
  };
}
