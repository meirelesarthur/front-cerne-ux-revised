// src/@types/language/module-breeding-mating/index.ts
// Interface de tradução do módulo "Acasalamento" (BreedingMating —
// Operacional / Reprodução, F-016, 97-Esteiras/001, Tarefa 01). Mirror
// estrutural de `module-breeding-batch` (instância simples: um único
// arquivo, sem decomposição por tela). Chave raiz `breedingMating`, com
// `pregnancyDiagnosis` ANINHADA no mesmo módulo (nunca uma chave raiz
// própria em `LanguageDate`) — espelha a hierarquia de permissão do legado
// (`pregnancy-diagnosis_*` dentro de `breeding-matings`). O conteúdo mora em
// src/constants/languages/{idioma}/languageBreedingMating.ts.

export interface ModuleBreedingMating {
  breedingMating: {
    singularLabel: string;
    pluralLabel: string;
    titleModule: string;
    /** Rótulos das fábricas de opções (Tarefa 02) — nunca lidos direto no
     *  form, sempre via `options/*-options.ts` (`get_pwa_constants_and_mappers_pattern §3.2`). */
    options: {
      type: { natural: string; iatf: string; fiv: string };
      launchType: { normal: string; simplified: string };
      ink: { yes: string; little: string; no: string };
      eligible: { yes: string; no: string };
      resync: { yes: string; no: string };
    };
    list: {
      pageTitle: string;
      pageSubtitle: string;
      newButton: string;
      table: {
        code: string;
        date: string;
        responsible: string;
        resync: string;
        typeLastStep: string;
        actions: string;
      };
      /** Rótulos dinâmicos de estado (Em Andamento/Finalizado) — legenda
       *  estática abaixo do filtro. `status.label` em si vem pronto do
       *  servidor e NÃO é traduzido no front (Tarefa 01, regra 6). */
      statusLegend: {
        inProgress: string;
        finished: string;
      };
      actions: {
        view: string;
        edit: string;
        nextStep: string;
        nextStepIndividual: string;
        finish: string;
        pregnancyDiagnosis: string;
        delete: string;
      };
      emptyState: {
        titleEmpty: string;
        descriptionEmpty: string;
        titleFiltered: string;
        descriptionFiltered: string;
        cta: string;
      };
      filter: {
        title: string;
        responsible: string;
        breedingBatch: string;
      };
      deleteDialog: {
        title: string;
        description: string;
        warning: string;
      };
      finishDialog: {
        title: string;
        description: string;
      };
      /** Estado de erro da listagem (Tarefa 03, regra 10) — mensagem +
       *  ação "Tentar novamente", mirror `Weaning`/demais grids. */
      error: {
        message: string;
        retry: string;
      };
    };
    detail: {
      title: string;
      backButton: string;
      fields: {
        code: string;
        date: string;
        responsible: string;
        breedingSeason: string;
        breedingBatch: string;
        type: string;
        resync: string;
      };
      sections: {
        natural: string;
        simplified: string;
        protocol: string;
      };
      /** Estado de erro genérico (não-404) da visualização/Próxima Etapa —
       *  mirror `list.error` (regra 11 da TASK-BM-FE-06). */
      error: {
        message: string;
        retry: string;
      };
      /** Fallback defensivo para uma sub-lista vazia dentro de um bloco
       *  (ex.: `natural.cows`/`protocol.animals` sem itens) — SEM MOCK, só
       *  honestidade de UI (TASK-BM-FE-06). */
      emptySection: string;
      /** Rótulos da timeline de `ProtocolDetailBlock` (`data.timeline`,
       *  EP-BM-02) — apresentação de dado já pronto do servidor, nenhum
       *  cálculo de data no front (regra 5 da TASK-BM-FE-06). Ampliado por
       *  `GAP-FE-BM-18`/`TASK-BM-FE-23` para os rótulos da timeline rica
       *  (nome do protocolo, serviço, produtos) — o dado em si (weekday,
       *  data, horário, serviço, produto) nunca é traduzido, só os rótulos. */
      protocol: {
        timelineTitle: string;
        timelineIdentification: string;
        timelineDaysFromPrevious: string;
        /** Prefixo do nome do protocolo no topo da timeline, mirror "Protocolo - {nome}"
         *  do legado (`GAP-FE-BM-18`). */
        protocolNamePrefix: string;
        /** Rótulo de serviço(s) por etapa da timeline. */
        timelineService: string;
        /** Rótulo de produto(s)/quantidade por etapa da timeline. */
        timelineProducts: string;
      };
      notFound: {
        title: string;
        description: string;
      };
      invalidParamsToast: {
        title: string;
        description: string;
      };
    };
    form: {
      title: { create: string; edit: string };
      fields: {
        code: string;
        date: string;
        responsible: string;
        type: string;
        launchType: string;
        breedingSeason: string;
        bullSeedSeason: string;
        protocol: string;
        breedingBatch: string;
      };
      sections: {
        natural: {
          animalsBreedingBatch: string;
          bull: string;
          cows: string;
          bulls: string;
          ratio: string;
          markAllButton: string;
          unmarkAllButton: string;
        };
        protocol: {
          animal: string;
          time: string;
          bodyScore: string;
          ink: string;
          eligible: string;
          responsible: string;
          products: string;
          semen: string;
          embryo: string;
          batchTransfer: string;
          removeRowButton: string;
          emptyRow: string;
          totalizer: {
            protocolTitle: string;
            semenEmbryoTitle: string;
            product: string;
            measurement: string;
            stock: string;
            quantity: string;
            noStock: string;
          };
        };
        simplified: {
          animal: string;
          warehouse: string;
          product: string;
          measurement: string;
          stock: string;
          quantity: string;
          responsible: string;
          emptyRow: string;
          totalizer: {
            title: string;
            product: string;
            measurement: string;
            stock: string;
            quantity: string;
          };
        };
      };
      validation: {
        dateRequired: string;
        typeRequired: string;
        launchTypeRequired: string;
        breedingSeasonRequired: string;
        bullSeedSeasonRequired: string;
        protocolRequired: string;
        breedingBatchRequired: string;
        naturalBullRequired: string;
        naturalCowsRequired: string;
        protocolAnimalRequired: string;
        simplifiedAnimalRequired: string;
        simplifiedWarehouseRequired: string;
        simplifiedProductRequired: string;
        simplifiedMeasurementRequired: string;
        simplifiedQuantityRequired: string;
      };
      errors: {
        invalidFields: string;
      };
      unsavedChangesDialog: {
        title: string;
        description: string;
        confirmButton: string;
      };
      batchTransferDialog: {
        title: string;
        animalsLabel: string;
        warningMessage: string;
        newBatch: string;
        confirmButton: string;
      };
    };
    nextStep: {
      title: string;
      backButton: string;
      saveButton: string;
      /** Cabeçalho travado de `AcasalamentoProximaEtapa` — mirror de
       *  `_forms_next_step.blade.php:1-27` (8 campos no legado). `bullSeedSeason`/`protocol`
       *  (NOME do protocolo) ficam de fora até `GAP-FE-BM-04` (ampliação) expor as duas refs no
       *  nível raiz de `BreedingMatingData` — ver GAP-FE-BM-12. */
      fields: {
        code: string;
        date: string;
        responsibleName: string;
        breedingSeason: string;
        type: string;
        breedingBatch: string;
        /** Reservada para `GAP-FE-BM-04` (ampliado) — NOME do protocolo, sem consumidor
         *  hoje (ver GAP-FE-BM-12, campo removido do `DisplayFieldGroup`). */
        protocol?: string;
      };
      /** Fallback defensivo — `EP-BM-09.animals` vazio (não deveria ocorrer
       *  com `can_next_step=true`, mas a tela nunca quebra silenciosamente). */
      emptyAnimals: string;
    };
  };
  pregnancyDiagnosis: {
    singularLabel: string;
    pluralLabel: string;
    list: {
      pageTitle: string;
      /** Rótulo do botão "Novo" (`pd-action-create`, só o botão — a tela de
       *  criação é `NAO_APLICAVEL` nesta Tarefa, TASK-BM-FE-08). */
      newButton: string;
      table: {
        code: string;
        date: string;
        responsible: string;
        birthForecast: string;
        actions: string;
      };
      actions: {
        view: string;
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
        startDate: string;
        endDate: string;
        responsible: string;
      };
      deleteDialog: {
        title: string;
        description: string;
        warning: string;
      };
      /** Estado de erro da listagem (TASK-BM-FE-07, regra 12/contrato de tela
       *  §6.7) — mensagem + ação "Tentar novamente", mirror `breedingMating.list.error`. */
      error: {
        message: string;
        retry: string;
      };
    };
    detail: {
      title: string;
      backButton: string;
      fields: {
        code: string;
        date: string;
        responsible: string;
      };
      animalsTable: {
        animal: string;
        inseminator: string;
        technique: string;
        diagnosis: string;
        batch: string;
        bull: string;
      };
      notFound: {
        title: string;
        description: string;
      };
      /** Estado de erro genérico (não-404) da visualização (TASK-BM-FE-07) —
       *  mirror `breedingMating.detail.error`. */
      error: {
        message: string;
        retry: string;
      };
    };
    form: {
      title: string;
      titleFollowUp: string;
      backButton: string;
      saveButton: string;
      fields: {
        code: string;
        date: string;
        responsible: string;
      };
      breedingMatingBlock: {
        title: string;
        code: string;
        date: string;
        responsible: string;
        type: string;
        launchType: string;
        breedingSeason: string;
        bullSeedSeason: string;
        protocol: string;
        breedingBatch: string;
      };
      batchFillSection: {
        title: string;
        animals: string;
        inseminator: string;
        technique: string;
        diagnosis: string;
        resync: string;
        batchTransfer: string;
        observations: string;
        applyButton: string;
        /** TASK-BM-FE-08 — aviso client-side do botão `Aplicar` quando faltar
         *  animal/inseminador/técnica/DG (regra 6 da Tarefa, sem literal no legado). */
        applyValidationError: string;
      };
      animalCard: {
        animal: string;
        inseminator: string;
        technique: string;
        diagnosis: string;
        resync: string;
        batchTransfer: string;
        observation: string;
        gestationDays: string;
        bull: string;
        removeRowButton: string;
        addBatchTransferButton: string;
        removeConfirm: string;
      };
      validation: {
        dateRequired: string;
        animalsMinRequired: string;
        inseminatorRequired: string;
        techniqueRequired: string;
        diagnosisRequired: string;
      };
      /** GAP-FE-BM-08 (mirror) — toast de `onInvalid` no submit, mesma forma
       *  de `breedingMating.form.errors`. */
      errors: {
        invalidFields: string;
      };
      /** TASK-BM-FE-08 — guarda de saída sem salvar (contrato de tela §6.7),
       *  mesma forma de `breedingMating.form.unsavedChangesDialog`. */
      unsavedChangesDialog: {
        title: string;
        description: string;
        confirmButton: string;
      };
    };
    /** Tela de RELATÓRIO "gerar e sair" (Tarefa 46,
     *  frontend-contract-vacas-prenhas.md §5) — PDF inline em nova aba OU
     *  Excel download, campo `type` único decide o formato (mirror
     *  `dfes.dfe.report`). Sem grid on-screen. */
    report: {
      pageTitle: string;
      pageSubtitle: string;
      filters: {
        startDate: string;
        endDate: string;
        inseminationType: string;
        batch: string;
        animal: string;
        diagnosisPregnancy: string;
      };
      fields: {
        reportType: string;
      };
      reportTypeOptions: {
        pdf: string;
        excel: string;
      };
      submitButton: string;
      successToast: string;
      errorToast: string;
      hint: {
        datesRequired: string;
      };
    };
  };
  /** Tela de RELATÓRIO "gerar e sair" (execução 074,
   *  historico-reprodutivo-contrato-front.md §4) — PDF inline em nova aba OU
   *  Excel download, campo `type` único decide o formato (mirror
   *  `pregnancyDiagnosis.report`). TOP-LEVEL, sibling de `breedingMating`/
   *  `pregnancyDiagnosis` — NÃO aninhado dentro de `pregnancyDiagnosis`, pois
   *  o relatório cobre domínio mais amplo que só diagnóstico de gestação.
   *  Sem grid on-screen. */
  reproductiveHistoryReport: {
    pageTitle: string;
    pageSubtitle: string;
    filters: {
      startDate: string;
      endDate: string;
      batch: string;
      reproductiveStatus: string;
    };
    fields: {
      reportType: string;
    };
    reportTypeOptions: {
      pdf: string;
      excel: string;
    };
    submitButton: string;
    successToast: string;
    errorToast: string;
    hint: {
      datesRequired: string;
    };
  };
  /** Tela de RELATÓRIO "gerar e sair" (lote 079, F-307-plano-frontend.md
   *  §5 TASK-F307-FE-01) — PDF inline em nova aba OU Excel download, campo
   *  `type` único decide o formato (mirror `reproductiveHistoryReport`).
   *  TOP-LEVEL, sibling de `breedingMating`/`pregnancyDiagnosis`/
   *  `reproductiveHistoryReport`. Sem grid on-screen. Diferente dos 2
   *  irmãos: `animal` é OBRIGATÓRIO (fiel ao contrato-alvo API §3/FLD-02,
   *  `ReceiverCowProductivityReportRequest::rules()`). */
  receiverCowProductivityReport: {
    pageTitle: string;
    pageSubtitle: string;
    filters: {
      animal: string;
      startDate: string;
      endDate: string;
    };
    fields: {
      reportType: string;
    };
    reportTypeOptions: {
      pdf: string;
      excel: string;
    };
    submitButton: string;
    successToast: string;
    errorToast: string;
    hint: {
      datesRequired: string;
      animalRequired: string;
    };
  };
}
