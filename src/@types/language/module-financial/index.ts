// src/@types/language/module-financial/index.ts
// Interface de tradução do módulo "Financeiro Mercado Pago" (execução 031,
// TASK-FE-031-44). Espelha a convenção de module-markers/module-parameters:
// chave TOP-LEVEL dedicada (`financial`), NÃO aninhada em
// `ModuleBaseRegistrations` — este módulo não é um cadastro, é uma listagem
// de suporte do domínio SaaS-admin "Financeiro" (contrato-front-financeiro-
// mercado-pago.md §1.1). O conteúdo mora em
// src/constants/languages/{idioma}/languageFinancial.ts.
//
// Nota de consistência (não é decisão de produto, só forma de arquivo): o
// contrato de tela §6.4 exemplifica `languageFinancial` com uma chave
// `financial` aninhada por dentro (`{ financial: { mercadoPago: {...} } }`).
// O padrão REAL já em uso por todo módulo TOP-LEVEL irmão (`languageMarkers`
// = `{ marker: {...} }`, `languageParameters` = `{ parameter: {...} }`)
// exporta a entidade já no nível certo, para ser espalhada como
// `financial: { ...languageFinancial }` no index.ts de cada locale — o que
// produz exatamente o path documentado no próprio contrato §6.3
// (`languageEnUs.US.financial.mercadoPago.singularLabel`). Seguido aqui o
// padrão REAL (código > exemplo do contrato — mesma entidade, mesma forma
// final, sem ambiguidade de produto): `languageFinancial = { mercadoPago: {...} }`.
//
// `expense` (Contas a Pagar, esteira 036, TASK-FE-036-110) adicionado no
// MESMO nível de `mercadoPago` — convenção "chave TOP-LEVEL de módulo
// dedicado" já estabelecida (`financial.expense.*`, mirror
// `financial.mercadoPago.*`).
//
// `ofxImport` (Meses Conciliados — Importação/Conciliação OFX, execução 044,
// TASK-MES-FE-10) adicionado no MESMO nível de `expense`/`mercadoPago` —
// tipo decomposto em arquivo próprio (`./ofx-import.d.ts`, mirror da
// instrução do CONTRATO-TELA-MESES-FE §6), importado aqui.

import type { BudgetPlanningLanguage } from './budget-planning';
import type { CashFlowLanguage } from './cash-flow';
import type { FinancialFreezeLanguage } from './financial-freeze';
import type { OfxImportLanguage } from './ofx-import';

