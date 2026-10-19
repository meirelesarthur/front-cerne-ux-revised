// src/@types/language/module-request-receipts/index.ts
// -----------------------------------------------------------------------------
// Interface de tradução do módulo "Recebimentos" (RequestReceipt —
// Administrativo / Suprimentos, esteira 97-Esteiras/040, TASK-RCB-FE-00).
//
// Namespace PRÓPRIO (`requestReceipts`), arquivo DEDICADO — mirror EXATO da
// decisão de estilo já registrada em `module-request-authorizations/index.ts`
// (4º hub da família `RequestPurchase` na SPA, mesma disciplina de isolar em
// arquivo próprio em vez de acrescentar a um módulo vizinho denso).
// `requestReceipt` é uma FATIA nova sobre a MESMA entidade de domínio
// `RequestPurchase`, mas é um recurso HTTP/tela distintos
// (`request-receipts`), por isso o namespace de tradução também é próprio —
// evita colisão de chave com `requestPurchases.requestPurchase`.
//
// `singularLabel`/`pluralLabel` alimentam `queryKey.requestReceipts.*`
// (`src/constants/query-key.ts`, PADRÃO CANÔNICO derivado da tradução,
// `get_pwa_constants_and_mappers_pattern` §6.1) — NÃO reusar
// `queryKey.requestPurchases.*` (recurso HTTP distinto, cache colidiria).
//
// Status (`status_label`) NÃO é reproduzido aqui — Recebimentos reusa o
// MESMO enum `requestPurchaseStatus`/labels `languageGB.requestPurchases.
// requestPurchase.statusOptions.*` já existentes, restrito ao subconjunto
// {7 compraEfetuada, 8 compraRecebida, 9 pedidoFinalizado} (ver
// `@/constants/RequestReceipts/request-receipt-status.ts`) — não cunhar
// tradução nova de status aqui. `type_label`/`priority_label` idem — reusam
// `requestPurchaseTypeOptions`/`requestPurchasePriorityOptions`.
// -----------------------------------------------------------------------------

export interface ModuleRequestReceipts {
  requestReceipt: {
    singularLabel: string;
    pluralLabel: string;
    titleModule: string;
    pageTitle: string;
    pageSubtitle: string;

    // TASK-RCB-FE-01 — listagem (13 colunas, LM-01..13).
    list: {
      table: {
        code: string;
        type: string;
        status: string;
        requestDate: string;
        description: string;
        nfe: string;
        duration: string;
        requester: string;
        responsible: string;
        farm: string;
        updatedOn: string;
        launched: string;
        actions: string;
      };
      launchedYes: string;
      launchedNo: string;
      emptyState: {
        titleEmpty: string;
        titleFiltered: string;
        descriptionEmpty: string;
        descriptionFiltered: string;
      };
    };

    // TASK-RCB-FE-01 — filtro (FM-01..08, Contrato B).
    filter: {
      title: string;
      search: string;
      searchPlaceholder: string;
      status: string;
      dateFrom: string;
      dateTo: string;
      user: string;
      farm: string;
      type: string;
      responsible: string;
    };

    // TASK-RCB-FE-01 — ações de linha (AM-01..08) + diálogo "Voltar Etapa".
    actions: {
      receive: string;
      receiveToast: string;
      view: string;
      sla: string;
      transfer: string;
      confirmReceipt: string;
      financial: string;
      informPayment: string;
      changeStatus: string;
    };

    // TASK-RCB-FE-02 — Confirmar Recebimento.
    confirm: {
      pageTitle: string;
      pageSubtitle: string;
      fields: {
        code: string;
        responsible: string;
        receiptDate: string;
        nfe: string;
        purchaseStatus: string;
        receiptNote: string;
      };
      purchaseStatusOptions: {
        total: string;
        parcial: string;
      };
      items: {
        title: string;
        empty: string;
        columns: {
          description: string;
          quantity: string;
          status: string;
          deliveryDate: string;
        };
      };
      attachments: {
        title: string;
        addButton: string;
        removeButton: string;
        emptyLabel: string;
        fields: {
          name: string;
          file: string;
        };
        removeLastRowError: string;
        fillBeforeAddError: string;
      };
      validation: {
        nfeRequired: string;
        nfeMaxLength: string;
        purchaseStatusRequired: string;
        receiptDateRequired: string;
        receiptNoteMaxLength: string;
        attachmentFileRequiredWhenTotal: string;
        attachmentNameRequiredWithFile: string;
      };
      submitToast: string;
    };

    // TASK-RCB-FE-03 — Gerar Financeiro.
    financial: {
      pageTitle: string;
      pageSubtitle: string;
      fields: {
        vlTotal: string;
        financialNumber: string;
        financialTypeId: string;
        financialProprietaryId: string;
        financialProviderId: string;
        financialNote: string;
        hasInput: string;
        inputValue: string;
        inputDate: string;
        qtdInstallments: string;
        firstInstallment: string;
        intInstallments: string;
        fiscalDocument: string;
        receiptDate: string;
        receiptNote: string;
      };
      placeholders: {
        financialTypeId: string;
        financialProprietaryId: string;
        financialProviderId: string;
      };
      hasInputOptions: {
        yes: string;
        no: string;
      };
      fiscalDocumentOptions: {
        yes: string;
        no: string;
      };
      newProviderButton: string;
      installments: {
        title: string;
        sumLabel: string;
        emptyLabel: string;
        columns: {
          dueDate: string;
          value: string;
        };
      };
      ratio: {
        title: string;
        categoryLabel: string;
        centerLabel: string;
        planAccountLabel: string;
        percentLabel: string;
        valueLabel: string;
        addRowButton: string;
        removeRowButton: string;
        emptyLabel: string;
        sumLabel: string;
        sumWarning: string;
      };
      validation: {
        financialNumberMaxLength: string;
        financialTypeIdRequired: string;
        financialNoteRequired: string;
        financialNoteMaxLength: string;
        hasInputRequired: string;
        inputValueRequired: string;
        inputDateRequired: string;
        qtdInstallmentsRequired: string;
        qtdInstallmentsMin: string;
        firstInstallmentRequired: string;
        vlTotalRequired: string;
        vlTotalPositive: string;
        financialNumberRequired: string;
        providerRequired: string;
        installmentsAndRatioRequired: string;
        ratioTotalDiffers: string;
        ratioCategoryRequired: string;
        ratioCenterRequired: string;
      };
      freezeErrorFallback: string;
      submitToast: string;
    };

    // TASK-RCB-FE-04 — Finalizar Pedido (Informar Pagamento).
    informPayment: {
      pageTitle: string;
      pageSubtitle: string;
      fields: {
        finalDate: string;
        status: string;
        nfe: string;
        finalizationNote: string;
      };
      statusOptions: {
        pedidoFinalizado: string;
      };
      validation: {
        finalDateRequired: string;
        nfeRequired: string;
        nfeMaxLength: string;
      };
      submitToast: string;
    };
  };
}
