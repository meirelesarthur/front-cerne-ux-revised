// src/@types/language/module-nfes/index.ts
// Interface de tradução do módulo "NFe Emitidas" (Nfe — domínio Fiscal,
// execução 036, TASK-FE-036-401). Espelha a convenção de module-issuers/
// module-warehouses (chave singular do módulo — `nfe` — dentro do namespace
// `nfes`). O conteúdo mora em
// src/constants/languages/{idioma}/languageNfes.ts.

export interface ModuleNfes {
  nfe: {
    singularLabel: string;
    pluralLabel: string;
    list: {
      pageTitle: string;
      pageSubtitle: string;
      deletedToast: string;
      table: {
        code: string;
        client: string;
        nature: string;
        date: string;
        estado: string;
        amount: string;
        // NFE-R2-001 (REAUDITORIA-036-2a-rodada.md) — colunas Emissor/Número
        // (NFe)/Qtd. Itens, a API real já expõe.
        issuer: string;
        numeroNfe: string;
        itemsCount: string;
      };
      // TASK-FE-036-515 — ações de Emissão SEFAZ espelhadas no kebab da
      // listagem (mirror `NfeEmissionPanel`, mesma i18n reaproveitada).
      actions: {
        view: string;
        edit: string;
        delete: string;
        duplicate: string;
        emit: string;
        cancel: string;
        correct: string;
        consult: string;
        // TASK-FE-036-560/562 — Baixar XML/DANFE no kebab da listagem;
        // navegam para o Detalhe (mesmo destino de emit/cancel/correct/
        // consult), onde `NfeEmissionPanel` decide preview vs. final
        // conforme o `estado`.
        downloadXml: string;
        downloadDanfe: string;
      };
      emptyState: {
        titleEmpty: string;
        descriptionEmpty: string;
        titleFiltered: string;
        descriptionFiltered: string;
        cta: string;
      };
    };
    filter: {
      title: string;
      client: string;
      estado: string;
      estadoAll: string;
      emissionFrom: string;
      emissionTo: string;
      // NFE-R2-002 (REAUDITORIA-036-2a-rodada.md) — 5 filtros que a API real
      // já aceita (`NfeIndexRequest`), mirror legado (`index.blade.php:41-76`).
      numeroNfe: string;
      product: string;
      issuer: string;
      amount: string;
      harvest: string;
    };
    estadoOptions: {
      novo: string;
      aprovado: string;
      rejeitado: string;
      cancelado: string;
    };
    form: {
      title: { create: string; edit: string };
      subtitle: { create: string; edit: string };
      // TASK-FE-036-D2-2 — 3ª aba condicional (só renderiza com
      // `has_financial===true`), supera `TASK-FE-036-D2` (toast).
      tabs: { header: string; items: string; financial: string };
      sections: {
        identification: string;
        issuanceFiscal: string;
        // REWORK DE FIDELIDADE (correcoes-e2e-rodada-1, D4/img12) —
        // `guideTransport` (seção única "Guia/Transporte") foi substituída
        // pelos 3 painéis irmãos do legado (`_forms.blade.php:172-266`):
        // Transportadora → Frete → Volume, nesta ordem.
        transportadora: string;
        frete: string;
        volume: string;
        paymentNotes: string;
        itemProductAndQuantity: string;
        // REWORK DE FIDELIDADE (D7/img20-21) — título do toggle/accordion
        // "Dados Fiscais" que agora envolve o bloco fiscal clássico E a
        // Reforma Tributária (mirror `_card-item.blade.php:117-127`, a
        // Reforma NÃO tem toggle próprio). Renomeado de `itemFiscalClassic`
        // ('FISCAL', usado como Text solto) — mesma chave, novo papel de
        // título do `CollapsibleSection`.
        itemFiscalToggleTitle: string;
        itemFiscalReform: string;
        itemFiscalDevolucao: string;
        totals: string;
      };
      fields: {
        client: string;
        natureza: string;
        stateRegistrationClient: string;
        harvest: string;
        emissor: string;
        provider: string;
        // D4/img12 (MAPA-nfe-form-behavior.md §D4) — "Prestador de Serviço"
        // do bloco Transportadora, `provider_id` no legado
        // (`_forms.blade.php:172-209`). Reaproveita o mesmo FK real
        // `provider_uuid` de `NfeRequest::rules()` (já modelado em
        // `NfePayload`/`NfeDetail.provider`, nunca antes renderizado no
        // formulário de criação/edição) — rótulo PRÓPRIO deste contexto
        // (distinto de `fields.provider`/"Fornecedor", usado no Cabeçalho).
        providerService: string;
        typeEmission: string;
        hasFinancial: string;
        typePayment: string;
        typeDebt: string;
        typeCredit: string;
        transpName: string;
        transpCnpj: string;
        transpAddress: string;
        transpCity: string;
        shippingType: string;
        shippingBoardVehicle: string;
        shippingUfShipping: string;
        specie: string;
        numberVolumes: string;
        quantityVolumes: string;
        grossWeight: string;
        netWeight: string;
        departureDate: string;
        deliveryDate: string;
        percentIcms: string;
        icmsBase: string;
        gta: string;
        typeGuide: string;
        ufGuide: string;
        numberGuide: string;
        serieGuide: string;
        orderNumber: string;
        refNfe: string;
        refNfeDevolucao: string;
        refNfeDevolucaoHint: string;
        note: string;
        antt: string;
        tipo: string;
        finnfe: string;
        // NFE-R2-008 (REAUDITORIA-036-2a-rodada.md) — "Info. Complementares"
        // (cascata: preenche Observações), mirror `_forms.blade.php:152`.
        additionalInfo: string;
        // -- Item --
        product: string;
        packageField: string;
        area: string;
        warehouse: string;
        quantity: string;
        // TASK-FE-036-B17-2 — unidade do Produto, display-only (mirror
        // legado `.um[]` readonly), NUNCA persistida.
        measurement: string;
        amount: string;
        discount: string;
        orderItem: string;
        cfop: string;
        cfopSaidaInterno: string;
        cfopSaidaExterno: string;
        cstCsosn: string;
        cstCsosnExp: string;
        cstPis: string;
        cstCofins: string;
        cstIpi: string;
        cenqIpi: string;
        percIcmsItem: string;
        percPis: string;
        percCofins: string;
        percIpi: string;
        cest: string;
        barcode: string;
        percentReduction: string;
        motDesIcms: string;
        motDesIcmsHint: string;
        percDif: string;
        percDifHint: string;
        percFcp: string;
        percFcpHint: string;
        percIpiDevol: string;
        percIpiDevolHint: string;
        modalityBc: string;
        origem: string;
        reference: string;
        cbenef: string;
        cClassTrib: string;
        cstIbsCbs: string;
        percIbsUf: string;
        percIbsMun: string;
        percReducaoAliqIbsUf: string;
        percReducaoAliqIbsMun: string;
        percDifIbsUf: string;
        percDifIbsMun: string;
        percCbs: string;
        percReducaoAliqCbs: string;
        percDifCbs: string;
        cstIs: string;
        percIs: string;
        percIsEspec: string;
        uTribIs: string;
        adRemIbs: string;
        adRemCbs: string;
        tpCredPresIbsZfm: string;
        indDoacao: string;
        refAccessKey: string;
        refItemNumber: string;
      };
      placeholders: {
        client: string;
        natureza: string;
        harvest: string;
        emissor: string;
        provider: string;
        providerService: string;
        transpCity: string;
        product: string;
        packageField: string;
        area: string;
        warehouse: string;
        additionalInfo: string;
        // TASK-FE-036-B17-2 — opção sintética do Select síncrono de Armazém
        // (Regra E.6 do legado, armazém NÃO obrigatório), mirror
        // "Sem Estoque".
        noStock: string;
      };
      actions: {
        addClientAria: string;
        editClientAria: string;
        addProductAria: string;
        editProductAria: string;
      };
      totalsFields: {
        totalProducts: string;
        discount: string;
        shippingValue: string;
        addedValue: string;
        amount: string;
        vIbs: string;
        vCbs: string;
        vIs: string;
      };
      itemRow: {
        addButton: string;
        removeButton: string;
        emptyLabel: string;
      };
      // TASK-FE-036-D2-2 — bloco Financeiro real (parcelamento + rateio),
      // mirror ESTRUTURAL de `ModuleIncomes.income.form.installmentsTab`/
      // `apportionmentTab` (mesmas chaves, namespace próprio da NFe — texto/
      // contexto adaptado, nunca reaproveitando o i18n de Income/Expense
      // diretamente, mirror da própria Tarefa: "só o texto/contexto muda").
      financialTab: {
        sectionHint: string;
        fields: { typeTitle: string; proprietary: string };
        placeholders: { typeTitle: string; proprietary: string };
        installments: {
          sectionTitle: string;
          sectionHint: string;
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
          columns: { dueDate: string; value: string };
        };
        apportionment: {
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
          placeholders: { category: string; planAccount: string; center: string };
          sumLabel: string;
          sumHint: string;
          addRowBlockedMessage: string;
          removeRowConfirmTitle: string;
          removeRowConfirmDescription: string;
          removeRowBlockedMessage: string;
        };
      };
      hints: {
        discountDerived: string;
        clientNoLabel: string;
      };
      agroDefensivos: {
        sectionTitle: string;
        nReceituario: string;
        cpfRespTec: string;
        addButton: string;
        removeButton: string;
        emptyText: string;
        stagingMessage: string;
        cpfInvalid: string;
        maxReached: string;
        disabledByGuide: string;
        guideDisabledByDefensivos: string;
      };
      validation: {
        clientRequired: string;
        naturezaRequired: string;
        stateRegistrationClientRequired: string;
        typePaymentRequired: string;
        itemsRequired: string;
        productRequired: string;
        quantityRequired: string;
        quantityMin: string;
        amountRequired: string;
        totalMustBePositive: string;
        tipoRequired: string;
        finnfeRequired: string;
        typeDebtRequiredWhenFinnfe6: string;
        typeCreditRequiredWhenFinnfe5: string;
        shippingTypeRequired: string;
        ufGuideRequiredWhenTypeGuide: string;
        numberGuideRequiredWhenTypeGuide: string;
        cstCsosnRequired: string;
        cstPisRequired: string;
        cstCofinsRequired: string;
        cstIpiRequired: string;
        cenqIpiRequired: string;
        modalityBcRequired: string;
        refAccessKeyRequired: string;
        refAccessKeyLength: string;
        refItemNumberRequired: string;
        refItemNumberRange: string;
        agroDefensivosGuideExclusive: string;
        agroDefensivosMax: string;
        agroDefensivosReceituarioRequired: string;
        agroDefensivosReceituarioMax: string;
        agroDefensivosCpfRequired: string;
        agroDefensivosCpfInvalid: string;
        origemRequired: string;
        typeEmissionRequired: string;
        // NFE-R2-007 — obrigatoriedade condicional de ICMS quando a Natureza
        // não usa cálculo automático (`automatic_calculation === false`).
        percentIcmsRequired: string;
        icmsBaseRequired: string;
        // TASK-FE-036-D2-2 — bloco Financeiro, mirror `income-schema.ts`.
        financialTypeTitleRequired: string;
        financialInstallmentsRequired: string;
        financialInstallmentsSumMismatch: string;
        financialInstallmentDueDateRequired: string;
        financialInstallmentValueRequired: string;
        financialCategoryRequired: string;
        financialCenterRequired: string;
        financialPercentageRequired: string;
        financialPercentageRange: string;
        financialCategoriesRequired: string;
        financialCategoriesSumMismatch: string;
      };
      editBlockedToast: { title: string; description: string };
    };
    detail: {
      sections: {
        header: string;
        items: string;
        totals: string;
        // NFE-R2-013/014 (REAUDITORIA-036-2a-rodada.md) — seções "Transporte"
        // e "ICMS" que o legado exibe e o detalhe atual omite.
        transport: string;
        icms: string;
      };
      // NFE-R2-013 — rótulos só do detalhe (sem campo irmão no formulário).
      fields: { createdAt: string };
      table: {
        noData: string;
        // NFE-R2-015 — Pacote/Área/Total ausentes na tabela de itens do
        // detalhe.
        packageField: string;
        area: string;
        total: string;
      };
      emptyItems: string;
      notFound: { title: string; description: string; back: string };
      printButton: string;
      // TASK-FE-036-561 — `printButton` deixou de disparar `window.print()`
      // da página HTML (que NÃO é o DANFE fiscal) e passou a baixar o PDF
      // real do DANFE (`GET /nfes/{uuid}/danfe` ou `.../danfe-preview`
      // conforme `estado`); erro de rede desse download usa este toast.
      printError: string;
      actions: { edit: string };
    };
    // Emissão SEFAZ (Área A, esteira 036 — TASK-FE-036-511/512). Painel de
    // status inserido em NfeDetalhe.tsx + modal de confirmação de emissão.
    // Cancelar/Corrigir/Consultar (TASK-FE-036-513/514, Onda 2) somam-se ao
    // mesmo painel. Downloads (TASK-FE-036-560/561/562, Onda 3) abaixo.
    emission: {
      panelTitle: string;
      emitButton: string;
      emitSuccessToast: string;
      emitGenericError: string;
      statusErrorBanner: string;
      fields: {
        numeroNfe: string;
        chave: string;
        receipt: string;
        dateSendSefaz: string;
      };
      emitModal: {
        title: string;
        description: string;
        confirmButton: string;
        // GAP-FE-036-516 — cascata Emissor→IE: `state_registration` enviado
        // ao `emit` é o do EMISSOR selecionado aqui, nunca o
        // `state_registration_client` (IE do cliente).
        issuerLabel: string;
        issuerPlaceholder: string;
        issuerRequired: string;
        stateRegistrationLabel: string;
        stateRegistrationPlaceholder: string;
        stateRegistrationRequired: string;
        noIssuersAvailable: string;
        noStateRegistrationsForIssuer: string;
        loadIssuersError: string;
        seriesLabel: string;
        seriesPlaceholder: string;
        seriesRequired: string;
        noSeriesForIssuer: string;
        ibsCbsMissingTitle: string;
        ibsCbsMissingHint: string;
        ownIssuerKeyWarningTitle: string;
        ownIssuerKeyWarningHint: string;
      };
      // TASK-FE-036-513 — Cancelar/Corrigir (motivo obrigatório, mirror
      // `NfeEventRequest::rules()`: cancelar 15..255, CC-e 15..1000 — UT-000748/P-07).
      cancelButton: string;
      correctButton: string;
      cancelSuccessToast: string;
      correctSuccessToast: string;
      cancelGenericError: string;
      correctGenericError: string;
      cancelModal: {
        title: string;
        description: string;
        motivoLabel: string;
        motivoPlaceholder: string;
        motivoRequired: string;
        motivoMin: string;
        motivoMax: string;
        motivoHelper: string;
        confirmButton: string;
      };
      correctModal: {
        title: string;
        description: string;
        motivoLabel: string;
        motivoPlaceholder: string;
        motivoRequired: string;
        motivoMin: string;
        motivoMax: string;
        motivoHelper: string;
        confirmButton: string;
      };
      // TASK-FE-036-514 — Consultar (manual), shape `NfeSefazConsultResult`
      // (distinto de `NfeEmissionResult`, leitura direta de
      // `NfeEmissionController::consult()`).
      consultButton: string;
      consultGenericError: string;
      consultCancelledNotice: string;
      consultResult: {
        title: string;
        situacao: string;
        situacaoLabels: {
          autorizado: string;
          cancelado: string;
          processando: string;
        };
        protocolNumber: string;
        protocolStatus: string;
        protocolMotivo: string;
        chave: string;
        noData: string;
      };
      // TASK-FE-036-560/561/562 (Onda 3) — Downloads de documento
      // (`NfeDocumentController`). `Xml`/`Danfe` têm par preview/final (o
      // caller escolhe o rótulo pelo `estado`); `CancellationPdf`/
      // `CorrectionPdf` só aparecem "conforme houver" (estado `cancelado` /
      // `aprovado` com evento de correção já transmitido).
      documents: {
        downloadXmlButton: string;
        downloadXmlPreviewButton: string;
        downloadDanfeButton: string;
        downloadDanfePreviewButton: string;
        downloadCancellationPdfButton: string;
        downloadCorrectionPdfButton: string;
        downloadXmlError: string;
        downloadDanfeError: string;
        downloadCancellationPdfError: string;
        downloadCorrectionPdfError: string;
      };
    };
  };
}
