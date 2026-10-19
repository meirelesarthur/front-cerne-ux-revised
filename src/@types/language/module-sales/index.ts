// src/@types/language/module-sales/index.ts
// -----------------------------------------------------------------------------
// Interface de tradução do módulo "Vendas COMERCIAL" (Sale/SaleItem — venda de
// PRODUTOS, Operacional / Vendas, 97-Esteiras/043). O conteúdo mora em
// `src/constants/languages/{idioma}/languageSales.ts`. Molde estrutural
// mirror `module-orders` (irmão comercial migrado), cruzado com
// `CONTRATO-TELA-VENDAS-COMERCIAL-FE.md §5/§6/§7`.
//
// CHOKEPOINT (decisão do contrato de tela §10 — divergente da disciplina de
// `module-orders`): esta Tarefa (SALE-FE-COM-01) adiciona o namespace `sales`
// COMPLETO de uma vez — inclusive os rótulos consumidos por `06` (handoff
// NFe) e `07`/`08` (adiantamento + rateio) — para NENHUMA Tarefa posterior
// reeditar este arquivo (nem `index.d.ts`, nem os 3 `languageXxx.ts`).
// -----------------------------------------------------------------------------

export interface ModuleSales {
  sale: {
    /** "Venda" (label do menu, `ope-ven-ven`). */
    singularLabel: string;
    pluralLabel: string;
    titleModule: string;

    list: {
      pageTitle: string;
      table: {
        columns: {
          status: string;
          code: string;
          dtShipping: string;
          dtSale: string;
          client: string;
          user: string;
          total: string;
          nfe: string;
          actions: string;
        };
        actions: {
          view: string;
          edit: string;
          delete: string;
          generateNfe: string;
          advanceIncome: string;
          editDisabledTooltip: string;
          deleteDisabledTooltip: string;
          generateNfeDisabledTooltip: string;
          /** RBAC `nfe_create` ausente — item VISÍVEL (some só quando
           *  `nfe != null`) mas desabilitado com este Tooltip, SALE-FE-COM-06. */
          generateNfePermissionTooltip: string;
          advanceIncomeDisabledTooltip: string;
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
      deleteConfirm: {
        title: string;
        description: string;
      };
      /** Fallback de mensagem de negócio (`422` das guardas fail-closed de
       *  `update`/`destroy` — NFe vinculada / Income vinculado, contrato-api
       *  §8 DEC-03) quando o servidor não devolve `message` utilizável. */
      businessErrorFallback: string;
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

    /** Mirror `SaleStatus` backend — 3 chaves fechadas (1/2/9). */
    status: {
      aguardandoEmissaoNfe: string;
      fechado: string;
      cancelado: string;
    };

    /** Tela de Visualização (somente-leitura), `SaleDetalhe.tsx`
     *  (SALE-FE-COM-05) — mirror `module-orders.detail`. */
    detail: {
      notFound: { title: string; description: string; back: string };
      backButton: string;
      editButton: string;
      generateNfeButton: string;
      advanceIncomeButton: string;
      sections: {
        header: string;
        items: string;
        totals: string;
      };
      emptyItems: string;
      nfeLabel: string;
      originOrderLabel: string;
      dates: {
        createdAt: string;
        updatedAt: string;
      };
    };

    form: {
      title: {
        create: string;
        edit: string;
      };
      sections: {
        header: string;
        items: string;
        totals: string;
      };
      fields: {
        header: {
          code: string;
          user: string;
          client: string;
          dtSale: string;
          dtShipping: string;
          dueDate: string;
          paymentMethod: string;
          transporter: string;
          proprietary: string;
          driver: string;
          note: string;
        };
        /** Rodapé de totais (CV002-CV004, SALE-FE-COM-03) — `subtotal`/
         *  `discount`/`total` sempre readonly; `icms`/`freight`/
         *  `other_values` são inputs editáveis (mirror `Orders.form.fields.footer`). */
        footer: {
          subtotal: string;
          icms: string;
          freight: string;
          otherValues: string;
          discount: string;
          total: string;
        };
        /** Linha de item (`SaleItemsEditor`/`SaleItemRow`, SALE-FE-COM-04,
         *  contrato-tela §6.1). */
        item: {
          sectionTitle: string;
          warehouse: string;
          warehousePlaceholder: string;
          /** Opção vazia do Select de Armazém (`trad.var_sem_estoc`). */
          noStockOption: string;
          product: string;
          productPlaceholder: string;
          qtdStock: string;
          um: string;
          quantity: string;
          price: string;
          discount: string;
          discountPercent: string;
          total: string;
          note: string;
          addItem: string;
          /** IG010 — "Adicionar item" recusa clonar quando a linha anterior
           *  está incompleta (produto+qtd+preço), mirror `Orders`. */
          addIncompleteError: string;
          removeItem: string;
          /** IG011/PARADA-3 — remover a ÚLTIMA linha recusa direto, sem
           *  diálogo (mín. 1 linha sempre). */
          removeLastError: string;
          /** Confirmação de remoção de linha (`D012`/`IG011`, PARADA-3 —
           *  add+remove habilitados nos dois modos). */
          removeConfirm: {
            title: string;
            description: string;
          };
          /** Erro do lookup de estoque (IG002) — aviso DISCRETO, nunca
           *  bloqueia o form (contrato-tela §"Estados de UI"). */
          stockLoadError: string;
        };
      };
      placeholders: {
        header: {
          client: string;
        };
      };
      unsavedChangesDialog: {
        title: string;
        description: string;
        confirmButton: string;
      };
      validation: {
        dtSaleRequired: string;
        dtShippingRequired: string;
        clientRequired: string;
        paymentMethodRequired: string;
        driverMax: string;
        noteMax: string;
        itemProductRequired: string;
        itemQuantityRequired: string;
        itemPriceRequired: string;
        /** IG005 (SALE-FE-COM-04) — `discount[]` blur, desconto não pode
         *  exceder `quantity×price` da própria linha. */
        itemDiscountExceedsTotal: string;
        /** IG006 (SALE-FE-COM-04) — percentual nunca pode exceder 100
         *  (UI puro, não persistido). */
        itemDiscountPercentMax: string;
        /** IG007 — `quantity > qtd_stock`, mensagem fiel ao Swal legado
         *  (`_card-item.blade.php`). Placeholders `{informed}`/
         *  `{available}` substituídos via `.replace()` (mirror
         *  `Separations`/`Nascimentos`). */
        itemQuantityExceedsStockTemplate: string;
        /** IG007 aditivo (`D003` corrigido) — `qtd_stock - quantity <
         *  min_stock`, aviso funcional (dado morto no legado). */
        itemMinStockWarning: string;
        itemsMin: string;
        numberType: string;
      };
    };

    /** Handoff fiscal (`nfe-draft` → form fiscal → `nfe-emit`, SE007/SE008,
     *  SALE-FE-COM-06). */
    nfeHandoff: {
      menuLabel: string;
      dialogTitle: string;
      dialogDescription: string;
      confirmButton: string;
      cancelButton: string;
      errorToast: string;
      successToast: string;
    };

    /** Adiantamento (`Income` polimórfico + rateio, SALE-FE-COM-07/08,
     *  `SaleAdvanceIncome.tsx`/`SaleAdvanceIncomeAllocation.tsx`, mirror
     *  `movementSales.movementSale.financial`). */
    advanceIncome: {
      menuLabel: string;
      pageTitle: string;
      backButton: string;
      saveButton: string;
      fields: {
        saleCode: string;
        client: string;
        balanceAvailable: string;
        dueDate: string;
        typeTitle: string;
        /** `FM006` — número do título (obrigatório, `maxLength=14`). */
        number: string;
        proprietary: string;
        /** Rótulo do campo FIXO readonly (`payment_type=4`), exibido só
         *  como `InputReadOnly` — nunca um Select real (legado). */
        paymentType: string;
        /** Valor FIXO exibido em `InputReadOnly` (`payment_type=4`, nunca
         *  editável/enviado como Select). */
        paymentTypeFixedValue: string;
        installments: string;
        /** Valor FIXO exibido em `InputReadOnly` (`installment=qtd_
         *  installments=1`, sempre 1 parcela única). */
        installmentsFixedValue: string;
        amount: string;
        dtEmission: string;
        fiscalDocument: string;
        note: string;
        discount: string;
        penalty: string;
        interest: string;
        percInterest: string;
        increase: string;
      };
      allocation: {
        sectionTitle: string;
        sectionHint: string;
        category: string;
        categoryPlaceholder: string;
        costCenter: string;
        costCenterPlaceholder: string;
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
      validation: {
        valueRequired: string;
        categoryRequired: string;
        centerRequired: string;
        sumMismatch: string;
        numberType: string;
        /** `FM006` — validações do título (SALE-FE-COM-07). */
        numberRequired: string;
        numberMax: string;
        typeTitleRequired: string;
        amountRequired: string;
        dtEmissionRequired: string;
        dueDateRequired: string;
        noteRequired: string;
        noteMax: string;
      };
      successToast: string;
      errorToast: string;
    };
  };
}
