// src/@types/language/module-stock-writeoffs/index.ts
// Interface de tradução do módulo de BAIXA DE ESTOQUE (StockWriteoff —
// Administrativo). Espelha a convenção de module-correcao-estoque/
// module-service-orders. O conteúdo mora em
// src/constants/languages/{idioma}/languageStockWriteoffs.ts.
//
// Esteira 038, fatia READ — TASK-FE-3001 (fundação, sem tela) + TASK-FE-3002
// (listagem + filtro + exclusão, cobre `list` + `filter`) + TASK-FE-3003
// (visualização read-only, cobre `detail`).
//
// Fatia WRITE — TASK-FE-3004 (form create, cobre `typeOptions` + `form`) +
// TASK-FE-3005 (relatório PDF, cobre `report`) + TASK-FE-3006 (handoff
// "Emitir NFe" parcial, cobre `nfeHandoff` + `list.table.actions.emitNfe` +
// `detail.actions`).

export interface ModuleStockWriteoffs {
  stockWriteoff: {
    singularLabel: string;
    pluralLabel: string;
    list: {
      pageTitle: string;
      pageSubtitle: string;
      /** Botão do cabeçalho da grid que navega para `/relatorio` (TASK-FE-3005,
       *  mirror `SaldoEstoque.list.report`) — rótulo curto, distinto de `report.submit`. */
      reportButton: string;
      table: {
        code: string;
        user: string;
        warehouse: string;
        createdAt: string;
        type: string;
        actions: {
          viewDetail: string;
          delete: string;
          /** TASK-FE-3006 — ação de linha, visível quando `nfe_uuid==null`. */
          emitNfe: string;
        };
      };
      /** Sem CTA de criação nesta fatia READ (a rota de criação — TASK-FE-3004 —
       *  fica fora desta rodada); `cta` fica pronto para quando ela existir. */
      emptyState: {
        title: string;
        description: string;
        titleFiltered: string;
        descriptionFiltered: string;
        cta: string;
      };
      deletedToast: string;
      /** Diálogo de exclusão REFORÇADO (`DeleteConfirmDialog` `tone="danger"`) —
       *  a exclusão restaura o estoque (D2) e não pode ser desfeita. `itemName`
       *  (o `code`) é interpolado pelo próprio componente, não duplicado aqui. */
      deleteDialog: {
        description: string;
        warning: string;
      };
    };
    filter: {
      title: string;
      /** Filtro sobre `created_at` (D7) — NUNCA rotulado como "data da baixa"
       *  (a `date` de referência da própria baixa não é filtrável, contrato de
       *  tela §2.3). */
      startDate: string;
      endDate: string;
      dateRangeInvalid: string;
    };
    /** Visualização (show) read-only — TASK-FE-3003. */
    detail: {
      sections: {
        identification: string;
        items: string;
      };
      fields: {
        code: string;
        type: string;
        typeNote: string;
        createdAt: string;
        user: string;
        warehouse: string;
        justification: string;
      };
      table: {
        product: string;
        quantity: string;
        value: string;
        amount: string;
        lot: string;
      };
      totals: {
        quantity: string;
        amount: string;
      };
      itemsEmpty: {
        title: string;
        description: string;
      };
      notFound: {
        title: string;
        description: string;
        back: string;
      };
      invalidParamsToast: {
        title: string;
        description: string;
      };
      noData: string;
      backButton: string;
      /** TASK-FE-3006 — ação no cabeçalho do detalhe, visível quando `nfe_uuid==null`. */
      actions: {
        emitNfe: string;
      };
    };
    /** Options factory do enum `StockWriteoffTypeEnum` (contrato de tela §2.5,
     *  TASK-FE-3004) — 13 valores fixos, `Select` estático do form de criação. */
    typeOptions: {
      loss: string;
      deterioration: string;
      theft: string;
      damage: string;
      inventory: string;
      accounting: string;
      pettyTheft: string;
      expirationDate: string;
      freeGift: string;
      donation: string;
      others: string;
      consumption: string;
      paymentInProduct: string;
    };
    /** Form de criação (TASK-FE-3004) — cabeçalho + bloco de itens + anexos. */
    form: {
      title: string;
      subtitle: string;
      header: {
        sectionTitle: string;
        /** BAIXA-11 (execução 038, homolog R1) — read-only, prévia via
         *  `GET /stock-writeoffs/next-code`, mirror `ServiceOrder.form.fields.code`. */
        code: string;
        /** BAIXA-11 — read-only, usuário autenticado atual (`useAuth().user`),
         *  mirror `ServiceOrder.form.fields.requester`. */
        user: string;
        date: string;
        /** BAIXA-06 — renomeado de "Tipo" para "Motivo de baixa" (feedback E2E
         *  do dono, homolog R1). */
        type: string;
        typePlaceholder: string;
        /** BAIXA-07a — renomeado de "Observação do tipo" para "Observação"
         *  (feedback E2E do dono, homolog R1). */
        typeNote: string;
        typeNotePlaceholder: string;
        warehouse: string;
        warehousePlaceholder: string;
        justification: string;
        justificationPlaceholder: string;
        costCenter: string;
        costCenterPlaceholder: string;
        costCenterHint: string;
      };
      items: {
        sectionTitle: string;
        addItem: string;
        removeItem: string;
        emptyRow: string;
        stock: string;
        stockPlaceholder: string;
        saldo: string;
        unit: string;
        lot: string;
        quantity: string;
        value: string;
        amount: string;
      };
      attachments: {
        sectionTitle: string;
        addButton: string;
        removeButton: string;
        emptyLabel: string;
        fields: {
          name: string;
          namePlaceholder: string;
          file: string;
        };
        fillBeforeAddError: string;
        /** FLD-020 — default aplicado no mapper quando `file` preenchido e
         *  `name` vazio ("Não Informado"). */
        defaultName: string;
        dropzoneTitle: string;
        dropzoneDraggingTitle: string;
        changeLabel: string;
        removeLabel: string;
        errorTypeMessage: string;
        errorSizeMessage: string;
      };
      footer: {
        cancel: string;
        save: string;
      };
      errors: {
        invalidFields: string;
      };
      createdToast: string;
    };
    /** Relatório PDF (TASK-FE-3005) — filtros → PDF inline em nova aba. */
    report: {
      title: string;
      subtitle: string;
      filters: {
        warehouse: string;
        warehousePlaceholder: string;
        product: string;
        productPlaceholder: string;
        startDate: string;
        endDate: string;
      };
      submit: string;
      openError: string;
    };
    /** Handoff "Emitir NFe" (TASK-FE-3006/exec-038, D-FE-BE-05). Mirror
     *  legado `StockWriteoffController@nfe()`: NAVEGA para a criação de Nfe
     *  já preenchida (`/fiscal/nfe-emitidas/novo`) — SEM modal de vínculo a
     *  uma Nfe existente. `linkedToast`/`POST .../nfe` continuam existindo
     *  no service para uso futuro (gap de auto-vínculo pós-criação,
     *  documentado no handover), mas não são mais acionados por este fluxo. */
    nfeHandoff: {
      button: string;
      alreadyEmittedWarning: {
        title: string;
        description: string;
      };
      draftErrorToast: {
        title: string;
        description: string;
      };
      linkedToast: string;
      autoLinkErrorToast: {
        title: string;
        description: string;
      };
    };
  };
}
