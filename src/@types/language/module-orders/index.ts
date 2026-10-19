// src/@types/language/module-orders/index.ts
// -----------------------------------------------------------------------------
// Interface de tradução do módulo "Pedidos" (Order/OrderItem — Operacional /
// Vendas, F-051, 97-Esteiras/043). O conteúdo mora em
// `src/constants/languages/{idioma}/languageOrders.ts`. Molde estrutural
// mirror `module-budgets` (módulo análogo direto), cruzado com
// `CONTRATO-TELA-PEDIDOS-F051.md §7.4` (colunas/filtro/ações) e §6
// (itens/parcelas).
//
// PED-FE-01 (fundação) cobre `list.pageTitle/table/emptyState/deletedToast`,
// `filter`, `form.fields.header`/`form.sections`/`form.validation` MÍNIMA,
// `status` e as options de `hasInput`/`fiscalDocument` — os rótulos
// consumidos pela fundação de dados (options factories + query-key).
// Forma de pagamento é REUSADA de `budgets.budget.paymentMethodOptions`
// (nenhuma duplicação de string). `PED-FE-02..08` ACRESCENTAM os rótulos
// restantes específicos de cada tela dedicada (edição incremental deste
// mesmo arquivo, nunca recriado do zero) — mirror da disciplina já
// documentada em `module-budgets`.
// -----------------------------------------------------------------------------

export interface ModuleOrders {
  order: {
    /** "Pedido" (label do menu, `ope-ven-ped`). */
    singularLabel: string;
    pluralLabel: string;
    titleModule: string;

    list: {
      pageTitle: string;
      table: {
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
          print: string;
          generateSale: string;
          /** SALE-FE-COM-10 (backend em produção desde a execução 043) —
           *  "Gerar Venda" habilitada quando `status < 3 && sales_create`;
           *  este tooltip só é exibido quando desabilitada por `status`
           *  (Finalizado/Cancelado), via `disabledReason` do item de menu. */
          generateSaleTooltip: string;
          /** `status>=2` (fora do gate de edição, PED-FE-02 AM-008). */
          editDisabledTooltip: string;
          /** `status>=2` (fora do gate de exclusão, PED-FE-02 AM-009). */
          deleteDisabledTooltip: string;
        };
      };
      emptyState: {
        titleEmpty: string;
        descriptionEmpty: string;
        titleFiltered: string;
        descriptionFiltered: string;
        cta: string;
      };
      deletedToast: string;
      printErrorToast: string;
      deleteConfirm: {
        title: string;
        description: string;
      };
      /** Estado obrigatório "error (msg+retry)" (contrato-tela §2). */
      error: {
        message: string;
        retry: string;
      };
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
      paginationQuantity: string;
    };

    /** Tela de Visualização (somente-leitura), `OrderDetalhe.tsx`
     *  (PED-FE-06, F-077..F-100) — mirror `module-budgets.detail`. Rótulos
     *  de campo/coluna são REAPROVEITADOS de `list.columns`/`form.fields`
     *  (nenhuma duplicação de string) — este bloco só acrescenta o que não
     *  existe em nenhum dos dois (título de estado vazio/erro, seções,
     *  ações do cabeçalho, gancho de origem de orçamento e datas de
     *  auditoria). */
    detail: {
      notFound: { title: string; description: string; back: string };
      backButton: string;
      editButton: string;
      printButton: string;
      generateSaleButton: string;
      sections: {
        header: string;
        items: string;
        payment: string;
        totals: string;
      };
      emptyItems: string;
      /** Gancho PED-04 (Budget→Order, SURF-046 display-only) — badge
       *  "Origem: Orçamento" exibida só quando `OrderDetail.budget` não é
       *  `null`. Nunca navegação de escrita a partir daqui. */
      originBudgetLabel: string;
      dates: {
        createdAt: string;
        updatedAt: string;
      };
    };

    /** Mirror `OrderStatus` backend — 4 chaves fechadas (1/2/3/9). */
    status: {
      emAberto: string;
      emProcessamento: string;
      finalizado: string;
      cancelado: string;
    };

