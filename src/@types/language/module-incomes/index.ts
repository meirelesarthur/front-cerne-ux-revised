// src/@types/language/module-incomes/index.ts
// Interface de tradução do módulo "Contas a Receber" (Income — Financeiro,
// execução 036, TASK-FE-036-310). Arquivo NOVO e independente, mirror
// estrutural de `module-accounts`/`module-cost-centers` (canônico). Conteúdo
// mora em src/constants/languages/{idioma}/languageIncomes.ts.

export interface ModuleIncomes {
  income: {
    singularLabel: string;
    pluralLabel: string;

    /** Tela de LISTAGEM (grid) — TASK-FE-036-311/318. */
    list: {
      pageTitle: string;
      pageSubtitle: string;
      /** DEC-115 (TASK-FE-036-344, §2/§4, mirror `TASK-FE-036-125`) — toggle
       *  "Ver títulos de todas as fazendas" no header da grid (fora do
       *  drawer de filtro). */
      allFarmsToggle: {
        label: string;
        description: string;
      };
      columns: {
        number: string;
        code: string;
        type: string;
        client: string;
        proprietary: string;
        harvest: string;
        installment: string;
        /** TASK-FE-036-321 (FID-G3F LM11) — `dt_emission`, mirror `dueDate`. */
        dtEmission: string;
        dueDate: string;
        amount: string;
        balance: string;
        status: string;
        /** LM12 (TASK-FE-036-333) — indicador booleano de "tem baixa" (mirror `is_locked`, sem N+1 na grid). */
        hasWriteOff: string;
        /** LM01 (TASK-FE-036-339) — indicador de anexos (`documents_count`), célula vazia quando `0`, ícone quando `>0`. */
        documentsCount: string;
        /** DEC-115 (TASK-FE-036-344, §7, condicionado a TASK-BE-036-318) —
         *  coluna visível só quando `paginatedQuery.filter?.all_farms===true`. */
        farm: string;
      };
      /**
       * Rótulos do status derivado no cliente (§5.1 do contrato — NUNCA
       * devolvido pronto pelo backend). TASK-FE-036-322 — 6 estados (ramo
       * próprio para Adiantamento).
       */
      statusLabels: {
        vencido: string;
        parcial: string;
        aberto: string;
        baixado: string;
        adiantamento_aberto: string;
        adiantamento_baixado: string;
      };
      actions: {
        view: string;
        edit: string;
        delete: string;
        toggleFiscalDocument: string;
        /** AM09 (TASK-FE-036-333) — abre o `WriteOffCreateModal` compartilhado. */
        writeOff: string;
        /** AM06 (TASK-FE-036-339) — abre o `DocumentPanel` compartilhado (Drawer). */
        documents: string;
        /** AM11 (TASK-FE-036-320, B-11) — item de menu "Duplicar", busca o
         *  draft (`GET /incomes/{uuid}/duplicate`) e navega para a criação
         *  pré-preenchida (mirror `ModuleFinancial.expense.list.actions.duplicate`). */
        duplicate: string;
        /** Toast de erro quando a busca do draft falha (ex.: título excluído
         *  entre listar e clicar) — fallback só usado quando o backend não
         *  devolve mensagem própria. */
        duplicateError: string;
        /** B-12 (TASK-FE-036-B12-CAR) — item de menu "Gerar Recibo", baixa o
         *  PDF do recibo do título (`GET /incomes/{uuid}/receipt`) via
         *  `downloadBlob` (mirror `handleDownloadDanfe`). */
        receipt: string;
        /** Toast de erro quando o download do recibo falha (403/404/500). */
        receiptError: string;
      };
      /** LM12 (TASK-FE-036-333) — indicador booleano de "tem baixa" na grid (mirror `is_locked`). */
      hasWriteOffLabel: string;
      emptyState: {
        titleEmpty: string;
        descriptionEmpty: string;
        titleFiltered: string;
        descriptionFiltered: string;
        cta: string;
      };
      noFarmSelected: {
        title: string;
        description: string;
      };
      deleteConfirm: {
        title: string;
        description: string;
        warning: string;
      };
      deletedToast: string;
      /** Seleção múltipla + exclusão em lote (GAP-FE-036-304, TASK-FE-036-318). */
      bulk: {
        selectAllLabel: string;
        selectRowLabel: string;
        selectedCountLabel: string;
        deleteButton: string;
        confirmTitle: string;
        confirmDescription: string;
        /** Ressalva de adiantamento na exclusão múltipla (§4.5 do contrato). */
        advanceWarning: string;
        deletedToast: string;
        /** Baixa em lote (AM16, TASK-FE-036-336) — mesma seleção da exclusão em lote. */
        writeOffButton: string;
        /** Aviso de revalidação de elegibilidade no clique (UT-000111, esteira 064,
         *  onda 4) — mirror `financial.expense.list.bulk.writeOffIneligibleWarningSuffix`. */
        writeOffIneligibleWarningSuffix: string;
      };
      toggleFiscalDocumentError: string;
      /** Import/Export de planilha (esteira 036, Onda 3 sub-onda 3e, B-08) —
       *  consumido por `components/ImportExport/ImportExportActions.tsx`
       *  (COMPARTILHADO com `ModuleFinancial.expense.list.excel`, mesma forma). */
      excel: {
        downloadTemplate: string;
        export: string;
        downloadTemplateError: string;
        exportError: string;
        import: {
          menuLabel: string;
          title: string;
          subtitle: string;
          downloadShortcut: string;
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
          cancelButton: string;
          submitButton: string;
          closeButton: string;
          /** Aceita `{count}` (substituído por `result.imported`). */
          successToast: string;
          genericError: string;
          result: {
            importedLabel: string;
            errorsTitle: string;
            /** Aceita `{row}` e `{message}`. */
            rowTemplate: string;
          };
        };
      };
    };

    /** Drawer de FILTRO da listagem — TASK-FE-036-312/322/323/324. */
    filter: {
      title: string;
      search: string;
      searchPlaceholder: string;
      client: string;
      clientPlaceholder: string;
      status: string;
      statusAll: string;
      statusOptions: {
        vencido: string;
        parcial: string;
        aberto: string;
        baixado: string;
        adiantamento_aberto: string;
        adiantamento_baixado: string;
      };
      dtEmissionFrom: string;
      dtEmissionTo: string;
      /** TASK-FE-036-323 (FID-G3F FM04/FM05) — intervalo de vencimento. */
      dueDateFrom: string;
      dueDateTo: string;
      /** TASK-FE-036-323 (FID-G3F FM10) — histórico, busca textual (`note`). */
      note: string;
      notePlaceholder: string;
      /** TASK-FE-036-323 (FID-G3F FM12) — valor (`amount`). */
      amount: string;
      /** TASK-FE-036-324 (FID-G3F FM13/FM16/FM17/FM19) — filtros de lookup. */
      proprietary: string;
      proprietaryPlaceholder: string;
      category: string;
      categoryPlaceholder: string;
      center: string;
      centerPlaceholder: string;
      account: string;
      accountPlaceholder: string;
      writeOffDateFrom: string;
      writeOffDateTo: string;
      harvest: string;
      harvestPlaceholder: string;
    };

    /** Formulário create+edit — TASK-FE-036-313/314/315/316. */
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
        data: string;
        installments: string;
        apportionment: string;
      };
      /** Título de seção dentro da aba "Dados" — Baixa Automática NÃO é mais aba própria (mirror CaP, item 2 do fix4). */
      sections: {
        automaticWriteoff: string;
      };
      /** Aviso quando `is_locked` (GAP-FE-036-300). */
      lockedBanner: {
        title: string;
        description: string;
      };
      /**
       * Aviso quando a parcela é Adiantamento (`payment_type===4`) — motivo de
       * bloqueio distinto de `lockedBanner` (TASK-FE-036-320, restaura o gate
       * do legado `action_manifest`/AM07).
       */
      advancePaymentLockedBanner: {
        title: string;
        description: string;
      };
      fields: {
        number: string;
        typeTitle: string;
        client: string;
        proprietary: string;
        harvest: string;
        paymentType: string;
        dtEmission: string;
        dueDate: string;
        amount: string;
        discount: string;
        penalty: string;
        interest: string;
        percInterest: string;
        increase: string;
        note: string;
        fiscalDocument: string;
        /** DEC-115 (TASK-FE-036-344, §6, mirror `TASK-FE-036-125`) — Select
         *  "Fazenda de destino", visível só em criação (`!isEditing`) com
         *  `tenant.list_all_farms===true`. */
        farmDestination: string;
      };
      placeholders: {
        number: string;
        typeTitle: string;
        client: string;
        proprietary: string;
        harvest: string;
        note: string;
      };
      /** Botão contextual criar/editar Cliente ao lado do select (mirror NFe/CaP, item 1 do fix4). */
      actions: {
        addClientAria: string;
        editClientAria: string;
      };
      paymentTypeOptions: {
        unica: string;
        parcelada: string;
        adiantamento: string;
      };
      /** Aba Parcelamento — GAP-FE-036-302 (sem reconciliação de resíduo, deliberado). */
      installmentsTab: {
        sectionTitle: string;
        sectionHint: string;
        hasDownPayment: string;
        downPaymentDate: string;
        downPaymentValue: string;
        qtdInstallments: string;
        firstDueDate: string;
        intervalDays: string;
        generateButton: string;
        regenerateConfirmTitle: string;
        regenerateConfirmDescription: string;
        sumLabel: string;
        sumHint: string;
        emptyLabel: string;
        removeRowLabel: string;
        columns: {
          dueDate: string;
          value: string;
        };
      };
      /** Aba Rateio — GAP-FE-036-301 (cascata categoria→conta→centro). */
      apportionmentTab: {
        sectionTitle: string;
        sectionHint: string;
        addRowLabel: string;
        removeRowLabel: string;
        emptyLabel: string;
        fields: {
          category: string;
          planAccount: string;
          center: string;
          percentage: string;
          valuePreview: string;
        };
        placeholders: {
          category: string;
          planAccount: string;
          center: string;
        };
        sumLabel: string;
        sumHint: string;
        /** Gate "adicionar linha só com a anterior preenchida" (mirror legado `.btn-add-item`). */
        addRowBlockedMessage: string;
        /** Confirmação ao remover linha (mirror legado `handleDelete`/`swal`). */
        removeRowConfirmTitle: string;
        removeRowConfirmDescription: string;
        /** "Não remover última linha" (mirror legado `var_pelo_menos_um`). */
        removeRowBlockedMessage: string;
      };
      /** Baixa automática + preview de saldo "na data" — GAP-FE-036-303. */
      automaticWriteoff: {
        toggleLabel: string;
        account: string;
        accountPlaceholder: string;
        movementDate: string;
        balancePreviewLabel: string;
        loadingLabel: string;
        /** Adiantamento força baixa automática = Sim (achado B-04, auditoria de fidelidade 2026-08). */
        forcedByAdvanceHint: string;
      };
      validation: {
        numberRequired: string;
        /** TASK-FE-036-326 (FID-G3F FLD07) — `number` alinhado ao limite real do backend migrado (15). */
        numberMaxLength: string;
        typeRequired: string;
        clientRequired: string;
        proprietaryRequired: string;
        paymentTypeRequired: string;
        dtEmissionRequired: string;
        dueDateRequired: string;
        amountRequired: string;
        noteRequired: string;
        noteMaxLength: string;
        installmentsRequired: string;
        installmentsSumMismatch: string;
        installmentDueDateRequired: string;
        installmentValueRequired: string;
        categoryRequired: string;
        centerRequired: string;
        percentageRequired: string;
        percentageRange: string;
        categoriesSumMismatch: string;
        /** INC-R21 (REAUDITORIA-036-2a-rodada) — rateio não pode ficar vazio. */
        categoriesRequired: string;
        /** INC-R21 — conta/data exigidas quando a baixa automática está ativa. */
        automaticWriteoffAccountRequired: string;
        automaticWriteoffMovementDateRequired: string;
      };
      savedToast: string;
      /** Contador de caracteres do Histórico (mirror legado, `{count}` é substituído em runtime). */
      noteCounterLabel: string;
      /** AM11 (TASK-FE-036-320, B-11) — toast de sucesso ao aplicar o draft
       *  de duplicar na tela de criação (mirror `ModuleFinancial.expense.
       *  form.hints.duplicateApplied`). */
      hints: {
        duplicateApplied: string;
        /** UT-000796 r2 — Gera Obrigação (movimento Financiamento → título). */
        obligationDraftApplied: string;
        obligationDraftExpired: string;
        obligationDraftDiscarded: string;
      };
      /**
       * Upload/Prefill de XML — SÓ criação (B-05, TASK-FE-036-340/341/342).
       * Textos repassados via prop `texts` ao `XmlPrefillModal` compartilhado
       * (mirror `list.excel` → `ImportExportActions`); shape idêntico ao
       * usado pela fatia irmã de Contas a Pagar (`ExpenseXmlDraft`).
       */
      xmlImport: {
        buttonLabel: string;
        modalTitle: string;
        modalSubtitle: string;
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
        submitButton: string;
        cancelButton: string;
        successToast: string;
        genericError: string;
        /** `client_matched===false` — find-or-create REAL, aviso INFORMATIVO (nunca bloqueante). */
        clientAutoCreatedNotice: string;
        /** `proprietary_matched===false` no ramo NFe — ausência REAL, aviso de fato (campo fica vazio). */
        proprietaryNotFoundWarning: string;
      };
    };

    /** Detalhe somente-leitura — TASK-FE-036-317. */
    detail: {
      generalData: {
        title: string;
      };
      financial: {
        title: string;
        isLocked: string;
      };
      apportionment: {
        title: string;
        empty: string;
        /** "—" para "Conta Contábil" — Resource não devolve (GAP-FE-036-301, decisão do dev). */
        planAccountFallback: string;
      };
      audit: {
        title: string;
        writeoffsCount: string;
      };
      notFound: {
        title: string;
        description: string;
        back: string;
      };
      actions: {
        edit: string;
        /** Link "Baixar XML" — visível só quando `income.xml_key` presente (B-05, TASK-FE-036-342). */
        downloadXml: string;
      };
      /** Feedback do download de XML (B-05, TASK-FE-036-342) — `downloadXml('incomes', uuid)` + `downloadBlob`. */
      xml: {
        downloadError: string;
      };
    };
  };
}
