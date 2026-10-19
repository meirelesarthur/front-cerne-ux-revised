// src/@types/language/module-sanitary/index.ts
// -----------------------------------------------------------------------------
// Interface de tradução do módulo SANITÁRIO (Sanitary — Operacional >
// Pecuária > Manejo, F-062, TASK-SAN-FE-01). Espelha a convenção de
// `module-weaning/index.ts` (feature de complexidade comparável — CRUD +
// relatório, sem máquina de estados). Conteúdo mora em
// `src/constants/languages/{idioma}/languageSanitary.ts`.
//
// Namespace `sanitary` — LIVRE, sem colisão com `weaning`/`processamentos`.
// NÃO confundir com `feedlotMap.feedlotMap.sanitary` (diálogo do Mapa de
// Confinamento, execução 042, mesmo domínio de negócio, módulo/bounded
// context DIFERENTE — ver ADR-FE-SAN-00 do contrato de tela §2.1).
//
// TASK-SAN-FE-01 (fundação) cobre a interface COMPLETA — list/detail/form/
// createMultipleDialog/report — porque as Tarefas 26-33 (telas) consomem
// estas chaves sem precisar tocar este arquivo de novo (contrato-tela §7/§12).
// -----------------------------------------------------------------------------

export interface ModuleSanitary {
  sanitary: {
    singularLabel: string;
    pluralLabel: string;
    titleModule: string;

    /** Listagem — `san-screen-list`, `san-list-table`, `san-filter-form` (contrato-tela §6.1). */
    list: {
      pageTitle: string;
      pageSubtitle: string;
      newButton: string;
      createMultipleButton: string;
      deletedToast: string;
      table: {
        code: string;
        date: string;
        batch: string;
        responsible: string;
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
      };
      filter: {
        title: string;
        batch: string;
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

    /** Visualização — `san-screen-show`, 3 blocos sempre carregados (contrato-tela §6.9). */
    detail: {
      title: string;
      backButton: string;
      sections: {
        identification: string;
        products: string;
        animals: string;
        labor: string;
      };
      fields: {
        code: string;
        date: string;
        responsible: string;
        batch: string;
        warehouse: string;
        product: string;
        measurement: string;
        /**
         * Coluna "Estoque" da tabela de Produtos (TASK-SAN-FE-06, ADITIVA) —
         * exibe o `uuid` truncado da linha de `Stock` (`SanitaryItemDetail.stock`),
         * já que `SanitaryResource` real não devolve armazém/lote resolvidos
         * (mesma limitação honesta já documentada em `sanitario-form-mapper.ts`).
         */
        stock: string;
        dose: string;
        total: string;
        costCenter: string;
        note: string;
        funcType: string;
        executor: string;
        quantity: string;
      };
      /**
       * Mensagem genérica reusada pelos 3 blocos (Produtos/Animais/Controle de
       * Horas) quando o respectivo array vem vazio — TASK-SAN-FE-06, ADITIVA,
       * mirror `detail.emptySection` de `module-service-orders`/`module-appropriations`.
       */
      emptySection: string;
      notFound: {
        title: string;
        description: string;
      };
    };

    /** Formulário create/edit — `san-form-main` (contrato-tela §6.3/§6.4/§6.5/§6.6). */
    form: {
      title: {
        create: string;
        edit: string;
      };
      sections: {
        header: string;
        items: string;
        labor: string;
      };
      fields: {
        code: string;
        date: string;
        responsible: string;
        batch: string;
        timeControl: string;
        animals: string;
        warehouse: string;
        product: string;
        measurement: string;
        stock: string;
        dose: string;
        costCenter: string;
        note: string;
        funcType: string;
        executor: string;
        totalQuantity: string;
      };
      placeholders: {
        batch: string;
        animals: string;
        warehouse: string;
        product: string;
        measurement: string;
        funcType: string;
        executor: string;
      };
      /**
       * Ações em massa do `SelectMulti` de Animais (AC-07, mirror
       * `NaturalSection` da lane B) — ADITIVO TASK-SAN-FE-03, a interface
       * completa herdada da TASK-SAN-FE-01 não previa este par de chaves.
       */
      markAllButton: string;
      unmarkAllButton: string;
      /** Fábrica `laborTypeOptions` (Funcionário/Função/Fornecedor — `func_type` 1/2/3, FS-01). */
      funcTypeOptions: {
        employee: string;
        function: string;
        provider: string;
      };
      hints: {
        codeGeneratedOnSave: string;
        selectBatchFirst: string;
      };
      addItem: string;
      removeItem: string;
      addLabor: string;
      removeLabor: string;
      emptyItemsRow: string;
      emptyLaborRow: string;
      /** Aviso de saldo insuficiente — client-side, NÃO bloqueia submit (mirror `swal` legado). */
      stockInsufficientWarning: string;
      validation: {
        dateRequired: string;
        batchRequired: string;
        animalsRequired: string;
        itemsRequired: string;
        warehouseRequired: string;
        productRequired: string;
        measurementRequired: string;
        quantityRequired: string;
        quantityMin: string;
        laborFuncTypeRequired: string;
        laborExecutorRequired: string;
        laborMeasurementRequired: string;
        laborTotalQuantityRequired: string;
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

    /** Diálogo de criação múltipla — `CreateSanitariesMultipleDialog` (ADR-FE-SAN-01, contrato-tela §6.7). */
    createMultipleDialog: {
      title: string;
      fields: {
        batches: string;
        animals: string;
      };
      placeholders: {
        batches: string;
      };
      validation: {
        batchesRequired: string;
        itemsRequired: string;
      };
      submitButton: string;
      cancelButton: string;
      successToast: string;
    };

    /**
     * Relatório por lote — `san-screen-report` (contrato-tela §6.8).
     *
     * RE-ALINHAMENTO F-318 (esteira 078, F-318-plano-frontend.md,
     * TASK-F318-F01) — a API foi RE-MIGRADA e restaurou os 4 filtros
     * (`category`/`corral`/`animal`/`product`) que a TASK-SAN-FE-08
     * anterior havia removido por especulação incorreta (o Form Request
     * de então realmente não os aceitava; o novo, sim). Mirror
     * `module-evolutions.evolution.report` (mesmo caso de uso: export
     * síncrono via blob, loading por botão).
     */
    report: {
      pageTitle: string;
      pageSubtitle: string;
      filters: {
        category: string;
        corral: string;
        batch: string;
        animal: string;
        product: string;
        startDate: string;
        endDate: string;
      };
      placeholders: {
        category: string;
        corral: string;
        animal: string;
        product: string;
      };
      hint: {
        datesRequired: string;
      };
      exportPdf: string;
      exportXlsx: string;
      toasts: {
        success: string;
        genericError: string;
      };
    };
  };
}