    /** `has_input` do bloco de parcelas (IG-010, PED-FE-05) — Sim/Não. */
    hasInputOptions: {
      sim: string;
      nao: string;
    };

    /** `fiscal_document` (Dedutível) do bloco de parcelas (PED-FE-05). */
    fiscalDocumentOptions: {
      sim: string;
      nao: string;
    };

    form: {
      title: {
        create: string;
        edit: string;
      };
      sections: {
        header: string;
        items: string;
        payment: string;
      };
      fields: {
        header: {
          code: string;
          user: string;
          date: string;
          client: string;
          note: string;
        };
        /** Rodapé de totais (CV-004..007, PED-FE-03) — todos os 4 sempre
         *  readonly; `freight` tem o INPUT editável próprio fora deste
         *  bloco (mirror `Budgets.form.fields.footer`). */
        footer: {
          subtotal: string;
          freight: string;
          discount: string;
          total: string;
        };
        /** Linha de item (`OrderItemsEditor`/`OrderItemRow`, PED-FE-04,
         *  F-007..F-014, IG-001..IG-009). */
        item: {
          sectionTitle: string;
          product: string;
          productPlaceholder: string;
          um: string;
          quantity: string;
          price: string;
          discount: string;
          discountPercent: string;
          total: string;
          addItem: string;
          removeItem: string;
          /** IG-008 (`LANG.var_preencher_todos_campos`) — bloqueia "Adicionar
           *  item" enquanto alguma linha existente estiver incompleta. */
          addIncompleteError: string;
          /** IG-009 (`LANG.pelo_menos_um`) — bloqueia remover a última linha
           *  restante (sem diálogo, recusa direto, mirror `RomaneioItemsTab`). */
          removeLastError: string;
          /** Confirmação de remoção de linha já preenchida (IG-009,
           *  SweetAlert→`DeleteConfirmDialog`, mirror `RomaneioItemRow`). */
          removeConfirm: {
            title: string;
            description: string;
          };
          /** PED-FE-08 — aria-label do botão "+"/"editar" (`InlineProductModal`)
           *  ao lado do select de produto de cada linha (SURF-020, IG-022). */
          productModal: {
            addAria: string;
            editAria: string;
          };
        };
        /** Bloco de pagamento/cronograma (`OrderPaymentsEditor`/
         *  `OrderInstallmentRow`, PED-FE-05, F-020..F-029, IG-010..014/017).
         *  Campo ÚNICO (não repetível como `Budgets.payments[]`) — `has_input`/
         *  `installments`/`due_date`/`interval`/`fiscal_document` vivem no
         *  NÍVEL do form, sincronizados 1:1 com `installment_details`. */
        payment: {
          sectionTitle: string;
          paymentMethod: string;
          hasInput: string;
          inputDate: string;
          inputValue: string;
          installments: string;
          dueDate: string;
          interval: string;
          fiscalDocument: string;
          installmentsTable: {
            date: string;
            value: string;
          };
          /** IG-013 — recusa de ajuste que zeraria/negativaria a última
           *  parcela (`adjustInstallmentsDifference`, mirror Budget). */
          adjustRefusedToast: string;
        };
      };
      placeholders: {
        header: {
          client: string;
        };
      };
      /** Botão "+"/"editar" ao lado do select de Cliente (`InlineClientModal`,
       *  PED-FE-07, IG-018) — aria-label muda conforme já haja cliente
       *  selecionado (FiEdit) ou não (FiPlus). */
      clientModal: {
        addAria: string;
        editAria: string;
      };
      /** Guarda de navegação com edição não salva (PED-FE-03, mirror
       *  `Budgets.form.unsavedChangesDialog`). */
      unsavedChangesDialog: {
        title: string;
        description: string;
        confirmButton: string;
      };
      /** Onda G (execução 065) — toast do `onInvalid` do `handleSubmit`
       *  (mirror `module-stock-writeoffs`/`module-input-entries`): elimina o
       *  no-op silencioso quando o resolver Yup reprova. */
      errors: {
        invalidFields: string;
      };
      /** Onda G (execução 065) — feedback do early-return "nada mudou" em
       *  edição sem `dirtyFields` (mirror `module-feedlot-sectors.
       *  noChangesToast`); antes era um no-op silencioso equivalente ao do
       *  `onInvalid`. */
      noChangesToast: string;
      validation: {
        clientRequired: string;
        dateRequired: string;
        freightMin: string;
        itemsMin: string;
        itemProductRequired: string;
        itemQuantityRequired: string;
        itemPriceRequired: string;
        /** IG-004 — `discount[]` blur, desconto não pode exceder
         *  `quantity×price` da própria linha (mensagem literal do legado). */
        itemDiscountExceedsTotal: string;
        /** IG-005 — `discount_percent[]` blur, percentual não pode exceder
         *  100 (mensagem literal do legado, typo preservado por fidelidade). */
        itemDiscountPercentMax: string;
        noteMax: string;
        /** Detalhe de cronograma (PED-FE-05) — `.when('has_input')`
         *  condicional de `installment_details`. */
        installmentInputDateRequired: string;
        installmentInputValueRequired: string;
        /** F-020 — `payment_method` obrigatório (submit atômico). */
        paymentMethodRequired: string;
        /** F-024 — `installments` (nº de parcelas) obrigatório, ≥1. */
        installmentsRequired: string;
        /** F-025 — `due_date` (1ª parcela) obrigatório. */
        dueDateRequired: string;
        /** IG-017 — bounds 1900-12-31..2100-12-31 em todo date-picker do
         *  bloco de pagamento (due_date/input_date/first_installment/linhas
         *  do cronograma). */
        installmentDateInvalid: string;
        numberType: string;
      };
    };

