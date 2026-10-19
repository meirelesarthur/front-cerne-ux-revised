// src/@types/language/module-module-weighing/index.ts
// -----------------------------------------------------------------------------
// Interface de tradução do módulo PESAGEM RODOVIÁRIA (ModuleWeighing —
// Operacional, execução 044, F-045, TASK-MWG-FE-01). Espelha a convenção de
// `module-weighing/index.ts` (feature irmã de pesagem ANIMAL, mesmo domínio
// de negócio, bounded context DIFERENTE — `CONTRATO-TELA-PESAGEM-FE §1`).
//
// Namespace `moduleWeighing` — deliberadamente DISJUNTO de `weighing`
// (pesagem animal, F-071, já em produção). Nada aqui colide com
// `ModuleWeighing` (types) do `@/@types/language/index.d.ts`.
//
// TASK-MWG-FE-01 (fundação) cobre a interface COMPLETA — `common` (mínimo
// table/toast/deleteDialog/buttons + status/type/category, reusado por
// TODAS as 9 telas + 5 diálogos) e os STUBS por tela (`Record<string, never>`,
// contrato-tela §9a) — cada Tarefa de tela (02-09) EDITA este arquivo
// substituindo o stub correspondente pelo shape real, sem re-tocar as
// demais chaves já preenchidas.
// -----------------------------------------------------------------------------

