// src/@types/language/module-service-orders/index.ts
// Interface de tradução do módulo OPERACIONAL — Ordens de Serviço
// (ServiceOrder) — domínio PRÓPRIO (mirror `module-appropriations`/
// `module-transfers`). O conteúdo mora em
// `src/constants/languages/{idioma}/languageServiceOrders.ts`.
//
// TASK-FE-2001 (fundação) → TASK-FE-2002 (listagem+filtro+exclusão) →
// TASK-FE-2003 (visualização/show read-only) → TASK-FE-2004/2005 (form
// create/edit, D-FRONT-01 RESOLVIDA — bloco `form` abaixo).

export interface ModuleServiceOrders {
  serviceOrder: {
    singularLabel: string;
    pluralLabel: string;
    list: {
      pageTitle: string;
      pageSubtitle: string;
      deletedToast: string;
      /** Legenda de status — deriva a options factory de status
       *  (`service-order-status-options.ts`), mirror
       *  `AppropriationStatusMeta`/`statusLegend`. `status.label` que vem no
       *  Resource é usado direto na linha da grid; esta legenda é só para a
       *  fábrica/legenda client-side. */
      statusLabels: {
        opened: string;
        inProgress: string;
        completed: string;
        evaluated: string;
        cancelled: string;
      };
      table: {
        code: string;
        area: string;
        operation: string;
        activity: string;
        dtEmission: string;
        executionDate: string;
        deadline: string;
        status: string;
      };
      actions: {
        view: string;
        edit: string;
        delete: string;
        cancel: string;
      };
      filter: {
        title: string;
        code: string;
        codePlaceholder: string;
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
    detail: {
      title: string;
      actions: {
        edit: string;
        delete: string;
        cancel: string;
        back: string;
      };
      sections: {
        header: string;
        conditions: string;
        execution: string;
        assessment: string;
        labor: string;
        equipment: string;
        products: string;
        productions: string;
        protections: string;
        attachments: string;
        cancellation: string;
      };
      fields: {
        code: string;
        dtEmission: string;
        executionDate: string;
        deadline: string;
        status: string;
        category: string;
        area: string;
        cultivation: string;
        batch: string;
        categoryAnimal: string;
        operation: string;
        activity: string;
        user: string;
        executor: string;
        weatherRequirements: string;
        minimumTemperature: string;
        maximumTemperature: string;
        allowedWorkingPeriodStart: string;
        allowedWorkingPeriodEnd: string;
        environmentalRestrictions: string;
        legalCompliance: string;
        serviceDescription: string;
        expectedResultDescription: string;
        successCriteriaDescription: string;
        roadmapDescription: string;
        executionStartDate: string;
        executionEndDate: string;
        executionProblems: string;
        correctiveActions: string;
        assessmentGrade: string;
        ratingDate: string;
        feedback: string;
        recommendations: string;
      };
      labor: {
        type: string;
        name: string;
        note: string;
        isChecked: string;
      };
      equipment: {
        equipment: string;
        note: string;
        isChecked: string;
      };
      products: {
        // Execução 086: o Resource devolve `label`/`measurement_name`/
        // `warehouse` — a tela exibe nome, nunca uuid truncado.
        product: string;
        warehouse: string;
        stock: string;
        measurement: string;
        quantity: string;
        totalQuantity: string;
        note: string;
        isChecked: string;
      };
      productions: {
        product: string;
        measurement: string;
        quantity: string;
        note: string;
        isChecked: string;
      };
      protections: {
        product: string;
        note: string;
        isChecked: string;
      };
      attachments: {
        name: string;
        file: string;
        open: string;
        noFile: string;
      };
      cancellation: {
        reason: string;
        date: string;
        user: string;
      };
      emptySection: string;
      notFound: {
        title: string;
        description: string;
        back: string;
      };
    };
    // Diálogo "Cancelar OS" (execução 086, FE-01) — `{code}` no `description`;
    // `{min}`/`{max}` nas mensagens de validação (limites em
    // `constants/serviceOrders/service-order-cancel-rules.ts`).
    cancel: {
      title: string;
      description: string;
      reasonLabel: string;
      reasonPlaceholder: string;
      confirm: string;
      close: string;
      successToast: string;
      validation: {
        reasonRequired: string;
        reasonMin: string;
        reasonMax: string;
      };
    };
    // Form create/edit — TASK-FE-2004/2005 (D-FRONT-01 RESOLVIDA, execução
    // 038). Cabeçalho em `CollapsibleSection` (D-FRONT-03) + 5 blocos
    // dinâmicos em `Tabs` (mirror `Appropriations.form`).
    form: {
      title: { create: string; edit: string };
      subtitle: { create: string; edit: string };
      tabs: {
        header: string;
        labor: string;
        equipment: string;
        products: string;
        productions: string;
        protections: string;
      };
      sections: {
        identification: string;
        serviceType: string;
        execution: string;
        conditions: string;
        instructions: string;
        security: string;
      };
      fields: {
        code: string;
        requester: string;
        executor: string;
        dtEmission: string;
        executionDate: string;
        deadline: string;
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
        environmentalRestrictions: string;
        legalCompliance: string;
        serviceDescription: string;
        expectedResultDescription: string;
        successCriteriaDescription: string;
        roadmapDescription: string;
      };
      placeholders: {
        code: string;
        executor: string;
        operation: string;
        activity: string;
        area: string;
        cultivation: string;
        batch: string;
        categoryAnimal: string;
      };
      /** Fábrica estática `getServiceOrderCategoryOptions` — domínio
       *  1/2/3 (`App\Enums\OperationUse`). */
      categoryOptions: {
        both: string;
        agriculture: string;
        livestock: string;
      };
      labor: {
        fields: {
          funcType: string;
          executor: string;
          note: string;
          isChecked: string;
        };
        placeholders: {
          funcType: string;
          executor: string;
        };
        typeOptions: {
          employee: string;
          function: string;
          provider: string;
        };
      };
      equipment: {
        fields: {
          equipment: string;
          note: string;
          isChecked: string;
        };
        placeholders: {
          equipment: string;
        };
      };
      products: {
        fields: {
          /** Armazém do BLOCO (R2-05, 1 campo para todos os itens — antes
           *  era por linha). */
          warehouse: string;
          /** Select "Produto" da linha (R2-05 — na prática resolve o
           *  `Stock` físico escolhido, `stock_uuid`). */
          product: string;
          /** "Estoque" READONLY da linha (R2-05 — antes era o label do
           *  Select; agora é a quantidade em estoque do item escolhido). */
          stock: string;
          measurement: string;
          quantity: string;
          totalQuantity: string;
          note: string;
          isChecked: string;
        };
        placeholders: {
          warehouse: string;
          product: string;
          measurement: string;
        };
        /** R2-05 — aviso "Qtd Total > estoque" (mirror legado
         *  `_product.blade.php:74-80`), zera "Qtd Total". */
        stockExceedsDialog: {
          title: string;
          intro: string;
          informedQuantityLabel: string;
          productiveAreaLabel: string;
          stockQuantityLabel: string;
          footerNote: string;
          confirm: string;
        };
        /** R2-05 — aviso "estoque ficará abaixo do mínimo" (mirror legado
         *  `_product.blade.php:84-88`), NÃO zera nenhum campo. */
        belowMinStockWarning: {
          title: string;
          message: string;
          confirm: string;
        };
      };
      productions: {
        fields: {
          /** Armazém do BLOCO (R2-06, mirror `warehouseProduction` de
           *  Apontamentos — 1 campo para todos os itens). */
          warehouse: string;
          product: string;
          measurement: string;
          /** "Estoque" READONLY da linha (R2-06 — saldo real do Produto no
           *  Armazém do bloco, mirror `AppropriationProductionTab.tsx`). */
          stock: string;
          quantity: string;
          note: string;
          isChecked: string;
        };
        placeholders: {
          warehouse: string;
          product: string;
          measurement: string;
        };
      };
      protections: {
        fields: {
          product: string;
          note: string;
          isChecked: string;
        };
        placeholders: {
          product: string;
        };
        /** Lista de EPI vazia (`/products/options?purpose=epi`) é estado
         *  honesto — nunca cai para "sem filtro". */
        emptyOptions: string;
      };
      addItem: string;
      removeItem: string;
      emptyRow: string;
      errors: {
        invalidFields: string;
        /** `{n}` = nº (1-based) da linha incompleta — bloqueia o salvar em
         *  vez de descartar a linha em silêncio (execução 086, FE-02). */
        incompleteLine: {
          employees: string;
          equipments: string;
          products: string;
          productions: string;
          protections: string;
        };
      };
      createdToast: string;
      updatedToast: string;
    };
  };
}
