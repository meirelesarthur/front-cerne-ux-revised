// src/@types/language/module-pastures/index.ts
// Interface de tradução do módulo OPERACIONAL — Pastagem (Pasture) —
// domínio PRÓPRIO (mirror `module-appropriations`). O conteúdo mora em
// `src/constants/languages/{idioma}/languagePastures.ts`.
//
// TASK-PAST-FE-00 (fundação) → FE-01 (service) → FE-02 (listagem) → FE-03
// (form casca+geral) → FE-04 (equipamentos/serviços/produção) → FE-05
// (produtos/insumos+ocorrências) → FE-06 (visualizar) → FE-07 (apropriação)
// → FE-08 (rotas). Execução 041.

export interface ModulePastures {
  pasture: {
    singularLabel: string;
    pluralLabel: string;
    list: {
      pageTitle: string;
      pageSubtitle: string;
      deletedToast: string;
      statusLegend: {
        opened: string;
        finished: string;
        appropriated: string;
      };
      table: {
        status: string;
        code: string;
        date: string;
        requester: string;
        warehouse: string;
        createdAt: string;
      };
      actions: {
        view: string;
        edit: string;
        appropriate: string;
        delete: string;
        helpVideo: string;
        helpVideoComingSoon: string;
      };
      filter: {
        title: string;
        requester: string;
        requesterPlaceholder: string;
        startDate: string;
        endDate: string;
      };
      emptyState: {
        title: string;
        description: string;
        titleFiltered: string;
        descriptionFiltered: string;
        cta: string;
      };
    };
    form: {
      title: {
        create: string;
        edit: string;
      };
      subtitle: {
        create: string;
        edit: string;
      };
      fields: {
        code: string;
        date: string;
        requester: string;
        operation: string;
        activity: string;
        area: string;
        grazing: string;
        batch: string;
        animal: string;
        inputsWarehouse: string;
        productionsWarehouse: string;
      };
      placeholders: {
        requester: string;
        operation: string;
        activity: string;
        area: string;
        grazing: string;
        batch: string;
        animal: string;
        inputsWarehouse: string;
        productionsWarehouse: string;
      };
      tabs: {
        general: string;
        equipments: string;
        services: string;
        inputs: string;
        occurrences: string;
        productions: string;
      };
      addItem: string;
      removeItem: string;
      emptyRow: string;
      errors: {
        invalidFields: string;
        areaOrGrazingRequired: string;
        checkDateUnavailable: string;
        /** TASK-PAST-FIX-FE-02c (decisão do dono) — ocorrência com imagem
         *  e/ou diagnóstico preenchido mas SEM Recomendação: fiel ao legado
         *  e ao backend (só persiste com `recommendation`), mas agora
         *  bloqueia o submit com aviso claro em vez de descartar em
         *  silêncio. */
        occurrenceRecommendationRequired: string;
      };
      equipments: {
        fields: {
          equipment: string;
          measurement: string;
          startHourMeter: string;
          endHourMeter: string;
          note: string;
        };
        placeholders: {
          equipment: string;
          measurement: string;
        };
        readonlyHint: string;
      };
      services: {
        fields: {
          funcType: string;
          executor: string;
          measurement: string;
          quantity: string;
          totalQuantity: string;
        };
        placeholders: {
          funcType: string;
          executor: string;
          measurement: string;
        };
        funcTypeOptions: {
          employee: string;
          function: string;
          provider: string;
        };
        readonlyHint: string;
      };
      inputs: {
        fields: {
          stock: string;
          measurement: string;
          quantity: string;
          quantityUnitary: string;
          totalQuantity: string;
        };
        placeholders: {
          stock: string;
          measurement: string;
        };
        readonlyHint: string;
        stockWarningInsufficient: string;
        stockWarningBelowMinimum: string;
      };
      productions: {
        fields: {
          product: string;
          measurement: string;
          stock: string;
          quantity: string;
          note: string;
        };
        placeholders: {
          product: string;
          measurement: string;
        };
        readonlyHint: string;
        newProductButton: string;
      };
      occurrences: {
        fields: {
          diagnosis: string;
          recommendation: string;
          priority: string;
        };
        placeholders: {
          diagnosis: string;
          recommendation: string;
        };
        priorityOptions: {
          low: string;
          medium: string;
          high: string;
        };
        images: {
          title: string;
          addButton: string;
          changeButton: string;
          removeButton: string;
          maxHint: string;
        };
      };
    };
    show: {
      title: string;
      tabs: {
        services: string;
        equipments: string;
        inputs: string;
        productions: string;
        occurrences: string;
      };
      emptySection: string;
      backAction: string;
      notFound: {
        title: string;
        description: string;
        back: string;
      };
    };
    appropriation: {
      title: string;
      subtitle: string;
      headerTitle: string;
      itemsEmptyHint: string;
      fields: {
        costCenter: string;
        class: string;
        vlTime: string;
      };
      placeholders: {
        costCenter: string;
      };
      classOptions: {
        custeio: string;
        investimento: string;
      };
      submit: string;
      cancel: string;
      back: string;
      appropriatedToast: string;
      autoAppropriatedToast: string;
    };
  };
}
