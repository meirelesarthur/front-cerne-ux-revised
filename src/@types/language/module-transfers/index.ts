// src/@types/language/module-transfers/index.ts
// -----------------------------------------------------------------------------
// Interface de tradução do módulo de ROMANEIOS (Transfer — venda/colheita
// manual, Operacional). Espelha a convenção de module-work-teams/
// module-invoices. O conteúdo mora em
// src/constants/languages/{idioma}/languageTransfers.ts.
//
// Namespace `transfers` — LIVRE (front-contract-romaneios.md §1.3): o único
// homônimo distante é `queryKey.saas.invoices`, de outro domínio, sem
// relação. Diferente de Equipes, não há colisão a documentar aqui.
//
// TASK-TRF-FE-01 cobre `list` + `filter` + `search` + `deleteDialog` +
// `badges` + os 7 blocos de opções de enum (§7.5 do contrato de tela,
// GAP-TRF-FE-13). TASK-TRF-FE-02 acrescenta `form` (casca de abas + aba
// Cabeçalho). TASK-TRF-FE-03 acrescenta `form.itemRow` (repeater de itens +
// cascata produto→UM, contrato §5.4) e `form.totals` (bloco de totais,
// contrato §5.5). TASK-TRF-FE-04 acrescenta `form.expenseRow` (repeater de
// despesas acessórias, contrato §5.6) — `expensesStub` é REMOVIDO (a aba
// deixa de ser stub). `detail` fica para TASK-TRF-FE-05 (visualização).
// -----------------------------------------------------------------------------

