// src/@types/language/module-movement-sales/index.ts
// -----------------------------------------------------------------------------
// Interface de tradução do módulo de VENDA DE ANIMAIS (MovementSale —
// Operacional > Pecuária, TASK-VD-FE-01). Espelha a convenção de
// module-transfers/index.ts. Conteúdo mora em
// src/constants/languages/{idioma}/languageMovementSales.ts.
//
// Namespace `movementSales` — LIVRE, sem colisão com `transfers`/`invoices`.
//
// TASK-VD-FE-01 (fundação) cobre `list` + `filter` + `deleteDialog` +
// `banners` (trava de Editar, `MovementSaleLockBanners`) + os 2 catálogos de
// enum necessários à listagem/detalhe (`typeOptions`/`statusOptions`/
// `pricingTypeOptions`). `detail` cobre a tela de visualização dedicada
// (§6 do contrato). Tarefas 15/16/17 acrescentam `form`/`finish`/satélites.
// -----------------------------------------------------------------------------

export interface ModuleMovementSales {
  movementSale: {
    singularLabel: string;
    pluralLabel: string;
    list: {
      pageTitle: string;
      pageSubtitle: string;
      deletedToast: string;
      table: {
        status: string;
        code: string;
        client: string;
        dtSale: string;
        total: string;
        createdAt: string;
        typeSale: string;
        /** VD-FE-04 (`GAP-API-FE-02` fechado) — coluna "Financeiro"
         *  (`has_financial`). */
        financial: string;
        /** VD-FE-04 (`GAP-API-FE-02` fechado) — coluna "N. NFe" (`nfe.number`). */
        nfe: string;
      };
      actions: {
        view: string;
        /** Tarefa 17.a (task-packet §3, ação A2) — `GET .../{uuid}/report`. */
        print: string;
        /** Tarefa 17.b (ação A3) — `POST .../{uuid}/documents` (modal de
         *  anexos), gate `movement_sales_view` (achado C, mirror legado). */
        documents: string;
        /** Tarefa 17.a (ação A5) — `GET .../{uuid}/sisbov-report/rearing`,
         *  só visível quando `type_sale===1`. */
        sisbovRearing: string;
        /** Tarefa 17.a (ação A6) — `GET .../{uuid}/sisbov-report/slaughter`,
         *  só visível quando `type_sale===2`. */
        sisbovSlaughter: string;
        /** Tarefa 17.c (ação A4) — abre `MovementSaleEmitNfeDialog`
         *  (handoff), gate `movement_sales_edit` (item some sem ela). */
        emitNfe: string;
        /** Exibido no `Tooltip` do item quando falta `nfe_create` (gate
         *  duplo, §2.5 — a rota de destino responde 403 sem ela). */
        emitNfeDisabledTooltip: string;
        edit: string;
        finish: string;
        delete: string;
        editDisabledTooltip: string;
      };
      /** TASK-VD-FE-03 (contrato §8.2) — seleção múltipla + botão de
       *  finalização em lote (mirror `SaldoEstoque/index.tsx`). */
      batchBar: {
        selectedCountTemplate: string;
        finishButton: string;
        selectAtLeastOneAlert: string;
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
      typeSale: string;
      typeSaleAll: string;
      search: string;
      client: string;
      startDate: string;
      endDate: string;
    };
    deleteDialog: {
      title: string;
      descriptionTemplate: string;
    };
    /** Trava de Editar/Finalizar (`isLocked`, contrato §5.3/§5.4) — mirror
     *  `TransferGuardBanners`. Só computa `type_sale===2 && status==='F'`
     *  (`incomes_count` indisponível na API hoje, `GAP-VENDAS-FE-03`). */
    banners: {
      finishedSlaughterLocked: string;
    };
    typeOptions: {
      rearing: string;
      slaughter: string;
    };
    statusOptions: {
      pending: string;
      finished: string;
    };
    pricingTypeOptions: {
      kgArroba: string;
      head: string;
    };
    /** `type_payment` (F15) — mirror `NfeTypePaymentEnum`, ver options/index.ts. */
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
        categories: string;
        totals: string;
      };
      fields: {
        code: string;
        status: string;
        typeSale: string;
        pricingType: string;
        dtSale: string;
        client: string;
        seller: string;
        batch: string;
        gtas: string;
        nfe: string;
        createdAt: string;
      };
      itemsTable: {
        animal: string;
        category: string;
        weight: string;
        note: string;
        empty: string;
      };
      categoriesTable: {
        category: string;
        quantity: string;
        valueReal: string;
        valueArroba: string;
        valueHead: string;
        valueTotal: string;
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
    /** Formulário de Criar/Editar (TASK-VD-FE-02, contrato §7). */
    form: {
      title: { create: string; edit: string };
      sections: {
        header: string;
        items: string;
        categories: string;
        totals: string;
      };
      fields: {
        code: string;
        dtSale: string;
        seller: string;
        batchSale: string;
        batch: string;
        client: string;
        typeSale: string;
        pricingType: string;
        chave: string;
        number: string;
        serie: string;
        typePayment: string;
        gtas: string;
        note: string;
        hasFinancial: string;
        /** Gate `IG5` (`GAP-VENDAS-FE-05` §2.8) — exibido quando
         *  `type_sale===2` (Abate) desabilita "Gerar Financeiro"; explica
         *  por que o campo desaparece/trava (nunca some sem explicação). */
        /** UT-000719 (D-097-12) — Documento Fiscal (Sim/Não) da Finalização. */
        fiscalDocument: string;
        hasFinancialSlaughterHint: string;
        averageWeight: string;
      };
      placeholders: {
        seller: string;
        batch: string;
        client: string;
        typeSale: string;
        pricingType: string;
        typePayment: string;
      };
      xmlImport: {
        label: string;
        hint: string;
        successToast: string;
        clientNotMatchedToast: string;
        errorToast: string;
        dropzoneTitle: string;
        dropzoneDraggingTitle: string;
        changeLabel: string;
        removeLabel: string;
        errorTypeMessage: string;
        errorSizeMessage: string;
      };
      // VD-FE-01 (contrato §3.2 FALTA-A / SURF-PNL-001) — painel colapsável
      // "Importação de pesagem": baixa modelo XLSX + sobe planilha
      // preenchida → hidrata `weight_kg` dos itens já selecionados, SEM
      // persistir (SE-013). `unmatchedTitle`/`unmatchedHint` cobrem os
      // animais do form que NÃO vieram na resposta do parse (planilha sem a
      // linha, identificação divergente, animal inativo/de outra fazenda, ou
      // peso ≤ 0 — o servidor omite a linha em vez de sinalizar erro,
      // `ParseWeighingSpreadsheetAction`).
      weighingImport: {
        title: string;
        toggleAria: string;
        emptyHint: string;
        downloadTemplate: string;
        uploadLabel: string;
        importButton: string;
        successToast: string;
        unmatchedTitle: string;
        unmatchedHint: string;
      };
      itemRow: {
        title: string;
        addButton: string;
        removeButton: string;
        removeLastError: string;
        /** VD-FE-02 (contrato §3.2 FALTA-B / IG-008) — toast ao selecionar um
         *  `animal_uuid` já presente em outra linha; a linha atual é limpa,
         *  o duplicado nunca chega ao payload. */
        duplicateAnimalTitle: string;
        duplicateAnimalError: string;
        /** VD-FE-02 (PARADA-FE-5/DIV-FE-4, F-027) — texto exibido em
         *  `previous_weight_kg` quando não há peso/pesagem anterior do
         *  animal (mirror do legado, substitui o '—' genérico). */
        noHistoryLabel: string;
        fields: {
          animal: string;
          category: string;
          previousWeight: string;
          weight: string;
          gain: string;
          gmd: string;
          carcassWeight: string;
          /** TASK-VD-FE-03 (contrato §8) — `required|numeric` no
           *  `MovementSaleSlaughterRequest` real; aditivo, sempre visível. */
          performance: string;
          note: string;
        };
        placeholders: {
          animal: string;
        };
        empty: string;
      };
      categoriesTab: {
        title: string;
        empty: string;
        fields: {
          category: string;
          quantity: string;
          valueReal: string;
          valueArroba: string;
          valueHead: string;
          valueTotal: string;
        };
      };
      totals: {
        totalProducts: string;
        freight: string;
        otherValues: string;
        discount: string;
        total: string;
      };
      createClientModal: {
        addClientAria: string;
      };
      /** Subfluxo financeiro (TASK-VD-FE-04, fundação compartilhada) — Rateio
       *  + Parcelamento, consumido por `MovementSaleIncomeAllocation.tsx`/
       *  `MovementSaleInstallmentsSection.tsx`. Vocabulário livre (namespace
       *  próprio de `movementSales`), NÃO reexporta `languageIncomes`. */
      financial: {
        /** TASK-VD-FE-05/GAP-VENDAS-FE-04 §2.6 — título da seção "Dados de
         *  Pagamento" (posição legada: `.financial-container`, depois dos
         *  Totais), que agrupa `typePayment`/`note`/`hasFinancial`. */
        paymentSectionTitle: string;
        allocation: {
          sectionTitle: string;
          sectionHint: string;
          category: string;
          categoryPlaceholder: string;
          costCenter: string;
          costCenterPlaceholder: string;
          /** VD-FE-04 (`GAP-API-FE-03` fechado) — Conta Contábil, opcional. */
          planAccount: string;
          planAccountPlaceholder: string;
          value: string;
          percent: string;
          addRow: string;
          addRowBlockedMessage: string;
          removeRow: string;
          removeRowConfirmTitle: string;
          removeRowConfirmDescription: string;
          removeRowBlockedMessage: string;
          emptyRows: string;
          sumLabel: string;
          sumHint: string;
        };
        installments: {
          sectionTitle: string;
          sectionHint: string;
          qtdInstallments: string;
          firstInstallment: string;
          intInstallments: string;
          generateButton: string;
          regenerateConfirmTitle: string;
          regenerateConfirmDescription: string;
          installmentDate: string;
          installmentValue: string;
          addInstallment: string;
          removeInstallment: string;
          emptyInstallments: string;
          sumLabel: string;
          sumHint: string;
        };
      };
      validation: {
        requiredField: string;
        dtSaleRequired: string;
        clientRequired: string;
        typeSaleRequired: string;
        typePaymentRequired: string;
        gtasRequired: string;
        batchRequired: string;
        itemsMin: string;
        categoriesMin: string;
        animalRequired: string;
        weightRequired: string;
        weightMin: string;
        categoryValueRequired: string;
        /** TASK-VD-FE-04 — mensagens do subfluxo financeiro (rateio/parcelamento),
         *  mirror `farmTransfers.farmTransfer.form.validation`. */
        numberType: string;
        incomeCategoryRequired: string;
        incomeCenterRequired: string;
        incomeValueRequired: string;
        incomeSumMismatch: string;
        installmentsMin: string;
        installmentDateRequired: string;
        installmentValueRequired: string;
        installmentsSumMismatch: string;
      };
      notFoundGuard: string;
      unsavedChanges: {
        title: string;
        message: string;
        confirm: string;
      };
      businessErrorFallback: string;
      invalidFieldsToast: string;
    };
    /** Finalização INDIVIDUAL de abate (TASK-VD-FE-03, contrato §8.1,
     *  `/:uuid/finalizar`, mirror `FinishAppropriation.tsx`). */
    finish: {
      title: string;
      subtitle: string;
      headerSummary: {
        code: string;
        client: string;
        dtSale: string;
        typeSale: string;
      };
      cancel: string;
      submit: string;
      finishedToast: string;
      notPendingGuard: string;
      invalidFieldsToast: string;
    };
    /** Finalização EM LOTE (TASK-VD-FE-03, contrato §8.2,
     *  `/finalizar-lote?ids=`). */
    finishMany: {
      title: string;
      subtitleTemplate: string;
      salesIncludedLabel: string;
      cancel: string;
      submit: string;
      finishedToast: string;
      noIdsGuard: string;
      loadErrorToast: string;
    };
    /** Relatórios PDF (Tarefa 17.a, task-packet §3 — fatia "Relatórios") —
     *  Imprimir + SISBOV Recria/Abate, todos download síncrono via blob. */
    reports: {
      printError: string;
      /** Mensagem própria do 404 esperado dos 2 endpoints SISBOV (venda
       *  válida sem animal SISBOV) — nunca o toast genérico do interceptor. */
      sisbovNotFound: string;
    };
    /** Modal de Documentos (Tarefa 17.b, task-packet §3 — fatia
     *  "Documentos") — `MovementSaleDocumentsModal.tsx`, copy-adapt de
     *  `DocumentoAnexosSection.tsx` com shape próprio (`old_document_uuid`/
     *  `description`/`date`/`file`). */
    documents: {
      title: string;
      /** `{code}` — mesma convenção de `deleteDialog.descriptionTemplate`. */
      titleTemplate: string;
      sectionLabel: string;
      addButton: string;
      emptyLabel: string;
      /** §1.5 do task-packet — 0 linhas nunca é um diff representável em
       *  multipart real (achado B); explica por que o Salvar fica
       *  desabilitado, nunca simula a remoção no cliente. */
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
      /** Confirmação de remoção de linha JÁ PERSISTIDA (§1.4 — apaga o
       *  arquivo físico no servidor). */
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
      /** Mirror da mensagem real da API (`MovementSaleController::
       *  documents()`, §1.6). */
      savedToast: string;
      loadError: string;
      retry: string;
    };
    /** Diálogo de Emitir NFe — HANDOFF (Tarefa 17.c, task-packet §3/§6,
     *  matriz FID-G3F #3) — `MovementSaleEmitNfeDialog.tsx`. `POST
     *  .../nfe-issue` NÃO emite NFe (DEC-022); a confirmação só dispara a
     *  navegação para `/fiscal/nfe-emitidas/novo` com o payload de handoff. */
    emitNfe: {
      title: string;
      /** `{code}` — mesma convenção de `deleteDialog.descriptionTemplate`. */
      confirmDescriptionTemplate: string;
      confirmDescription: string;
      confirmButton: string;
      /** §2.3 — `detail.nfe` já existe (condição `!nfe_id` do legado,
       *  resolvida sem mudança de backend). `{number}` — número da NFe já
       *  vinculada. */
      alreadyIssuedTemplate: string;
      loading: string;
      loadError: string;
    };
  };
}