export interface ModuleModuleWeighing {
  moduleWeighing: {
    singularLabel: string;
    pluralLabel: string;
    titleModule: string;

    /** Canônico do módulo — reutilizado por TODAS as telas/diálogos (get_pwa_i18n_pattern §2a). */
    common: {
      table: {
        actions: string;
      };
      toast: {
        deleteSuccess: string;
      };
      deleteDialog: {
        title: string;
        descriptionTemplate: string;
      };
      buttons: {
        new: string;
        save: string;
        cancel: string;
      };
      /** Labels do enum `ModuleWeighingStatus` (contrato API §3) — dot indicator (LM-001) + steps do wizard. */
      status: {
        preCadastro: string;
        pesagemInicial: string;
        classificacao: string;
        pesagemFinal: string;
        finalizado: string;
      };
      /** Labels do enum `ModuleWeighingType` (contrato API §3) — coluna LM-007 + condicionais de form. */
      type: {
        vendaSaida: string;
        compraEntrada: string;
        avulsa: string;
        entradaColheita: string;
        entradaTerceiros: string;
      };
      /** Labels do enum `ModuleWeighingCategory` (contrato API §3) — coluna LM-008. */
      category: {
        externa: string;
        interna: string;
      };
    };

    /**
     * Listagem — FE-SCR-01 (`TASK-MWG-FE-02`). Grid paginada 9 colunas
     * (`LM-001..LM-009`) + 5 filtros (`FM-001..FM-005`) + menu de ações
     * condicionais (`AM-005..AM-010`, contrato-pesagem-norm.md).
     */
    list: {
      pageTitle: string;
      pageSubtitle: string;
      reportButton: string;
      table: {
        status: string;
        code: string;
        responsible: string;
        date: string;
        warehouse: string;
        product: string;
        type: string;
        category: string;
      };
      actions: {
        edit: string;
        nextStep: string;
        finalize: string;
        issueNfe: string;
        issueTransfer: string;
        delete: string;
      };
      emptyState: {
        titleEmpty: string;
        descriptionEmpty: string;
        titleFiltered: string;
        descriptionFiltered: string;
      };
      filter: {
        title: string;
        responsible: string;
        equipment: string;
        warehouse: string;
        product: string;
        provider: string;
      };
      deleteDialog: {
        title: string;
        descriptionTemplate: string;
      };
      error: {
        message: string;
        retry: string;
      };
      /** Legenda de status (Badge+texto por estado do enum `ModuleWeighingStatus`,
       *  `AVALIADO`/GAP-PES-FE-legend-lista) — renderizada junto ao `HeaderGrid`. */
      legend: {
        label: string;
      };
    };

    /** Criar/Editar — FE-SCR-02 (`TASK-MWG-FE-03`). */
    create: {
      title: {
        create: string;
        edit: string;
      };
      fields: {
        /** Correção 050 (D8) — código gerado no servidor, exibido READONLY
         *  (nunca um campo de payload). */
        code: string;
        date: string;
        product: string;
        measurement: string;
        area: string;
        warehouse: string;
        equipment: string;
        provider: string;
        providerBuy: string;
        client: string;
        farmTo: string;
        /** Correção 050 (D1) — label do texto READONLY do Responsável
         *  (usuário logado na criação / responsável do registro na edição).
         *  Mantido `employee` por convenção do padrão já em uso em outros
         *  módulos (`CreateBatchArea`/`CreateBatchGrazing`: `fields.employee`
         *  + `InputReadOnly` + `user?.username`) — NÃO é mais um select de
         *  funcionário. */
        employee: string;
        hasClassification: string;
        discountTable: string;
        providerLot: string;
        expirationDate: string;
        note: string;
        type: string;
        category: string;
      };
      /** Correção 050 (D8) — texto do `code` em modo criação (servidor ainda
       *  não gerou o valor). */
      hints: {
        codeGeneratedOnSave: string;
      };
      validation: {
        requiredField: string;
        clientRequired: string;
        providerBuyRequired: string;
        farmToRequired: string;
        expirationDateRequired: string;
      };
      toasts: {
        createdSuccess: string;
        updatedSuccess: string;
      };
      duplicateLotWarning: string;
    };

    /** Wizard etapas (Pesagem Inicial/Final) — FE-SCR-03 (`TASK-MWG-FE-05`). */
    wizard: {
      stepCounter: {
        label: string;
        of: string;
      };
      footer: {
        back: string;
        next: string;
      };
      fields: {
        grossWeight: string;
        tareWeight: string;
        netWeightPreview: string;
        warehouse: string;
      };
      /** Correção 050 (F4) — título da ETAPA por CONTEÚDO capturado (fiel ao
       *  legado `steps/initial-weighing.blade`/`steps/final-weighing.blade`:
       *  `card-title` = "Tara do Veículo"/"Peso Total"), NUNCA um rótulo
       *  genérico de etapa/posição — a etapa que captura TARA usa `tare`; a
       *  que captura o peso cheio/bruto usa `gross`, independente de ser a
       *  1ª ou a 2ª etapa (ordem varia por `type`, `captureOrder`). */
      stepTitles: {
        tare: string;
        gross: string;
      };
      validation: {
        requiredField: string;
        weightRange: string;
        netWeightNegative: string;
      };
      toasts: {
        advancedSuccess: string;
      };
    };

    /** Wizard — etapa de Classificação — FE-SCR-03 (`TASK-MWG-FE-06`). */
    classification: {
      discountTable: string;
      keys: {
        impureza: string;
        umidade: string;
        quebrado: string;
        esverdeado: string;
        avariado: string;
        taxaRecepcao: string;
      };
      percentLabel: string;
      appliedLabel: string;
      /** Correção 050 (D4) — label do input numérico de desconto manual
       *  (`applied` digitado diretamente), usado só quando a etapa NÃO tem
       *  tabela de desconto fixada (mirror `classification.blade:24-26`,
       *  campo `applied` editável). Com tabela, o checkbox `appliedLabel`
       *  continua sendo usado (resolução automática via `discountRules`). */
      appliedManualLabel: string;
      discountPreviewTitle: string;
      discountPreviewTotal: string;
      validation: {
        percentRange: string;
      };
    };

    /** Finalização — FE-SCR-04 (`TASK-MWG-FE-07`). */
    finish: {
      title: string;
      summary: {
        grossWeight: string;
        tareWeight: string;
        discount: string;
        netWeight: string;
      };
      dfeList: {
        title: string;
        emptyUnavailable: string;
        number: string;
        issuer: string;
        issueDate: string;
        select: string;
      };
      confirmButton: string;
      toasts: {
        finalizedSuccess: string;
      };
    };

    /** Relatório — FE-SCR-06 (`TASK-MWG-FE-09`, retrabalho `TASK-MWG-FE-10`,
     *  export Excel `TASK-MWG-FE-11`). */
    report: {
      pageTitle: string;
      pageSubtitle: string;
      filters: {
        startDate: string;
        endDate: string;
        type: string;
        category: string;
        warehouse: string;
        product: string;
        client: string;
      };
      exportPdfButton: string;
      exportXlsxButton: string;
      toasts: {
        success: string;
        generateError: string;
      };
      validation: {
        startDateRequired: string;
        endDateRequired: string;
        endDateBeforeStart: string;
      };
      columns: {
        /** GAP-PES-04 (parametrizável) — única fonte do rótulo da coluna de
         *  peso do relatório (hoje "Peso Bruto", paridade; troca para "Peso
         *  Líquido" é 1 edição de dicionário quando o dono decidir).
         *  Consumida pelo backend na geração do PDF — não renderizada
         *  diretamente pelo front (RT-015 é blob gerado no servidor). */
        grossOrNetLabel: string;
      };
    };

    /** Comprovante/visualização printable — FE-SCR-05 (`TASK-MWG-FE-08`). */
    detail: {
      printButton: string;
      fields: {
        code: string;
        date: string;
        product: string;
        grossWeight: string;
        tareWeight: string;
        netWeight: string;
        measurement: string;
        discount: string;
        averageCost: string;
        total: string;
      };
      history: {
        title: string;
        datetime: string;
        status: string;
        inputType: string;
        inputTypeAuto: string;
        inputTypeManual: string;
      };
      notFound: {
        title: string;
        description: string;
        backAction: string;
      };
    };

    /** Diálogos de sub-cadastro — FE-DLG-* (`TASK-MWG-FE-10/11`). */
    dialogs: {
      warehouse: Record<string, never>;
      product: Record<string, never>;
      equipment: Record<string, never>;
      provider: Record<string, never>;
      client: Record<string, never>;
    };

    /** WebSocket da balança + diálogo tutorial — FE-FLW-WS/FE-DLG-TUTORIAL (`TASK-MWG-FE-04/12`). */
    scaleConnection: {
      connecting: string;
      connected: string;
      disconnected: string;
      payloadError: string;
      captureButton: string;
    };

    /** Diálogo tutorial da balança + download do conector — FE-DLG-TUTORIAL (`TASK-MWG-FE-12`). */
    scaleTutorial: {
      title: string;
      helpButton: string;
      instructions: string;
      statusLabel: string;
      downloadButton: string;
    };
  };
}
