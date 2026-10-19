// src/@types/language/module-my-service-orders/index.ts
// Interface de tradução do módulo OPERACIONAL — Minhas OS (MyServiceOrder) —
// domínio PRÓPRIO (mirror `ModuleRatingServiceOrders`/`ModuleMonitoring`). O
// conteúdo mora em `src/constants/languages/{idioma}/languageMyServiceOrders.ts`.
//
// Esteira 063 (TASK-MOS-FE-01, fundação — SEM UI). Contrato de tela:
// `CORE_WORKSPACE/97-Esteiras/063/ROTEIROS/03-contrato-telas-my-service-orders.md`.
//
// NÃO duplica as chaves de contexto readonly (`code`,`dtEmission`,`category`,
// etc.) — essas continuam vindo de `languageGB.serviceOrders.serviceOrder.
// detail.*` (decisão do contrato §3, reaproveitando `ServiceOrderDetalhe`/
// `RatingServiceOrderForm`).

export interface ModuleMyServiceOrders {
  myServiceOrder: {
    singularLabel: string;
    pluralLabel: string;
    list: {
      pageTitle: string;
      pageSubtitle: string;
      table: {
        status: string;
        code: string;
        dtEmission: string;
        deadline: string;
        user: string;
        executor: string;
      };
      actions: {
        view: string;
        execute: string;
      };
      filter: {
        title: string;
        code: string;
        codePlaceholder: string;
        startDate: string;
        endDate: string;
        paginationQuantity: string;
      };
      emptyState: {
        title: string;
        description: string;
        titleFiltered: string;
        descriptionFiltered: string;
      };
      error: {
        message: string;
        retry: string;
      };
    };
    form: {
      title: string;
      subtitle: string;
      sections: {
        execution: string;
        labor: string;
        equipment: string;
        products: string;
        productions: string;
        protections: string;
        attachments: string;
      };
      /** Correção de fidelidade (execução 063) — as 6 `CollapsibleSection`
       *  readonly reconstruídas 1:1 com `_forms.blade.php` legado, ordem
       *  EXATA. Módulo-próprio: NÃO reutilizar
       *  `languageGB.serviceOrders.serviceOrder.detail.*` aqui. */
      readonly: {
        sections: {
          identification: string;
          serviceType: string;
          execution: string;
          conditions: string;
          instructions: string;
          safety: string;
        };
        fields: {
          code: string;
          user: string;
          executor: string;
          dtEmission: string;
          executionDate: string;
          deadline: string;
          serviceFarm: string;
          category: string;
          operation: string;
          activity: string;
          area: string;
          cultivation: string;
          batch: string;
          categoryAnimal: string;
          weatherRequirements: string;
          minimumTemperature: string;
          maximumTemperature: string;
          allowedWorkingPeriodStart: string;
          allowedWorkingPeriodEnd: string;
          serviceDescription: string;
          expectedResultDescription: string;
          successCriteriaDescription: string;
          roadmapDescription: string;
          environmentalRestrictions: string;
          legalCompliance: string;
        };
      };
      fields: {
        status: string;
        executionStartDate: string;
        executionEndDate: string;
        executionProblems: string;
        correctiveActions: string;
        attachmentFile: string;
        attachmentName: string;
      };
      placeholders: {
        status: string;
      };
      checklist: {
        itemLabel: string;
        isChecked: string;
        emptyRow: string;
      };
      attachmentRow: {
        addButton: string;
        removeButton: string;
        dropzoneTitle: string;
        dropzoneDragging: string;
        changeLabel: string;
        clearFileLabel: string;
        replaceLabel: string;
        existingFileLabel: string;
        hint: string;
        errorType: string;
        errorSize: string;
        defaultName: string;
        nameRequired: string;
      };
      updatedToast: string;
      notFound: {
        title: string;
        description: string;
        back: string;
      };
      readOnly: {
        title: string;
        subtitle: string;
        statusLabel: string;
        back: string;
      };
      executionEndDateRequiredWhenCompleted: string;
    };
  };
}
