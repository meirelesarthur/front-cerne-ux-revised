// src/@types/language/module-movement-purchases/index.ts
// -----------------------------------------------------------------------------
// Interface de tradução do módulo de COMPRA DE ANIMAIS (MovementPurchase —
// Operacional > Pecuária, TASK-CP-04). Espelha a convenção de
// module-movement-sales/index.ts. Conteúdo mora em
// src/constants/languages/{idioma}/languageMovementPurchases.ts.
//
// Namespace `movementPurchases` — LIVRE, sem colisão com `movementSales`.
//
// TASK-CP-04 (fundação) cobre `typePaymentOptions` + `form.validation` do
// CABEÇALHO. TASK-CP-05 (listagem) cobre `list` + `filter` + `deleteDialog` +
// `reports` (mensagens de download). `detail`/demais seções de `form`
// (itens/financeiro) e `documents`/`xmlImport` são acrescentados por
// `TASK-CP-06`..`09`.
// -----------------------------------------------------------------------------

export interface ModuleMovementPurchases {
  movementPurchase: {
    singularLabel: string;
    pluralLabel: string;
    list: {
      pageTitle: string;
      pageSubtitle: string;
      deletedToast: string;
      table: {
        code: string;
        provider: string;
        dtSale: string;
        total: string;
        createdAt: string;
        /** Coluna ícone (LST-06) — condicional a `chave` setada
         *  (compra veio de import XML). */
        nfe: string;
        number: string;
        gtas: string;
      };
      actions: {
        view: string;
        /** `GET .../{uuid}/report` (TASK-CP-05, ACT-03). */
        report: string;
        /** Abre o modal de anexos (`POST .../documents`) — item some sem
         *  `onDocuments` (modal ainda não construído, `TASK-CP-08`). */
        documents: string;
        /** `GET .../{uuid}/sisbov-report` (TASK-CP-05, ACT-05) — endpoint
         *  ÚNICO (diferente de Vendas, sem variantes recria/abate). */
        sisbovReport: string;
        edit: string;
        delete: string;
        /** `TASK-CP-09` — `isMovementPurchaseLocked()` sempre `false` hoje
         *  (`MovementPurchaseResource` não expõe agregado de `Processing`,
         *  gap aditivo classe `GAP-VENDAS-FE-03`); texto reservado para o
         *  dia em que o backend expuser o campo. */
        editDisabledTooltip: string;
        /** T6 (088) — Excluir desabilitado com processamento finalizado. */
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
      search: string;
      provider: string;
      startDate: string;
      endDate: string;
    };
    deleteDialog: {
      title: string;
      descriptionTemplate: string;
    };
    /** `type_payment` (FLD-08) — mirror `movementSaleTypePaymentOptions`. */
    typePaymentOptions: {
      cash: string;
      check: string;
      creditCard: string;
      debitCard: string;
      storeCredit: string;
      foodVoucher: string;
      mealVoucher: string;
      giftVoucher: string;
      fuelVoucher: string;
      commercialInvoice: string;
      bankSlip: string;
      bankDeposit: string;
      pix: string;
      noPayment: string;
      other: string;
    };
    /** Relatórios PDF (TASK-CP-05) — download síncrono via blob. */
    reports: {
      printError: string;
      /** Mensagem própria do 404 esperado do endpoint SISBOV (compra válida
       *  sem animal SISBOV) — nunca o toast genérico do interceptor. */
      sisbovNotFound: string;
    };
    /** Formulário de Criar/Editar (`TASK-CP-04` cabeçalho + `TASK-CP-06`
     *  itens + `TASK-CP-07` financeiro). */
    form: {
      title: {
        create: string;
        edit: string;
      };
      sections: {
        header: string;
        items: string;
        totals: string;
        payment: string;
      };
      fields: {
        code: string;
        dtSale: string;
        /** FLD-03 — display do responsável, SEMPRE o usuário logado
         *  (`user_id` nunca é exposto pelo Resource). */
        userName: string;
        seller: string;
        provider: string;
        chave: string;
        serie: string;
        number: string;
        gtas: string;
        typePayment: string;
        note: string;
        hasFinancial: string;
      };
      placeholders: {
        seller: string;
        provider: string;
        typePayment: string;
      };
      totals: {
        totalProducts: string;
        freight: string;
        otherValues: string;
        discount: string;
        total: string;
      };
      itemRow: {
        title: string;
        empty: string;
        addButton: string;
        removeButton: string;
        removeLastError: string;
        fields: {
          category: string;
          quantity: string;
          valueUnit: string;
          amount: string;
          note: string;
          /** Readonly — só exibido quando a compra tem `chave` setada
           *  (import XML, `TASK-CP-08`). */
          itemDescription: string;
        };
        placeholders: {
          category: string;
        };
      };
      /** `TASK-CP-08` — diálogo de import de XML (`POST .../import-xml`),
       *  preview do draft ANTES de aplicar ao form (`useMutation` direto,
       *  mirror `MovementSaleEmitNfeDialog`). Só disponível em modo criação. */
      xmlImport: {
        label: string;
        title: string;
        hint: string;
        applyButton: string;
        fileLabel: string;
        dropzoneTitle: string;
        dropzoneDraggingTitle: string;
        changeLabel: string;
        removeFileLabel: string;
        errorTypeMessage: string;
        errorSizeMessage: string;
        successToast: string;
        errorToast: string;
        providerMatched: string;
        providerNotMatched: string;
        providerNotMatchedToast: string;
        providerNotMatchedMessage: string;
        warningsTitle: string;
        /** Avisos do import por `code` (fallback = `message` da API). */
        warnings: Record<string, string>;
        installmentsTitle: string;
        installmentNumber: string;
        installmentDueDate: string;
        installmentAmount: string;
        defaultsTitle: string;
        previewTitle: string;
        itemsCountTemplate: string;
        emptyHint: string;
        fields: {
          provider: string;
          dtSale: string;
          chave: string;
          number: string;
          serie: string;
          total: string;
        };
      };
      /** `TASK-CP-07` — subfluxo financeiro. SEM "cabeçalho financeiro"
       *  (`financial_number`/`financial_type_id`/etc.) — ver docblock de
       *  `@/@types/v2/MovementPurchases` (divergência confirmada vs. o
       *  `MovementPurchaseRequest` real). */
      financial: {
        /** 088 D3-FE-T1 — cabeçalho financeiro (FH). */
        header: {
          sectionTitle: string;
          sectionHint: string;
          number: string;
          typeTitle: string;
          typeTitlePlaceholder: string;
          proprietary: string;
          proprietaryPlaceholder: string;
          note: string;
          hasInput: string;
          hasInputPlaceholder: string;
          inputDate: string;
          inputValue: string;
          fiscalDocument: string;
          classification: string;
          yes: string;
          no: string;
          classificationNone: string;
          classificationCapex: string;
          classificationOpex: string;
        };
        /** 088 D3-FE-T1 — mensagens literais do legado (§3.2); `{{x}}` = placeholder. */
        messages: {
          requiredFields: string;
          allocationTotalMismatch: string;
          fillRowBeforeAdd: string;
          fillTotalFirst: string;
          allocationExceeds: string;
          removeConfirmTitle: string;
          removeConfirmText: string;
          minOneRow: string;
          totalMustBePositive: string;
          inputLessThanTotal: string;
          installmentPositive: string;
          installmentsSumMismatch: string;
          duplicateTriple: string;
          legacyAllocationDiff: string;
          recalculated: string;
          firstInstallmentMustBeInput: string;
        };
        installments: {
          sectionTitle: string;
          sectionHint: string;
          qtdInstallments: string;
          firstInstallment: string;
          intInstallments: string;
          generateButton: string;
          sumLabel: string;
          sumHint: string;
          installmentDate: string;
          installmentValue: string;
          addInstallment: string;
          removeInstallment: string;
          emptyInstallments: string;
          regenerateConfirmTitle: string;
          regenerateConfirmDescription: string;
          inputRowLabel: string;
          inputRowHint: string;
          totalLabel: string;
          emptyHint: string;
          positionLabel: string;
        };
        allocation: {
          sectionTitle: string;
          sectionHint: string;
          category: string;
          categoryPlaceholder: string;
          costCenter: string;
          costCenterPlaceholder: string;
          emptyRows: string;
          addRow: string;
          removeRow: string;
          addRowBlockedMessage: string;
          removeRowBlockedMessage: string;
          removeRowConfirmTitle: string;
          removeRowConfirmDescription: string;
          account: string;
          accountPlaceholder: string;
          percent: string;
          value: string;
          totalLabel: string;
          allocatedLabel: string;
          percentTotalLabel: string;
          differenceWarning: string;
        };
      };
      unsavedChanges: {
        title: string;
        message: string;
        confirm: string;
      };
      businessErrorFallback: string;
      /** D2 (088) — aviso de parcela baixada (campos financeiros travados). */
      writeOffLockMessage: string;
      /** T6 (088) — processamento finalizado: tela em leitura. */
      finishedReadOnlyMessage: string;
      validation: {
        providerRequired: string;
        typePaymentRequired: string;
        itemsMin: string;
        numberType: string;
        chaveInvalid: string;
        itemCategoryRequired: string;
        itemQuantityRequired: string;
        itemQuantityMin: string;
        itemValueUnitRequired: string;
        itemValueUnitMin: string;
        installmentDateRequired: string;
        installmentValueRequired: string;
        installmentsMin: string;
        installmentsSumMismatch: string;
        allocationCategoryRequired: string;
        allocationCenterRequired: string;
      };
    };
    /** `TASK-CP-08` — modal de anexos (`POST .../documents`), mirror
     *  `MovementSaleDocumentsModal`. Wire real DIVERGE de Vendas: arrays
     *  PARALELOS por índice (`description[]`/`anexo[]`/`date[]`/
     *  `old_document[]`), não `documents[i][chave]` aninhado — ver
     *  `movement-purchase-service.ts::buildMovementPurchaseDocumentsFormData`. */
    documents: {
      title: string;
      titleTemplate: string;
      sectionLabel: string;
      addButton: string;
      emptyLabel: string;
      emptyDiffBlockedMessage: string;
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
      removeRowConfirm: {
        title: string;
        description: string;
        warning: string;
        confirm: string;
      };
      validation: {
        descriptionRequired: string;
        descriptionMaxLength: string;
        fileRequired: string;
      };
      savedToast: string;
      loadError: string;
      retry: string;
    };
    /** `TASK-CP-09` — tela de visualização readonly, mirror
     *  `MovementSaleDetalhe`. Tabela de itens alterna colunas por `chave`
     *  setada (CLM-46) — sem `chave`, 4 colunas legadas sempre fixas
     *  (`weightKg`=0/`performance`=50%/`valueReal`=0/`valueArroba`=0, ver
     *  docblock de `MovementPurchaseDetalhe.tsx`), nunca dado real. */
    detail: {
      pageTitleTemplate: string;
      notFound: {
        title: string;
        description: string;
        back: string;
      };
      sections: {
        header: string;
        items: string;
        totals: string;
      };
      fields: {
        code: string;
        dtSale: string;
        provider: string;
        seller: string;
        chave: string;
        serie: string;
        number: string;
        gtas: string;
        typePayment: string;
        note: string;
        createdAt: string;
      };
      itemsTable: {
        /** Coluna só exibida com `chave` setada (CLM-46). */
        itemDescription: string;
        category: string;
        quantity: string;
        /** Colunas legadas SEMPRE fixas (0/50/0/0), só exibidas SEM `chave`
         *  (CLM-46/CLM-29) — nunca dado real, ver docblock de
         *  `MovementPurchaseDetalhe.tsx`. */
        weightKg: string;
        performance: string;
        valueReal: string;
        valueArroba: string;
        valueUnit: string;
        amount: string;
        note: string;
        empty: string;
      };
      totals: {
        totalProducts: string;
        freight: string;
        otherValues: string;
        discount: string;
        total: string;
      };
      backButton: string;
    };
    /** `TASK-CP-09` — banner de imutabilidade, mirror
     *  `MovementSaleLockBanners`. Texto reservado — `isMovementPurchaseLocked()`
     *  sempre `false` hoje (gap aditivo classe `GAP-VENDAS-FE-03`), o banner
     *  nunca renderiza em produção até o backend expor o agregado. */
    banners: {
      lockedMessage: string;
    };
  };
}