    /** Tela "Gerar Venda a partir do Pedido" (`GerarVendaFromOrder.tsx`,
     *  SALE-FE-COM-10, `GET/POST /orders/{uuid}/sale-draft|sales`, backend
     *  já em produção desde a execução 043). Rótulos de cabeçalho/totais/
     *  item da Venda (`dt_sale`, `payment_method`, `icms`, `product`,
     *  `warehouse` etc.) são REUSADOS de `languageGB.sales.sale.form.fields`
     *  (mesmo domínio de campos — a tela cria uma `Sale` de verdade) —
     *  este bloco só acrescenta o que é EXCLUSIVO desta tela derivada do
     *  Pedido (título, resumo do pedido de origem, saldo por item, estados
     *  vazio/erro e validação do teto de saldo). */
    generateSaleScreen: {
      pageTitle: string;
      backButton: string;
      saveButton: string;
      sections: {
        order: string;
        items: string;
      };
      orderFields: {
        code: string;
        client: string;
        status: string;
      };
      item: {
        orderedQuantity: string;
        /** Rótulo do campo LEGADO (saldo do PEDIDO — `remaining_quantity`,
         *  trava de quantidade no `onBlur`). NÃO EXIBIDO NA TELA a partir da
         *  rodada 2 (dono: confunde com estoque real) — chave preservada
         *  porque `onBlur` da Qtd. ainda a usa como texto do toast. */
        remainingQuantity: string;
        /** Rodada 2 (V2) — "Saldo Disponível" REAL: estoque do armazém
         *  selecionado via `GET /stocks/available` (mirror `SaleItemRow`
         *  IG002). Informativo, nunca bloqueia o submit. */
        availableStock: string;
        /** Erro silencioso do lookup de estoque (mirror
         *  `sales.sale.form.fields.item.stockLoadError`). */
        stockLoadError: string;
      };
      emptyEligibleItems: {
        title: string;
        description: string;
      };
      loadError: {
        message: string;
        retry: string;
      };
      successToast: string;
      validation: {
        itemsMin: string;
        /** IG-Q01 — `quantity` da linha não pode exceder `remaining_quantity`
         *  hidratada do `sale-draft` (validação client-side de aviso; o
         *  servidor é a autoridade final, roteiro §2). */
        itemQuantityExceedsRemaining: string;
      };
    };
  };
}
