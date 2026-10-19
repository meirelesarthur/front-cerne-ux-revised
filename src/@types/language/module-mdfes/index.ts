// src/@types/language/module-mdfes/index.ts
// Interface de tradução do módulo MDFe (Mdfe — domínio Fiscal-Transporte,
// execução 045, Onda 1, TASK-MDFE-FE-01..08). Top-level (mirror `ModuleCtes`/
// `ModuleDfes`), NÃO aninhado sob `fiscal` — convenção confirmada em
// `src/@types/language/index.d.ts` (`ctes: ModuleCtes`, `dfes: ModuleDfes`).
//
// Cobre a Onda 1 (core: listagem, cadastro/edição 3 abas, não-encerrados,
// relatório) MAIS o dicionário de `emission.*` (Onda 2) desde já — decisão
// explícita de `TASK-MDFE-FE-01` para não reabrir este arquivo depois.

export interface ModuleMdfes {
  mdfe: {
    titleModule: string;
    singularLabel: string;
    pluralLabel: string;

    list: {
      pageTitle: string;
      pageSubtitle: string;
      deletedToast: string;
      table: {
        integrationStatus: string;
        numero: string;
        emissor: string;
        dataInicioViagem: string;
        cnpjContratante: string;
        estado: string;
        quantidadeCarga: string;
        valorCarga: string;
        mdfeNumero: string;
      };
      actions: {
        edit: string;
        delete: string;
        view: string;
        print: string;
      };
      emptyState: {
        titleEmpty: string;
        descriptionEmpty: string;
        titleFiltered: string;
        descriptionFiltered: string;
        cta: string;
      };
      naoEncerradosButton: string;
      helpButton: string;
      quotaBlockedMessage: string;
      printError: string;
    };

    filter: {
      title: string;
      estado: string;
      estadoAll: string;
      dataInicioViagemDe: string;
      dataInicioViagemAte: string;
      emissor: string;
      veiculo: string;
    };

    estadoOptions: {
      novo: string;
      aprovado: string;
      rejeitado: string;
      cancelado: string;
    };

    // LK003 — "Carga posterior?" (Sim/Não), mirror `outDayOptions`/
    // `useKgOptions` (par local por módulo, convenção real do fork).
    cargaPosteriorOptions: {
      yes: string;
      no: string;
    };

    // LK002 — 1=Normal, 2=Contingência.
    typeEmissionOptions: {
      normal: string;
      contingencia: string;
    };

    tabs: {
      geral: string;
      transporte: string;
      descarga: string;
    };

    form: {
      title: { create: string; edit: string };
      subtitle: { create: string; edit: string };
      // AC009 — guarda de estado bloqueado (mirror `NfeForm.editBlockedToast`).
      editBlockedToast: { title: string; description: string };
      fields: {
        ufInicio: string;
        ufFim: string;
        dataInicioViagem: string;
        cargaPosterior: string;
        typeEmission: string;
        cnpjContratante: string;
        quantidadeCarga: string;
        valorCarga: string;
        produtoPredNome: string;
        produtoPredNcm: string;
        produtoPredCodBarras: string;
        cepCarrega: string;
        cepDescarrega: string;
        latitudeCarregamento: string;
        longitudeCarregamento: string;
        latitudeDescarregamento: string;
        longitudeDescarregamento: string;
        tpCarga: string;
        seguradoraNome: string;
        seguradoraCnpj: string;
        numeroApolice: string;
        numeroAverbacao: string;
        infoComplementar: string;
        infoAdicionalFisco: string;
        veiculoTracao: string;
        veiculoReboque: string;
        veiculoReboque2: string;
        veiculoReboque3: string;
        tpEmit: string;
        tpTransp: string;
        lacRodo: string;
        condutorNome: string;
        condutorCpf: string;
      };
      cancelButton: string;
      saveButton: string;
      // CORREÇÃO ADICIONAL (retest do dono, lote-2) — tooltip do botão
      // Salvar do rodapé quando `canSaveGate` (CV006) é false: lista SÓ o
      // que falta, mirror `WeighingHeaderFields.tsx::sanitaryTooltip`.
      saveDisabledTooltip: {
        prefix: string;
        municipioCarregamento: string;
        infoDescarga: string;
        condutorNome: string;
        condutorCpf: string;
      };
    };

    municipiosCarregamento: {
      sectionTitle: string;
      cidade: string;
      addButton: string;
      removeButton: string;
      emptyText: string;
      columnCidade: string;
    };

    percurso: {
      sectionTitle: string;
      uf: string;
      addButton: string;
      removeButton: string;
      emptyText: string;
      columnUf: string;
    };

    ciot: {
      sectionTitle: string;
      codigo: string;
      cpfCnpj: string;
      addButton: string;
      removeButton: string;
      emptyText: string;
      stagingMessage: string;
      columnCodigo: string;
      columnCpfCnpj: string;
      codeLengthError: string;
      requiredForTpEmit: string;
    };

    valePedagio: {
      sectionTitle: string;
      cnpjFornecedor: string;
      cnpjFornecedorPagador: string;
      numeroCompra: string;
      valor: string;
      addButton: string;
      removeButton: string;
      emptyText: string;
      stagingMessage: string;
    };

    payment: {
      sectionTitle: string;
      responsibleName: string;
      responsibleCpfCnpj: string;
      paymentType: string;
      componentType: string;
      amount: string;
      bankCode: string;
      agencyCode: string;
      cnpjIpef: string;
      pixKey: string;
      additionalInfo: string;
      addButton: string;
      removeButton: string;
      emptyText: string;
      stagingMessage: string;
    };

    infoDescarga: {
      sectionTitle: string;
      tpUnidTransp: string;
      idUnidTransp: string;
      quantidadeRateio: string;
      cidade: string;
      chaveNfe: string;
      segCodNfe: string;
      chaveCte: string;
      segCodCte: string;
      addButton: string;
      removeButton: string;
      emptyText: string;
      stagingMessage: string;
      incompletePairMessage: string;
      unidadeCarga: {
        sectionTitle: string;
        idUnidadeCarga: string;
        quantidadeRateio: string;
        addButton: string;
        removeButton: string;
      };
      lacreUnidadeCarga: {
        sectionTitle: string;
        numero: string;
        addButton: string;
        removeButton: string;
      };
      lacreTransporte: {
        sectionTitle: string;
        numero: string;
        addButton: string;
        removeButton: string;
      };
    };

    // LK004 — mirror `trad.mdf_pservic`/`trad.mdf_tproprio` do legado.
    tpEmit: {
      prestadorServico: string;
      transportadorProprio: string;
    };

    // LK005 — mirror ETC/TAC/CTC do legado.
    tpTransp: {
      etc: string;
      tac: string;
      ctc: string;
    };

    tipoCarga: {
      tc01: string;
      tc02: string;
      tc03: string;
      tc04: string;
      tc05: string;
      tc06: string;
      tc07: string;
      tc08: string;
      tc09: string;
      tc10: string;
      tc11: string;
    };

    paymentType: {
      pago: string;
      aPagar: string;
    };

    componentType: {
      valePedagio: string;
      impostosTaxas: string;
      despesas: string;
      outros: string;
    };

    unidadeTransporte: {
      u1: string;
      u2: string;
      u3: string;
      u4: string;
      u5: string;
      u6: string;
      u7: string;
    };

    naoEncerrados: {
      pageTitle: string;
      pageSubtitle: string;
      emissorRequired: string;
      submitButton: string;
      table: {
        chave: string;
        protocolo: string;
        mdfeNumero: string;
        createdAt: string;
      };
      encerrarButton: string;
      encerrarTooltip: string;
      emptyState: {
        title: string;
        description: string;
      };
    };

    // Tela 6 — Detalhe/Emissão SEFAZ (TASK-MDFE-FE-09), leitura pura,
    // mirror `nfes.nfe.detail`.
    detail: {
      sections: { header: string };
      fields: { dataEmissao: string };
      notFound: {
        title: string;
        description: string;
        back: string;
      };
      actions: { edit: string };
    };

    // Onda 2 (SEFAZ) — TASK-MDFE-FE-09. `emit*` ligado na execução 045
    // (micro-fix de correção de premissa): `MdfeEmissionController::emit`
    // é bodyless (sem Select de Emissor), confirmação via `DeleteConfirmDialog`
    // genérico, mirror do padrão já usado pelo botão "Encerrar" em
    // `naoEncerrados` na Onda 1 (`TASK-MDFE-FE-06`).
    emission: {
      panelTitle: string;
      emitButton: string;
      emitSuccessToast: string;
      emitGenericError: string;
      emitModal: {
        title: string;
        description: string;
        confirmButton: string;
        issuerLabel: string;
        issuerPlaceholder: string;
        issuerRequired: string;
        noIssuersAvailable: string;
        loadIssuersError: string;
      };
      cancelButton: string;
      cancelSuccessToast: string;
      cancelGenericError: string;
      closeButton: string;
      closeSuccessToast: string;
      closeGenericError: string;
      closeModal: {
        title: string;
        description: string;
        confirmButton: string;
      };
      downloadXmlButton: string;
      downloadXmlError: string;
      motivoLabel: string;
      motivoRequired: string;
      motivoMinLength: string;
      fields: {
        mdfeNumero: string;
        chave: string;
        protocolo: string;
        dateSendSefaz: string;
      };
      cancelModal: {
        title: string;
        description: string;
        motivoPlaceholder: string;
        confirmButton: string;
      };
    };
  };
}