export interface ModuleTransfers {
  transfer: {
    singularLabel: string;
    pluralLabel: string;
    list: {
      pageTitle: string;
      pageSubtitle: string;
      deletedToast: string;
      table: {
        status: string;
        code: string;
        dtShipping: string;
        dtSale: string;
        nfe: string;
        /** Traço quando `nfe` vier vazio (armadilha #7 da Tarefa). */
        nfeEmpty: string;
        total: string;
        responsible: string;
        type: string;
        originLock: string;
      };
      actions: {
        view: string;
        edit: string;
        delete: string;
        /** Tooltip do botão desabilitado — motivo genérico (a badge/banner
         *  específico fica em `badges.*Tooltip`, esta chave é o prefixo
         *  comum "Editar"/"Excluir" desabilitados). */
        finish: string;
        finishDisabledTooltip: string;
        editDisabledTooltip: string;
        deleteDisabledTooltip: string;
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
    /** Busca por número — SEPARADA do drawer de filtro (GAP-TRF-FE-06):
     *  igualdade exata em `code`, campo numérico, NUNCA busca textual. */
    search: {
      label: string;
      placeholder: string;
      /** Hint exibido quando o conteúdo digitado não é um inteiro — a tela
       *  NÃO dispara request nesse caso. */
      invalidHint: string;
    };
    filter: {
      title: string;
      product: string;
      client: string;
      responsible: string;
      proprietary: string;
      type: string;
      typeAll: string;
      status: string;
      statusAll: string;
      financial: string;
      financialAll: string;
      financialOptions: {
        yes: string;
        no: string;
      };
      startDate: string;
      endDate: string;
    };
    /** Diálogo de exclusão — cópia literal herdada do design system `cerne`
     *  (front-contract-romaneios.md §2.5). `descriptionTemplate` contém o
     *  placeholder `{code}`, interpolado na tela antes de ir ao componente. */
    deleteDialog: {
      title: string;
      descriptionTemplate: string;
    };
    /** Coluna "Origem/Trava" (badges compactos) + banners de imutabilidade
     *  espelhados no formulário/visualização (GAP-TRF-FE-05, contrato de
     *  tela §4.6) — declarados aqui para reuso nas 3 telas. */
    badges: {
      fiscalDocument: string;
      financialPosting: string;
      fromCharge: string;
      fromWeighing: string;
      fiscalDocumentBanner: string;
      financialPostingBanner: string;
      fromChargeBanner: string;
      fromWeighingBanner: string;
      saleContractLegacyBanner: string;
    };
    /** Mensagens de erro de negócio (422) que a tela precisa reconhecer
     *  literalmente para exibir com defesa em profundidade (contrato de
     *  tela §4.5, §4.6). */
    businessErrors: {
      updateBlockedFiscalDocument: string;
      updateBlockedFinancialPosting: string;
      deleteBlockedFiscalDocument: string;
      deleteBlockedFinancialPosting: string;
      genericRetry: string;
    };
    /** 7 catálogos de enum replicados no cliente (contrato de tela §7.5,
     *  GAP-TRF-FE-13) — consumidos por `src/constants/transfers/options/`. */
    typeOptions: {
      sale: string;
      harvest: string;
    };
    statusOptions: {
      pending: string;
      finished: string;
    };
    paymentTypeOptions: {
      cash: string;
      check: string;
      creditCard: string;
      debitCard: string;
      storeCredit: string;
      foodVoucher: string;
      mealVoucher: string;
      giftVoucher: string;
      fuelVoucher: string;
      tradeBill: string;
      bankSlip: string;
      bankDeposit: string;
      pix: string;
      noPayment: string;
      other: string;
    };
    paymentIndicatorOptions: {
      cash: string;
      term: string;
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
    /** Casca de abas + aba Cabeçalho (TASK-TRF-FE-02, contrato de tela
     *  §5.1-§5.3) + Aba Itens/Totais (TASK-TRF-FE-03, `itemRow`/`totals`) +
     *  Aba Despesas acessórias (TASK-TRF-FE-04, `expenseRow`, contrato §5.6). */
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
      sections: {
        general: string;
        billing: string;
        items: string;
        totals: string;
      };
      fields: {
        dtSale: string;
        dtShipping: string;
        dueDate: string;
        type: string;
        client: string;
        user: string;
        seller: string;
        commission: string;
        nfe: string;
        paymentTerm: string;
        typePayment: string;
        paymentIndicator: string;
        typeTitle: string;
        transporter: string;
        proprietary: string;
        driver: string;
        fiscalDocument: string;
        note: string;
      };
      placeholders: {
        type: string;
        client: string;
        user: string;
        seller: string;
        paymentTerm: string;
        typePayment: string;
        paymentIndicator: string;
        typeTitle: string;
        transporter: string;
        proprietary: string;
      };
      hints: {
        /** 403 gracioso em satélite OPCIONAL (`providers/options`/
         *  `proprietaries/options`, GAP-TRF-FE-14) — select desabilitado. */
        satelliteForbidden: string;
        dueDateAuto: string;
      };
      /** 403 em satélite OBRIGATÓRIO (`clients`/`users`/`payment-terms`) —
       *  banner de erro no topo + botão Salvar desabilitado (GAP-TRF-FE-14). */
      requiredSatelliteError: {
        clients: string;
        users: string;
        paymentTerms: string;
      };
      validation: {
        driverMaxLength: string;
        nfeMaxLength: string;
        commissionMin: string;
        invalidDate: string;
      };
      errors: {
        invalidFields: string;
      };
      businessErrorFallback: string;
      unsavedChanges: {
        title: string;
        message: string;
        confirm: string;
      };
      /** Repeater de itens (TASK-TRF-FE-03, contrato §5.4/§5.4.1/§5.4.2). */
      itemRow: {
        fields: {
          warehouse: string;
          noStock: string;
          product: string;
          measurement: string;
          package: string;
          lot: string;
          quantity: string;
          amount: string;
          totalAmount: string;
          discardKg: string;
          discardPercentage: string;
          area: string;
          note: string;
        };
        placeholders: {
          warehouse: string;
          product: string;
          measurement: string;
          package: string;
          area: string;
        };
        /** Hint de conversão para a UM secundária (§5.4.1) — `{value}`/`{unit}`
         *  interpolados na tela antes de exibir. */
        conversionHintTemplate: string;
        noStockHint: string;
        addButton: string;
        removeButton: string;
        removeConfirm: {
          title: string;
          message: string;
        };
        /** 2 mensagens literais do legado (contrato §2.5, armadilha #13/#DoD). */
        addIncompleteError: string;
        removeLastError: string;
        validation: {
          quantityRequired: string;
          quantityMin: string;
          amountRequired: string;
          amountMin: string;
          lotMaxLength: string;
          discardKgMin: string;
        };
      };
      /** Bloco de totais — prévia read-only (TASK-TRF-FE-03, contrato §5.5). */
      totals: {
        fields: {
          totalProducts: string;
          icms: string;
          freight: string;
          othersValues: string;
          discount: string;
          funruralPercentage: string;
          funrural: string;
          total: string;
        };
        /** Texto LITERAL do legado — trava `funrural ≤ total_products`. */
        funruralMaxMessage: string;
      };
      /** Repeater de despesas acessórias (TASK-TRF-FE-04, contrato §5.6). */
      expenseRow: {
        fields: {
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
        };
        placeholders: {
          type: string;
          reversal: string;
          service: string;
          warehouse: string;
          product: string;
          provider: string;
          whoPay: string;
          apropriation: string;
        };
        /** Aba renderizada só sob `canAny(['service_view','reversal_view'])`
         *  (contrato §5.6/§"Tela-Rota") — texto do repeater vazio. */
        emptyState: string;
        addButton: string;
        removeButton: string;
        removeConfirm: {
          title: string;
          message: string;
        };
        /** `option.use_kg === true` no estorno/serviço escolhido — sem
         *  auto-preenchimento de quantidade (armadilha #12). */
        useKgHint: string;
        /** GAP-TRF-09/armadilha #2 — despesa existente cujo `warehouse`/
         *  `service_reversal` não veio na resposta (defesa em profundidade). */
        unknownFieldHint: string;
        /** 403 gracioso em `providers/options` (GAP-TRF-FE-14) — reuso do
         *  mesmo texto de `hints.satelliteForbidden` não é possível aqui
         *  (namespace próprio do repeater); string dedicada. */
        providerForbiddenHint: string;
        validation: {
          quantityRequired: string;
          quantityMin: string;
          vlUnitRequired: string;
          vlUnitMin: string;
        };
      };
      notFound: string;
    };
    finish: {
      title: string;
      subtitle: string;
      cancelButton: string;
      submitButton: string;
      successToast: string;
      itemsSectionTitle: string;
      deliveryQuantityLabel: string;
      validation: {
        deliveryQuantityRequired: string;
        deliveryQuantityMin: string;
      };
    };
    /** Tela de Visualização (read-only), TASK-TRF-FE-05, contrato de tela §6.
     *  Reusa deliberadamente `list.actions.edit`/`editDisabledTooltip`,
     *  `form.backButton`, `form.notFound` (título), `form.fields.*`,
     *  `form.tabs.header`/`form.tabs.expenses`, `form.sections.items`/
     *  `form.sections.totals`, `form.itemRow.fields.*`,
     *  `form.expenseRow.fields.*`/`emptyState` e `form.totals.fields.*` — só
     *  os 3 pontos genuinamente NOVOS desta Tarefa vivem aqui (FC-TYPE-06). */
    detail: {
      notFound: {
        /** Complementa `form.notFound` (usado como título). */
        description: string;
        back: string;
      };
      fields: {
        /** `TransferDetail.serie` — read-only, `FC-TYPE-06` (Resource expõe,
         *  Request não aceita). Só aparece aqui. */
        serie: string;
        /** `TransferDetail.salesman` — idem `serie`. Rótulo deliberadamente
         *  distinto de `form.fields.seller` ("Vendedor") para não confundir
         *  com o satélite `seller_uuid` do formulário. */
        salesman: string;
        /** `sale_contract_id_legacy` — exibido como INFORMAÇÃO de vínculo
         *  (armadilha #4 da Tarefa), nunca como link. */
        saleContractLegacy: string;
      };
    };
  };
}
