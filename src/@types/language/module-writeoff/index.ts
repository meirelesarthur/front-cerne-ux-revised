// src/@types/language/module-writeoff/index.ts
// Interface de tradução do módulo COMPARTILHADO de Baixa Manual (WriteOff)
// — TASK-FE-036-330. Namespace ISOLADO (não misturado dentro de
// `ModuleIncomes`/`ModuleExpenses`) porque é consumido pelos 2 segmentos
// (Contas a Receber E Contas a Pagar). Conteúdo mora em
// src/constants/languages/{idioma}/languageWriteOff.ts.

export interface ModuleWriteOff {
  /** Modal de criação (Tarefa 331) + lista/cancelamento (Tarefa 332). */
  form: {
    createTitle: string;
    fields: {
      reason: string;
      account: string;
      movementDate: string;
      amount: string;
      discount: string;
      penalty: string;
      interest: string;
      increase: string;
      note: string;
      netValuePreview: string;
      category: string;
      center: string;
      planAccount: string;
      categoryValue: string;
      /** Label do Select estático "Tipo de Baixa" (`TASK-036-GB-07`, 6 opções por segmento). */
      writeoffType: string;
      /** Campo condicional `writeoff_type==='B'` — Título de Adiantamento (mesmo segmento). */
      advanceTitle: string;
      /** Campo condicional `writeoff_type==='D'` — NFe de Devolução (`segment==='expenses'`). */
      nfe: string;
      /** Campo condicional `writeoff_type==='I'` — Conta a Receber cruzada (`segment==='expenses'`). */
      incomeTitle: string;
      /** Campo condicional `writeoff_type==='E'` — Conta a Pagar cruzada (`segment==='incomes'`). */
      expenseTitle: string;
      /** Campo condicional `writeoff_type==='C'` — Fatura (`segment==='expenses'`). */
      cardBill: string;
      /** `InputReadOnly` de saldo — reusado por B/D/I/E/C (`option.balance`, sem round-trip). */
      counterpartBalance: string;
    };
    placeholders: {
      reason: string;
      account: string;
      note: string;
      category: string;
      center: string;
      planAccount: string;
      advanceTitle: string;
      nfe: string;
      incomeTitle: string;
      expenseTitle: string;
      cardBill: string;
    };
    /** Rótulos do Select estático "Tipo de Baixa" — mirror `WriteOffCounterpartType::description()`. */
    counterpartTypeOptions: {
      bankMovement: string;
      crossed: string;
      nfeReturn: string;
      incomeCross: string;
      expenseCross: string;
      cardBill: string;
    };
    /** Sufixo de tooltip da option `I`/`E` desabilitada (`Select.tsx` não expõe tooltip por item). */
    counterpartUnavailableTooltip: string;
    /** Aviso de saldo bancário — SÓ para `segment='expenses'` (Expense debita, Income credita). */
    insufficientBalanceWarning: string;
    apportionmentSectionTitle: string;
    addRowLabel: string;
    removeRowLabel: string;
    removeRowConfirmTitle: string;
    removeRowConfirmDescription: string;
    removeRowBlockedMessage: string;
    emptyLabel: string;
    sumLabel: string;
    validation: {
      accountRequired: string;
      reasonRequired: string;
      movementDateRequired: string;
      amountRequired: string;
      negativeValueNotAllowed: string;
      noteMaxLength: string;
      categoriesRequired: string;
      categoryRequired: string;
      centerRequired: string;
      categoryValueRequired: string;
      categoriesSumMismatch: string;
      writeoffTypeRequired: string;
      advanceTitleRequired: string;
      nfeRequired: string;
      incomeTitleRequired: string;
      expenseTitleRequired: string;
      cardBillRequired: string;
    };
    createdToast: string;
    submitButton: string;
    cancelButton: string;

    /** Modal de baixa EM LOTE (TASK-FE-036-334/335 + correção `GAP-036-114`/
     *  `TASK-FE-036-343` v2.0) — `POST /writeoffs/batch`, 3 modos
     *  (Separado/Único/Baixa Cruzada), Histórico + Documentos no nível do
     *  lote, SEM `reason_uuid`/rateio por título. */
    batch: {
      createTitle: string;
      fields: {
        bankingMovementType: string;
        bankingMovementOption: string;
        crossedWriteOffOption: string;
        writeoffType: string;
        writeoffTypeSeparateOption: string;
        writeoffTypeUniqueOption: string;
        relatedTitle: string;
        /** 1º nível da cascata (`TASK-036-GB-09`) — label em CaP: "Fornecedor c/ Saldo". */
        advancePartyProvider: string;
        /** 1º nível da cascata — label em CaR: "Cliente c/ Saldo" (nunca "Fornecedor" em CaR). */
        advancePartyClient: string;
        /** `InputReadOnly` do 2º nível — saldo do título de adiantamento selecionado. */
        relatedTitleBalance: string;
        documentSectionTitle: string;
        documentDescription: string;
        documentFile: string;
        documentDateFile: string;
      };
      placeholders: {
        relatedTitle: string;
        advanceParty: string;
        documentDescription: string;
      };
      /** Mensagens de guarda client-side (`TASK-036-GB-09` §3) — fora de `validation` porque são
       *  usadas tanto pelo toast imediato quanto pelo `.test` do Yup (mesma string, valor interpolado). */
      errors: {
        relatedTitleBalanceExceeded: string;
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
      tableColumns: {
        titleNumber: string;
        titleBalance: string;
        amount: string;
        discount: string;
        netValue: string;
      };
      footerTotalLabel: string;
      submitButton: string;
      createdToast: string;
      /** Ressalva anexada à mensagem 422 literal da API — reforça que o ROLLBACK é do lote inteiro. */
      atomicRollbackSuffix: string;
      validation: {
        rowsRequired: string;
        rowAmountRequired: string;
        /** Teto client-side `amount <= title_balance` (UT-000111, esteira 064, onda 4) —
         *  mirror da validação real do servidor (`BatchWriteOffAction::processRow()`).
         *  `{balance}` é interpolado (mirror `errors.relatedTitleBalanceExceeded`). */
        rowAmountExceedsBalance: string;
        bankingMovementRequired: string;
        writeoffTypeRequired: string;
        relatedTitleRequired: string;
        descriptionMaxLength: string;
        fileTypeInvalid: string;
        fileSizeExceeded: string;
      };
    };
  };

  /** Lista de baixas ativas + cancelamento (Tarefa 332). */
  list: {
    title: string;
    columns: {
      account: string;
      reason: string;
      movementDate: string;
      amount: string;
      netValue: string;
      note: string;
    };
    emptyState: {
      title: string;
      description: string;
    };
    cancelAction: string;
    cancelConfirmTitle: string;
    cancelConfirmDescription: string;
    cancelledToast: string;
  };
}
