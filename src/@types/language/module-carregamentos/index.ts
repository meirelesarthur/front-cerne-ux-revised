// src/@types/language/module-carregamentos/index.ts
// -----------------------------------------------------------------------------
// Interface de tradução do módulo de CARREGAMENTOS (Charge — Operacional >
// Agricultura). Espelha a convenção de `module-transfers`. O conteúdo mora em
// `src/constants/languages/{idioma}/languageCarregamentos.ts`.
//
// Namespace `carregamentos` — LIVRE, sem colisão com nenhum bloco existente.
//
// TASK-FE-CG-01 cobre `list` + `filter` + `deleteDialog` + `statusOptions` +
// `itemTypeOptions` + `expenseTypeOptions` + `expensePayerOptions` + a casca
// de `form` (cabeçalho/itens/despesas) — os fluxos de `finish`/`transfer`/
// `documents`/`reports` recebem apenas os rótulos MÍNIMOS usados pelos itens
// de menu declarados em `TASK-FE-CG-02` (`ChargeActionsMenu`); o conteúdo
// completo de cada tela dedicada é ACRESCENTADO por `TASK-FE-CG-05..07`
// (edição incremental deste mesmo arquivo, nunca recriado do zero).
// -----------------------------------------------------------------------------

export interface ModuleCarregamentos {
  charge: {
    singularLabel: string;
    pluralLabel: string;
    titleModule: string;
    list: {
      pageTitle: string;
      pageSubtitle: string;
      deletedToast: string;
      table: {
        status: string;
        code: string;
        dtCharge: string;
        client: string;
        responsible: string;
        driver: string;
        quantityForeseen: string;
        quantityReal: string;
        total: string;
      };
      actions: {
        view: string;
        edit: string;
        delete: string;
        documents: string;
        finish: string;
        transfer: string;
        print: string;
        deleteDisabledTooltip: string;
        /** AM-05 — só habilitado quando `status === 'pendente'`. */
        finishDisabledTooltip: string;
        /** AM-07 — só habilitado quando `status === 'finalizada'`. */
        transferDisabledTooltip: string;
        /** Reusado pelos 2 itens ainda sem tela dedicada (documentos/
         *  imprimir) — `TASK-FE-CG-06/07`. */
        comingSoonTooltip: string;
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
      client: string;
      user: string;
      product: string;
      area: string;
      status: string;
      statusAll: string;
      startDate: string;
      endDate: string;
    };
    deleteDialog: {
      title: string;
      descriptionTemplate: string;
    };
    statusOptions: {
      pendente: string;
      finalizada: string;
    };
    itemTypeOptions: {
      buque: string;
      penteada: string;
    };
    expenseTypeOptions: {
      reversal: string;
      supplies: string;
      services: string;
    };
    expensePayerOptions: {
      provider: string;
      company: string;
      client: string;
      apportionment: string;
    };
    apropriationOptions: {
      yes: string;
      no: string;
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
      tabs: {
        header: string;
        items: string;
        expenses: string;
      };
      backButton: string;
      readOnlyBanner: string;
      businessErrorFallback: string;
      unsavedChanges: {
        title: string;
        message: string;
        confirm: string;
      };
      fields: {
        header: {
          dtCharge: string;
          client: string;
          transporter: string;
          driverName: string;
          driverPlate: string;
          driverUf: string;
          driverNif: string;
          note: string;
          /** FD-02 — só exibido em edição (`InputReadOnly`, `chargeDetail.
           *  user.label`). */
          responsible: string;
          /** FD-18 ("Valor da carga") — só exibido em edição, hint de
           *  SERVIDOR (`chargeDetail.total`), nunca recalculado no cliente. */
          total: string;
        };
        item: {
          product: string;
          warehouse: string;
          noStock: string;
          quantity: string;
          amount: string;
          totalAmount: string;
          weight: string;
          type: string;
          calibre: string;
          team: string;
          seller: string;
          area: string;
          provider: string;
          note: string;
          /** FD-30 ("Estoque", CL-46) — hint client-only, `InputReadOnly`,
           *  NUNCA vai ao payload. */
          stock: string;
          /** FD-31 ("Un. Medida", CL-46) — hint client-only, `InputReadOnly`,
           *  NUNCA vai ao payload. */
          measurementUnit: string;
        };
        expense: {
          type: string;
          reversal: string;
          service: string;
          warehouse: string;
          product: string;
          provider: string;
          quantity: string;
          vlUnit: string;
          value: string;
          whoPay: string;
          apropriation: string;
          /** FD-32 ("Estoque", aba Insumos) — hint client-only,
           *  `InputReadOnly`, NUNCA vai ao payload. */
          stock: string;
        };
      };
      validation: {
        driverNameMaxLength: string;
        driverPlateMaxLength: string;
        driverNifMaxLength: string;
        noteMaxLength: string;
      };
      itemRow: {
        addButton: string;
        removeButton: string;
        removeConfirm: {
          title: string;
          message: string;
        };
        addIncompleteError: string;
        removeLastError: string;
        validation: {
          quantityRequired: string;
          quantityMin: string;
          amountRequired: string;
          amountMin: string;
          calibreMaxLength: string;
        };
      };
      expenseRow: {
        emptyState: string;
        addButton: string;
        removeButton: string;
        removeConfirm: {
          title: string;
          message: string;
        };
        /** Existente sem satélite carregado (`warehouse`/`service_reversal`
         *  ausente na resposta) — DESCONHECIDO, nunca inventado (defesa em
         *  profundidade, mirror `RomaneioExpenseRow.tsx`). */
        unknownFieldHint: string;
        /** Estorno/serviço escolhido usa quantidade em kg (`use_kg` do
         *  catálogo) — hint client-only, mirror `RomaneioExpenseRow.tsx`. */
        useKgHint: string;
        validation: {
          quantityRequired: string;
          quantityMin: string;
          vlUnitRequired: string;
          vlUnitMin: string;
        };
      };
      notFound: string;
    };
    /** Tela dedicada `FinishCharge.tsx` (`TASK-FE-CG-05`), mirror
     *  `FinishAppropriation.tsx`. */
    finish: {
      title: string;
      subtitle: string;
      cancelButton: string;
      submitButton: string;
      successToast: string;
      businessErrorFallback: string;
      notFound: string;
      itemsSectionTitle: string;
      quantityRealLabel: string;
      newItemSectionTitle: string;
      newItemHint: string;
      validation: {
        quantityRealRequired: string;
        quantityRealMin: string;
        newItemQuantityRequired: string;
        newItemQuantityMin: string;
        newItemAmountRequired: string;
        newItemAmountMin: string;
      };
    };
    /** Diálogo `GenerateTransferDialog.tsx` (`TASK-FE-CG-05`) — labels de
     *  CAMPO reaproveitam `languageGB.transfers.transfer.form.fields.*`
     *  (o diálogo produz um `Transfer` de verdade, mesmo vocabulário),
     *  só o resumo/ações do fluxo próprio do Carregamento moram aqui. */
    transfer: {
      title: string;
      description: string;
      cancelButton: string;
      confirmButton: string;
      successToast: string;
      businessErrorFallback: string;
      draftErrorFallback: string;
      summary: {
        totalProducts: string;
        itemsTitle: string;
        unknownLabel: string;
      };
    };
    /** Modal `ChargeDocumentsModal.tsx` (`TASK-FE-CG-06`), mirror
     *  `movementSales.movementSale.documents`. Diferente do mirror, SEM
     *  `emptyDiffBlockedMessage` — `documents: []` é um diff plenamente
     *  representável aqui (ver `charge-service.ts`, `syncChargeDocuments`). */
    documents: {
      title: string;
      /** `{code}` — mesma convenção de `deleteDialog.descriptionTemplate`. */
      titleTemplate: string;
      sectionLabel: string;
      addButton: string;
      emptyLabel: string;
      removeRowButton: string;
      fields: {
        file: string;
        description: string;
        date: string;
      };
      dropzoneTitle: string;
      dropzoneDraggingTitle: string;
      changeLabel: string;
      removeFileLabel: string;
      replaceLabel: string;
      existingFileLabel: string;
      errorType: string;
      errorSize: string;
      /** Confirmação de remoção de linha JÁ PERSISTIDA (o servidor apaga o
       *  arquivo físico ao salvar). */
      removeRowConfirm: {
        title: string;
        description: string;
        warning: string;
        confirm: string;
      };
      validation: {
        descriptionRequired: string;
        descriptionMaxLength: string;
        /** Validado no handler (fora do Yup) — só quando a linha é NOVA. */
        fileRequired: string;
      };
      /** Mirror da mensagem real da API (`ChargeController::
       *  storeDocuments()`). */
      savedToast: string;
      loadError: string;
      retry: string;
    };
    /** 2 modais genéricos `ChargeReportModal.tsx` (`TASK-FE-CG-07`) — por
     *  produto (`charge_product_report`) e semanal (`charge_week_report`),
     *  MESMO shape de parâmetro (`start_date`/`end_date`), mirror
     *  `weaning.weaning.report` (mas sem `format` — os 2 relatórios são
     *  sempre PDF, `DomPDF::stream()` no servidor). */
    reports: {
      byProduct: {
        headerButtonLabel: string;
        title: string;
      };
      week: {
        headerButtonLabel: string;
        title: string;
      };
      fields: {
        startDate: string;
        endDate: string;
      };
      submitButton: string;
      cancelButton: string;
      errorToast: string;
      validation: {
        startDateRequired: string;
        endDateRequired: string;
        endDateBeforeStartDate: string;
      };
    };
  };
}
