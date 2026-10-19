// src/@types/language/module-budgets/index.ts
// -----------------------------------------------------------------------------
// Interface de tradução do módulo "Orçamentos" (Budget/BudgetItem/BudgetPayment
// — Operacional / Vendas, F-018, 97-Esteiras/054). O conteúdo mora em
// `src/constants/languages/{idioma}/languageBudgets.ts`. Molde estrutural
// mirror `module-requisitions`/`module-request-quotations`, cruzado com
// `budgets-frontend-contract.md §5` (contrato por tela).
//
// TASK-BG-FE-01 (fundação) cobre `list.columns`/`list.actions`/`filter`/
// `statusOptions`/`paymentMethodOptions`/`form.fields`/`form.validation` —
// os rótulos MÍNIMOS consumidos pela fundação de dados (options factories +
// schema). Nenhuma tela própria aqui. `TASK-BG-FE-02..06` ACRESCENTAM os
// rótulos restantes específicos de cada tela dedicada (edição incremental
// deste mesmo arquivo, nunca recriado do zero) — mirror da disciplina já
// documentada em `module-fechamento-semana`.
// -----------------------------------------------------------------------------

export interface ModuleBudgets {
  budget: {
    /** "Orçamento" (label do menu, `ope-ven-orc`). */
    singularLabel: string;
    pluralLabel: string;
    titleModule: string;

    list: {
      columns: {
        status: string;
        code: string;
        date: string;
        client: string;
        user: string;
        total: string;
        actions: string;
      };
      actions: {
        view: string;
        edit: string;
        delete: string;
        whatsapp: string;
        email: string;
        report: string;
        copyLink: string;
      };
      emptyState: {
        titleEmpty: string;
        descriptionEmpty: string;
        titleFiltered: string;
        descriptionFiltered: string;
        cta: string;
      };
      deletedToast: string;
      copyLinkToast: string;
      emailToast: string;
      /** GAP-BG-FE-07 (TASK-BG-FE-02) — toasts de erro dos 3 handlers
       *  GET+efeito-colateral da listagem (mirror `documentErrorToast` de
       *  `module-requisitions`). */
      reportErrorToast: string;
      whatsappErrorToast: string;
      copyLinkErrorToast: string;
    };

    filter: {
      title: string;
      search: string;
      searchPlaceholder: string;
      product: string;
      productPlaceholder: string;
      client: string;
      clientPlaceholder: string;
      startDate: string;
      endDate: string;
    };

    /** Tela de Visualização (somente-leitura), `BudgetDetalhe.tsx`
     *  (TASK-BG-FE-05) — mirror `module-invoices`/`module-requisitions`
     *  quanto à forma (`detail.*`). Rótulos de campo/coluna são
     *  REAPROVEITADOS de `list.columns`/`list.actions`/`form.fields`
     *  (nenhuma duplicação de string) — este bloco só acrescenta o que não
     *  existe em nenhum dos dois (título, estado vazio/erro, seções,
     *  rótulo do selo "selecionado na aprovação"). */
    detail: {
      invalidParamsToast: { title: string; description: string };
      notFound: { title: string; description: string; back: string };
      backButton: string;
      sections: {
        header: string;
        items: string;
        payments: string;
        totals: string;
      };
      emptyItems: string;
      emptyPayments: string;
      isSelectedLabel: string;
    };

    /** Mirror `RequestQuotationStatus.statusOptions` — 4 chaves fechadas
     *  (`budgetStatus`, `BudgetStatus` backend). */
    statusOptions: {
      aguardandoEnvio: string;
      enviado: string;
      confirmado: string;
      negado: string;
    };

    /** Catálogo SEFAZ fechado (`budgetPaymentMethod`), 14 chaves. */
    paymentMethodOptions: {
      dinheiro: string;
      cheque: string;
      cartaoCredito: string;
      cartaoDebito: string;
      creditoLoja: string;
      valeAlimentacao: string;
      valeRefeicao: string;
      valePresente: string;
      valeCombustivel: string;
      duplicataMercantil: string;
      boletoBancario: string;
      depositoBancario: string;
      pix: string;
      semPagamento: string;
      outros: string;
    };

    form: {
      title: {
        create: string;
        edit: string;
      };
      /** Guarda de saída sem salvar (`useUnsavedChangesGuard`) — mirror
       *  `module-plannings`/`module-breeding-batch`. */
      unsavedChangesDialog: {
        title: string;
        description: string;
        confirmButton: string;
      };
      /** AJUSTE #4 (homologação) — botão único criar/editar Produto ao lado
       *  do select de cada linha de item, mirror EXATO
       *  `module-sale-contracts.form.actions.{add,edit}ProductAria`. */
      actions: {
        addProductAria: string;
        editProductAria: string;
      };
      fields: {
        header: {
          code: string;
          /** Readonly decorativo (usuário logado) — mirror `header.user` de
           *  `Requisitions` (`CreateRequisition.tsx`). NUNCA registrado no
           *  RHF/schema/payload (`user_id` é NAO_APLICAVEL como input,
           *  `budgets-api-contract.md §2.3`). */
          user: string;
          date: string;
          client: string;
          note: string;
        };
        item: {
          sectionTitle: string;
          product: string;
          unit: string;
          quantity: string;
          amount: string;
          discount: string;
          total: string;
          addItem: string;
          removeItem: string;
        };
        footer: {
          subtotal: string;
          freight: string;
          discount: string;
          total: string;
        };
        payment: {
          sectionTitle: string;
          paymentMethod: string;
          installments: string;
          interval: string;
          dueDate: string;
          amount: string;
          total: string;
          addPayment: string;
          removePayment: string;
          /** Estado vazio (`fields.length === 0`, mirror `itemText`
           *  equivalente em `BudgetItemsEditor`), TASK-BG-FE-04. */
          emptyLabel: string;
          /** Rodapé indicativo Σ `payments.total` × `Budget.total`
           *  (badge, mirror `MovementPurchaseInstallmentsSection`) — NÃO
           *  bloqueia submit, só reduz chance de 422 (`GAP-BG-04`). */
          sumLabel: string;
          sumHint: string;
          installmentDetails: {
            /** Título do bloco financeiro condicional (`installments>1`,
             *  IG-05), TASK-BG-FE-04. */
            sectionTitle: string;
            hasInput: string;
            inputDate: string;
            inputValue: string;
            qtdInstallments: string;
            firstInstallment: string;
            intInstallments: string;
            fiscalDocument: string;
            installmentsTable: {
              date: string;
              value: string;
            };
            /** Toast do `adjustInstallmentsDifference` recusado (IG-10) —
             *  edição que zeraria/negativaria a última parcela. */
            adjustRefusedToast: string;
          };
        };
      };
      validation: {
        clientRequired: string;
        dateRequired: string;
        freightMin: string;
        itemsMin: string;
        itemProductRequired: string;
        itemQuantityRequired: string;
        itemAmountRequired: string;
        itemDiscountExceedsTotal: string;
        paymentsMin: string;
        paymentMethodRequired: string;
        paymentInstallmentsRequired: string;
        paymentIntervalRequired: string;
        paymentDueDateRequired: string;
        paymentTotalRequired: string;
        installmentInputDateRequired: string;
        installmentInputValueRequired: string;
        installmentQtdRequired: string;
        installmentFirstRequired: string;
        numberType: string;
      };
    };

    /** Página PÚBLICA de aprovação por hash (`/orcamento-aprovacao/:hash`,
     *  TASK-BG-FE-06), mirror ESTRUTURAL de
     *  `requestQuotations.requestQuotation.publicForm`. Rótulos de
     *  coluna/campo (cliente/itens/pagamentos/totais) são REAPROVEITADOS de
     *  `list.columns`/`detail.sections`/`detail.emptyItems`/
     *  `detail.emptyPayments`/`form.fields.item`/`form.fields.payment`/
     *  `form.fields.footer` (nenhuma duplicação de string) — este bloco só
     *  acrescenta o que não existe em nenhum dos dois: título/estados da
     *  página pública, seleção de pagamento e ação Aprovar/Negar. */
    publicForm: {
      pageTitle: string;
      loadingState: string;
      notFoundState: { title: string; description: string };
      rateLimitedError: string;
      loadErrorState: { title: string; description: string; retry: string };
      /** Banner "Orçamento Respondido" (mirror CB-52) — `status > 2`. */
      alreadyAnsweredState: { title: string; description: string };
      clientLabel: string;
      paymentSelection: {
        title: string;
        label: string;
        placeholder: string;
        requiredError: string;
      };
      approveButton: string;
      denyButton: string;
      approveSuccessToast: string;
      denySuccessToast: string;
      /** Fallback genérico — a mensagem literal do backend (`BusinessRuleException`,
       *  ex. "Orcamento já finalizado", SV-03) sempre vence quando presente. */
      errorFallback: string;
    };
  };
}
