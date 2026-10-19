// src/@types/language/module-ctes/index.ts
// Interface de tradução do módulo CT-e (Cte — domínio Fiscal, execução 045,
// Onda 1, TASK-CTE-FE-01..08 + Onda 2 Emissão SEFAZ, TASK-CTE-FE-09/10/11).
// Top-level (mirror `ModuleDfes`), NÃO aninhado sob `fiscal` — convenção
// confirmada em `src/@types/language/index.d.ts` (`dfes: ModuleDfes`,
// `nfes: ModuleNfes`).
//
// `emission` (Onda 2) mirror estrutural de `ModuleNfes.nfe.emission`
// (`languageNfes.ts`) — mesmo domínio de emissão SEFAZ, adaptado aos campos
// do CT-e (D01-D13 readonly, D14 issue_id, corrigir/cancelar/imprimir).
// Manifestação (Onda 2, TASK-CTE-FE-12..14) fica para a Tarefa
// correspondente — não antecipada aqui.

export interface ModuleCtes {
  cte: {
    singularLabel: string;
    pluralLabel: string;

    list: {
      pageTitle: string;
      pageSubtitle: string;
      newButton: string;
      helpLink: string;
      table: {
        integrationStatus: string;
        remetente: string;
        destinatario: string;
        createdAt: string;
        valorCarga: string;
        cteNumero: string;
        estado: string;
      };
      actionsMenu: {
        edit: string;
        delete: string;
        report: string;
      };
      emptyState: {
        title: string;
        description: string;
      };
      error: {
        message: string;
        retry: string;
      };
      deleteDialog: {
        title: string;
        description: string;
        confirmButton: string;
      };
      toast: {
        deleteSuccess: string;
        deleteError: string;
        createSuccess: string;
        updateSuccess: string;
      };
      reportPermissionDenied: string;
      reportError: string;
    };

    filter: {
      title: string;
      estado: string;
      estadoAll: string;
      startDate: string;
      endDate: string;
      dateRangeInvalid: string;
    };

    estadoOptions: {
      novo: string;
      aprovado: string;
      rejeitado: string;
      cancelado: string;
    };

    form: {
      createTitle: string;
      editTitle: string;
      tabs: {
        principal: string;
        nfeReferenciada: string;
        outrosDocumentos: string;
      };
      fields: {
        natureza: string;
        globalizado: string;
        cst: string;
        percIcms: string;
        remetente: string;
        destinatario: string;
        produtoPredominante: string;
        tomador: string;
        valorCarga: string;
        modal: string;
        equipment: string;
        enderecoTomador: string;
        ruaTomador: string;
        numeroTomador: string;
        bairroTomador: string;
        cepTomador: string;
        cidadeTomador: string;
        dataPrevistaEntrega: string;
        valorTransporte: string;
        valorReceber: string;
        municipioEnvio: string;
        municipioInicio: string;
        municipioFim: string;
        retira: string;
        detalhesRetira: string;
        observacao: string;
        tpDoc: string;
        descOutros: string;
        nDoc: string;
        vDocFisc: string;
        cClassTrib: string;
        cstIbsCbs: string;
        percIbsUf: string;
        percIbsMun: string;
        percCbs: string;
        percReducaoAliqIbsUf: string;
        percReducaoAliqIbsMun: string;
        percReducaoAliqCbs: string;
        percDifIbsUf: string;
        percDifIbsMun: string;
        percDifCbs: string;
      };
      rtcSectionTitle: string;
      rtcSectionHint: string;
      valorTransporteHint: string;
      chavesNfe: {
        sectionTitle: string;
        chaveLabel: string;
        addButton: string;
        removeButton: string;
        emptyText: string;
        invalidLength: string;
        duplicate: string;
      };
      medidas: {
        sectionTitle: string;
        codUnidade: string;
        tipoMedida: string;
        quantidadeCarga: string;
        addButton: string;
        removeButton: string;
        emptyText: string;
      };
      componentes: {
        sectionTitle: string;
        nome: string;
        valor: string;
        addButton: string;
        removeButton: string;
        emptyText: string;
      };
      enderecoTomadorCascade: {
        promptSelectClient: string;
        permissionDenied: string;
        genericError: string;
      };
    };

    validation: {
      naturezaRequired: string;
      globalizadoRequired: string;
      cstRequired: string;
      percIcmsRequired: string;
      remetenteRequired: string;
      destinatarioRequired: string;
      chaveNfeLength: string;
      chaveNfeDuplicate: string;
      equipmentRequired: string;
      produtoPredominanteRequired: string;
      produtoPredominanteMax: string;
      tomadorRequired: string;
      valorCargaRequired: string;
      modalRequired: string;
      medidasMinOne: string;
      componentesMinOne: string;
      componenteNomeMax: string;
      ruaTomadorRequired: string;
      numeroTomadorRequired: string;
      bairroTomadorRequired: string;
      cepTomadorRequired: string;
      cidadeTomadorRequired: string;
      dataPrevistaEntregaRequired: string;
      municipioEnvioRequired: string;
      municipioInicioRequired: string;
      municipioFimRequired: string;
      percentRange: string;
      cClassTribInvalid: string;
      tpDocRequired: string;
    };

    emission: {
      pageTitle: string;
      backButton: string;
      notFoundToast: string;
      loadErrorToast: string;
      tabs: {
        resumo: string;
        componentes: string;
        medidas: string;
        chaves: string;
      };
      fields: {
        dataEmissao: string;
        natureza: string;
        cst: string;
        percIcms: string;
        remetente: string;
        destinatario: string;
        produtoPredominante: string;
        dataPrevistaEntrega: string;
        tpDoc: string;
        observacao: string;
        valorCarga: string;
        valorTransporte: string;
        valorReceber: string;
        cteNumero: string;
        chave: string;
        estado: string;
        sequenciaCce: string;
        cClassTrib: string;
        cstIbsCbs: string;
        vIbs: string;
        vCbs: string;
        noValue: string;
      };
      issuer: {
        label: string;
        placeholder: string;
        required: string;
        loadError: string;
        noOptions: string;
      };
      actions: {
        gerarXmlButton: string;
        transmitirButton: string;
        corrigirButton: string;
        cancelarButton: string;
        dacteButton: string;
        imprimirCorrecaoButton: string;
        imprimirCancelamentoButton: string;
      };
      toasts: {
        xmlGeneratedSuccess: string;
        xmlError: string;
        transmitirSuccess: string;
        transmitirError: string;
        corrigirSuccess: string;
        corrigirError: string;
        cancelarSuccess: string;
        cancelarError: string;
        dacteError: string;
        imprimirCorrecaoError: string;
        imprimirCancelamentoError: string;
      };
      readonlyEmpty: {
        noComponentes: string;
        noMedidas: string;
        noChaves: string;
      };
      correcaoDialog: {
        title: string;
        description: string;
        grupoLabel: string;
        grupoPlaceholder: string;
        grupoRequired: string;
        campoLabel: string;
        campoRequired: string;
        motivoLabel: string;
        motivoPlaceholder: string;
        motivoRequired: string;
        confirmButton: string;
      };
      cancelamentoDialog: {
        title: string;
        description: string;
        motivoLabel: string;
        motivoPlaceholder: string;
        motivoRequired: string;
        confirmButton: string;
      };
    };
  };
}