export interface ModuleFinancial {
  mercadoPago: {
    singularLabel: string;
    pluralLabel: string;
    list: {
      pageTitle: string;
      emptyState: {
        /** Texto EXATO da imagem de evidência (contrato §2/§3) — não é a
         *  chave genérica de "nenhum resultado" de outras telas. */
        title: string;
      };
      error: {
        message: string;
        retry: string;
      };
      filter: {
        statusLabel: string;
        dateStartLabel: string;
        dateEndLabel: string;
        filterButton: string;
        clearButton: string;
        statusOptions: {
          all: string;
          pending: string;
          approved: string;
          rejected: string;
          cancelled: string;
        };
      };
      table: {
        nome: string;
        contratante: string;
        plano: string;
        cpfCnpj: string;
        transactionId: string;
        paymentMethod: string;
        value: string;
        date: string;
        status: string;
        paymentMethodOptions: {
          pix: string;
          boleto: string;
          cartao: string;
        };
      };
    };
  };
  expense: {
    singularLabel: string;
    pluralLabel: string;
    classificationOptions: {
      notClassified: string;
      capex: string;
      opex: string;
    };
    list: {
      pageTitle: string;
      pageSubtitle: string;
      deletedToast: string;
      /** TASK-FE-036-114 (FID-G3F LM14/LM15) — rodapé de totais da PÁGINA
       *  corrente (não do total geral filtrado), mirror da rotulagem
       *  cautelosa já usada pelo legado para a mesma limitação. */
      pageTotalLabel: string;
      /** DEC-115 (TASK-FE-036-125, §2/§4) — toggle "Ver títulos de todas as
       *  fazendas" no header da grid (fora do drawer de filtro). */
      allFarmsToggle: {
        label: string;
        description: string;
      };
      table: {
        number: string;
        provider: string;
        dtEmission: string;
        dueDate: string;
        amount: string;
        balance: string;
        paymentType: string;
        status: string;
        installment: string;
        /** TASK-FE-036-113 (LM04/LM07/LM06/LM12/LM13) — 5 colunas
         *  restauradas de fidelidade (Código próprio, Tipo de Título,
         *  Gestor/proprietary, Data de Baixa, Dedutível/fiscal_document). */
        code: string;
        typeTitle: string;
        manager: string;
        writeOffDate: string;
        deductible: string;
        /** LM01 (TASK-FE-036-120) — indicador de anexos (`documents_count`),
         *  célula vazia quando `0`, ícone quando `>0` (mirror
         *  `ModuleIncomes.income.list.columns.documentsCount`). */
        documentsCount: string;
        /** DEC-115 (TASK-FE-036-125, §7) — coluna visível só quando
         *  `paginatedQuery.filter?.all_farms===true`. */
        farm: string;
      };
      /** TASK-FE-036-113 (LM12) — popover da coluna "Data de Baixa". */
      writeOffPopover: {
        account: string;
        value: string;
        total: string;
      };
      statusOptions: {
        paid: string;
        partiallySettled: string;
        overdue: string;
        open: string;
      };
      actions: {
        view: string;
        edit: string;
        delete: string;
        editDisabledAdvanceHint: string;
        deleteDisabledMovedHint: string;
        /** AM05 (TASK-FE-036-120) — abre o `DocumentPanel` compartilhado
         *  (Drawer), mirror `ModuleIncomes.income.list.actions.documents`. */
        documents: string;
        /** AM11 (TASK-FE-036-122, B-11) — item de menu "Duplicar", busca o
         *  draft (`GET /expenses/{uuid}/duplicate`) e navega para a criação
         *  pré-preenchida. */
        duplicate: string;
        /** Toast de erro quando a busca do draft falha (ex.: título excluído
         *  entre listar e clicar) — fallback só usado quando o backend não
         *  devolve mensagem própria. */
        duplicateError: string;
        /** B-12 (TASK-FE-036-B12-CAP) — item de menu "Gerar Recibo", baixa o
         *  PDF do recibo do título (`GET /expenses/{uuid}/receipt`) via
         *  `downloadBlob` (mirror `handleDownloadDanfe`). */
        receipt: string;
        /** Toast de erro quando o download do recibo falha (403/404/500). */
        receiptError: string;
      };
      emptyState: {
        titleEmpty: string;
        titleFiltered: string;
        descriptionEmpty: string;
        descriptionFiltered: string;
        cta: string;
      };
      /** Seleção múltipla (paridade com Incomes, esteira 036fix4, item 2) —
       *  coluna de checkbox + selecionar-todos. */
      selection: {
        selectAllLabel: string;
        selectRowLabel: string;
      };
      /** Exclusão em lote (esteira 036, TASK-FE-036 bulk delete CaP) — mirror
       *  `ModuleIncomes.income.list.bulk` (Incomes/index.tsx). */
      bulk: {
        selectedCountLabel: string;
        deleteButton: string;
        confirmTitle: string;
        confirmDescription: string;
        /** Ressalva quando alguma linha selecionada é Adiantamento/Fatura
         *  (payment_type 4/5) — rede de segurança defensiva mirror
         *  `ModuleIncomes...bulk.advanceWarning` (a elegibilidade por linha já
         *  bloqueia a seleção desses tipos; ver `isRowSelectable`). */
        advanceOrInvoiceWarning: string;
        deletedToast: string;
        /** Baixa em lote (esteira 036, TASK-FE-036-119) — mirror
         *  `ModuleIncomes.income.list.bulk.writeOffButton` (Incomes/index.tsx). */
        writeOffButton: string;
        /** Aviso quando a seleção mistura elegíveis/inelegíveis para baixa
         *  (`isExpenseEligibleForNewWriteOff` ≠ `isRowSelectable`) — usado
         *  como sufixo de `${count} ${writeOffIneligibleWarningSuffix}`. */
        writeOffIneligibleWarningSuffix: string;
      };
      /** Import/Export de planilha (esteira 036, Onda 3 sub-onda 3e, B-08) —
       *  consumido por `components/ImportExport/ImportExportActions.tsx`
       *  (COMPARTILHADO com `ModuleIncomes.income.list.excel`, mesma forma). */
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
    filter: {
      title: string;
      number: string;
      numberPlaceholder: string;
      provider: string;
      proprietary: string;
      typeTitle: string;
      harvest: string;
      dtEmissionFrom: string;
      dtEmissionTo: string;
      dueDateFrom: string;
      dueDateTo: string;
      amount: string;
      paymentType: string;
      typeNote: string;
      // TASK-FE-036-115 (ONDA 2, FID-G3F FM13/FM16/FM17/FM05 revisado) — 4
      // dos 5 filtros novos (`product`/FM21 fora, GAP-036-113).
      note: string;
      category: string;
      center: string;
      // ONDA 3 sub-onda 3d (FM10/FM11/FM18) — filtros de baixa.
      account: string;
      accountPlaceholder: string;
      writeOffDateFrom: string;
      writeOffDateTo: string;
      status: string;
      statusOptions: {
        aVencer: string;
        vencida: string;
        baixaParcial: string;
        baixada: string;
        adiantamentoPendente: string;
        adiantamentoBaixado: string;
        faturaPendente: string;
        faturaBaixado: string;
      };
    };
    form: {
      title: { create: string; edit: string };
      subtitle: { create: string; edit: string };
      tabs: { header: string; apportionment: string; installments: string };
      fields: {
        number: string;
        typeTitle: string;
        isTaxation: string;
        provider: string;
        branch: string;
        proprietary: string;
        harvest: string;
        dtEmission: string;
        dueDate: string;
        amount: string;
        paymentType: string;
        recurrenceType: string;
        classification: string;
        typeNote: string;
        fiscalDocument: string;
        discount: string;
        penalty: string;
        interest: string;
        percInterest: string;
        increase: string;
        note: string;
        automaticWriteoff: string;
        account: string;
        movementDate: string;
        accountBalancePreview: string;
        financialCategory: string;
        costCenter: string;
        planAccount: string;
        apportionmentValue: string;
        apportionmentPercent: string;
        installmentCount: string;
        firstDueDate: string;
        intervalDays: string;
        /** TASK-FE-036-123 (B-09 Opção C parcial, `GAP-036-115`) — Select
         *  "Modalidade" (Direta/Indireta) do Cabeçalho. */
        appropriation: string;
        /** Select "Tipo" — habilitado só quando Modalidade=Direta. */
        appropriationType: string;
        /** Coluna "Área" do rateio — obrigatória só quando Direta+Tipo=Área. */
        apportionmentArea: string;
        /** UT-000717 — coluna "Safra" do rateio (POR LINHA,
         *  `categories.*.harvest_uuid`), SEMPRE visível (saiu do
         *  Cabeçalho). */
        apportionmentHarvest: string;
        /** TASK-FE-036-124 (B-09 Opção C parcial, `GAP-036-115`, 2/2) — bloco
         *  "Agricultura" do Cabeçalho (mirror `AppropriationHeaderFields`/
         *  `InvoiceItemsTab`), 4 campos: Área/Atividade obrigatórios,
         *  Operação/Cultura opcionais. */
        agriArea: string;
        agriActivity: string;
        agriOperation: string;
        agriCultivation: string;
        livestockArea: string;
        livestockGrazing: string;
        livestockBatch: string;
        livestockAnimal: string;
        livestockOperation: string;
        livestockActivity: string;
        maintenanceEquipment: string;
        maintenanceHourMeter: string;
        maintenanceMileage: string;
        detailDate: string;
        detailAmount: string;
        /** Indicador READ-ONLY do `Appropriation` gerado (`appropriation_
         *  generated`, `TASK-BE-036-126`), visível só em edição quando
         *  presente. */
        appropriationGenerated: string;
        appropriationGeneratedCode: string;
        appropriationGeneratedStatus: string;
        /** UT-000754 — chave da NFS-e (50), somente leitura, vinda do rascunho. */
        nfseKey: string;
        /** DEC-115 (TASK-FE-036-125, §6) — Select "Fazenda de destino",
         *  visível só em criação (`!isEditing`) com
         *  `tenant.list_all_farms===true`. */
        farmDestination: string;
      };
      placeholders: {
        number: string;
        typeTitle: string;
        provider: string;
        proprietary: string;
        harvest: string;
        financialCategory: string;
        costCenter: string;
        planAccount: string;
        /** TASK-FE-036-123 — placeholder da coluna "Área" do rateio. */
        apportionmentArea: string;
        /** UT-000717 — placeholder da coluna "Safra" do rateio. */
        apportionmentHarvest: string;
        /** TASK-FE-036-124 — placeholders do bloco "Agricultura". */
        agriArea: string;
        agriActivity: string;
        agriOperation: string;
        agriCultivation: string;
        livestockArea: string;
        livestockGrazing: string;
        livestockBatch: string;
        livestockAnimal: string;
        livestockOperation: string;
        livestockActivity: string;
        maintenanceEquipment: string;
        maintenanceHourMeter: string;
        maintenanceMileage: string;
      };
      paymentTypeOptions: {
        parcelaUnica: string;
        parcelada: string;
        recorrente: string;
        adiantamento: string;
        fatura: string;
      };
      recurrenceTypeOptions: {
        semanal: string;
        mensal: string;
        trimestral: string;
        anual: string;
      };
      classificationOptions: {
        notClassified: string;
        capex: string;
        opex: string;
      };
      /** TASK-FE-036-123 (Select "Modalidade") — 2 opções fixas
       *  Direta/Indireta, mirror estrutural `paymentTypeOptions`. */
      appropriationOptions: {
        direct: string;
        indirect: string;
      };
      /** TASK-FE-036-123 (Select "Tipo") — 4 opções do enum real
       *  (`ExpenseAppropriationTypeEnum`). UT-000795: Pecuária/Manutenção
       *  liberadas, sufixo "indisponível" removido. */
      appropriationTypeOptions: {
        agriculture: string;
        pasture: string;
        area: string;
        maintenance: string;
      };
      sections: {
        automaticWriteoff: string;
        installmentGenerator: string;
        /** TASK-FE-036-124 (B-09 Opção C parcial, `GAP-036-115`, 2/2) —
         *  título do bloco "Agricultura" do Cabeçalho. */
        agriculture: string;
        livestock: string;
        maintenance: string;
      };
      hints: {
        hasMovedWarning: string;
        branchRequiresProvider: string;
        providerHasNoBranches: string;
        insufficientBalanceWarning: string;
        apportionmentReadonlyWhenMoved: string;
        apportionmentSumExceedsAmount: string;
        apportionmentMinOneRow: string;
        automaticWriteoffDeterminedByPaymentType: string;
        /** TASK-FE-036-117 (FL28/IG20) — aviso ao se aproximar/atingir o
         *  limite de 1500 caracteres do campo "Histórico". */
        noteApproachingLimit: string;
        /** AM11 (TASK-FE-036-122, B-11) — toast de sucesso ao aplicar o
         *  draft de duplicar na tela de criação. */
        duplicateApplied: string;
        /** UT-000754 — rascunho de NFS-e Recebida aplicado ao form. */
        nfseDraftApplied: string;
        /** UT-000796 r2 — Gera Obrigação (movimento Financiamento → título). */
        obligationDraftApplied: string;
        obligationDraftExpired: string;
        obligationDraftDiscarded: string;
      };
      errors: {
        invalidFields: string;
      };
      /**
       * Upload/Prefill de XML — SÓ criação (B-05, TASK-FE-036-121/340/341).
       * Textos repassados via prop `texts` ao `XmlPrefillModal` compartilhado
       * (mirror `ModuleIncomes.income.form.xmlImport`, mesmo shape exigido
       * pelo componente genérico); shape idêntico ao usado pela fatia irmã
       * de Contas a Receber (`IncomeXmlDraft`).
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
        /** `provider_matched===false` — find-or-create REAL (`ExpenseXmlDraft`,
         *  MAIS SIMPLES que Income: `provider_uuid` SEMPRE válido), aviso
         *  INFORMATIVO leve (nunca bloqueante). */
        providerAutoCreatedNotice: string;
      };
      actions: {
        addProviderAria: string;
        editProviderAria: string;
        /** Link "Baixar XML" — visível só quando `loadedExpense.xml_key` presente (B-05, TASK-FE-036-121). */
        downloadXml: string;
        /** AM11 (TASK-FE-036-122, B-11) — título do toast de sucesso ao
         *  aplicar o draft de duplicar (mirror `list.actions.duplicate`). */
        duplicate: string;
      };
      /** Feedback do download de XML (B-05, TASK-FE-036-121) — `downloadXml('expenses', uuid)` (módulo compartilhado `XmlPrefill`) + `downloadBlob`. */
      xml: {
        downloadError: string;
      };
      apportionmentRow: {
        sumBadgeLabel: string;
        emptyLabel: string;
        addButton: string;
        removeButton: string;
      };
      installmentRow: {
        sumBadgeLabel: string;
        emptyLabel: string;
        addButton: string;
        removeButton: string;
        dueDate: string;
        value: string;
        generateButton: string;
        overwriteConfirm: string;
      };
      validation: {
        numberRequired: string;
        typeTitleRequired: string;
        providerRequired: string;
        dtEmissionRequired: string;
        dueDateRequired: string;
        amountRequired: string;
        amountMustBeGreaterThanZero: string;
        noteRequired: string;
        fiscalDocumentRequired: string;
        paymentTypeRequired: string;
        recurrenceTypeRequired: string;
        classificationRequired: string;
        isTaxationRequired: string;
        categoryRequired: string;
        centerRequired: string;
        valueRequired: string;
        valueMin: string;
        categoriesRequired: string;
        categoriesSumExactAmount: string;
        installmentsRequiredWhenParceled: string;
        accountRequiredWhenAutomaticWriteoff: string;
        movementDateRequiredWhenAutomaticWriteoff: string;
        /** TASK-FE-036-123 (B-09 Opção C parcial) — Select "Modalidade"
         *  sempre preenchido (default Indireta), mensagem defensiva mirror
         *  `paymentTypeRequired`. */
        appropriationRequired: string;
        /** Select "Tipo" — `requiredIf appropriation===1` (Direta). */
        appropriationTypeRequired: string;
        /** Coluna "Área" do rateio — `requiredIf appropriation===1 &&
         *  appropriation_type===AREA(3)`, todas as linhas (array-level
         *  test, mirror `categoriesSumExactAmount`). */
        areaRequired: string;
        /** TASK-FE-036-124 (B-09 Opção C parcial, `GAP-036-115`, 2/2) — bloco
         *  "Agricultura", `requiredIf appropriation===1 &&
         *  appropriation_type===AGRICULTURA(1)`, mirror `appropriationTypeRequired`. */
        agriAreaRequired: string;
        agriActivityRequired: string;
        livestockOperationRequired: string;
        livestockActivityRequired: string;
        livestockBatchRequired: string;
        areaOrGrazingOnly: string;
        maintenanceEquipmentRequired: string;
        hourMeterRequired: string;
        mileageRequired: string;
      };
    };
  };
  ofxImport: OfxImportLanguage;
  financialFreeze: FinancialFreezeLanguage;
  /** Prev. Orçamentária (BudgetPlanning, F-106, esteira 067, TASK-PO-FE-02) —
   *  chave irmã de `expense`/`mercadoPago`/`ofxImport`/`financialFreeze`,
   *  conteúdo em arquivo próprio (mesma técnica de decomposição). */
  budgetPlanning: BudgetPlanningLanguage;
  /** Fluxo Bancário (CashFlow, F-107, esteira 070, TASK-CF-FE-01) — chave
   *  irmã de `expense`/`mercadoPago`/`ofxImport`/`financialFreeze`/
   *  `budgetPlanning`, conteúdo em arquivo próprio (mesma técnica de
   *  decomposição). */
  cashFlow: CashFlowLanguage;
}
