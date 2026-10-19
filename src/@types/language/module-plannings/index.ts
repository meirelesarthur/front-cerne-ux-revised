// src/@types/language/module-plannings/index.ts
// Interface de tradução do módulo OPERACIONAL/Agricultura — Planejamentos
// (Planning) — domínio PRÓPRIO (mirror `module-service-orders`). O conteúdo
// mora em `src/constants/languages/{idioma}/languagePlannings.ts`.
//
// TASK-FE-PLAN-01 (execução `97-Esteiras/007`) — fatia LISTAGEM (index +
// exclusão). TASK-FE-PLAN-02 acrescenta, ADITIVAMENTE, `form` (form raiz
// create/edit) e `tree` (casca da árvore) — sem tocar `list`. TASK-FE-PLAN-03
// acrescenta `tree.cultivation` (nível 1). TASK-FE-PLAN-04 acrescenta
// `tree.operation` (nível 2, SUR-13..16) e `tree.production` (linha fixa "1.
// Produção", SUR-17). Blocos de níveis 3..4 da árvore (`TASK-FE-PLAN-05`..
// `07`) ficam para depois.

export interface ModulePlannings {
  planning: {
    singularLabel: string;
    pluralLabel: string;
    list: {
      pageTitle: string;
      pageSubtitle: string;
      deletedToast: string;
      /** `TASK-FE-PLAN-08` (SUR-07) — toast de sucesso de "Duplicar"
       *  (`useRequest.personalizedMessage`, mirror `Fabrica/index.tsx`). */
      duplicatedToast: string;
      /** `TASK-FE-PLAN-08` (SUR-08) — toast genérico de erro de "Imprimir"
       *  (resposta é `blob`, NUNCA lida como JSON — mirror `Fabrica/
       *  index.tsx::handlePrintReport`). */
      reportErrorToast: string;
      /** Legenda de status — deriva a options factory de status
       *  (`planning-status-options.ts`), mirror
       *  `ServiceOrderStatusMeta`/`statusLegend`. `status_label` que vem no
       *  Resource é usado direto na linha da grid; esta legenda é só para a
       *  fábrica/legenda client-side. */
      statusLabels: {
        pending: string;
        released: string;
        closed: string;
      };
      table: {
        status: string;
        code: string;
        harvest: string;
        responsible: string;
        planningTotal: string;
        planningArea: string;
      };
      actions: {
        edit: string;
        duplicate: string;
        print: string;
        delete: string;
      };
      deleteConfirm: {
        header: string;
        body: string;
      };
      emptyState: {
        title: string;
        description: string;
        cta: string;
      };
    };
    /** Form raiz (create/edit, FLD-01..12) — `CreateOrUpdatePlanning.tsx`,
     *  `TASK-FE-PLAN-02`. */
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
        codeGeneratedPlaceholder: string;
        responsible: string;
        harvest: string;
        createdAt: string;
        area: string;
        areaTotal: string;
        plantedArea: string;
        availableArea: string;
        status: string;
        commercialDollar: string;
        realSc: string;
        planningTotal: string;
        planningArea: string;
      };
      placeholders: {
        harvest: string;
        area: string;
        status: string;
      };
      errors: {
        required: string;
      };
      unsavedChangesDialog: {
        title: string;
        description: string;
        confirmButton: string;
      };
    };
    /** Casca da árvore (`PlanningTree.tsx`, `TASK-FE-PLAN-02`) — 3 estados
     *  (skeleton/empty/error); nível 1 (Cultura/Variedade) é
     *  `TASK-FE-PLAN-03`. */
    tree: {
      title: string;
      empty: {
        title: string;
        description: string;
      };
      error: {
        title: string;
        description: string;
      };
      /** Nível 1 — Cultura/Variedade (`PlanningCultivationSection.tsx` +
       *  `PlanningCultivationDialog.tsx`, `TASK-FE-PLAN-03`, SUR-10..12). */
      cultivation: {
        singularLabel: string;
        actions: {
          new: string;
          edit: string;
          delete: string;
        };
        deletedToast: string;
        deleteConfirm: {
          header: string;
          body: string;
        };
        dialog: {
          title: {
            create: string;
            edit: string;
          };
          fields: {
            cultivation: string;
            variety: string;
            startDate: string;
            endDate: string;
            startPlantingDate: string;
            cycle: string;
            forecast: string;
          };
          placeholders: {
            cultivation: string;
            variety: string;
            varietyNoCultivation: string;
          };
          errors: {
            required: string;
          };
          createdToast: string;
          updatedToast: string;
        };
      };
      /** Nível 2 — Operações do cultivo (`PlanningOperationSection.tsx` +
       *  `PlanningOperationDialog.tsx`, `TASK-FE-PLAN-04`, SUR-13..16). */
      operation: {
        singularLabel: string;
        actions: {
          new: string;
          definePeriod: string;
          delete: string;
        };
        deletedToast: string;
        empty: {
          title: string;
          description: string;
        };
        deleteConfirm: {
          header: string;
          body: string;
        };
        dialog: {
          title: {
            create: string;
            definePeriod: string;
          };
          fields: {
            operation: string;
            startDate: string;
            endDate: string;
          };
          placeholders: {
            operation: string;
          };
          errors: {
            required: string;
          };
          actions: {
            definePeriodSubmit: string;
          };
          createdToast: string;
          updatedToast: string;
        };
      };
      /** Linha fixa "1. Produção" (`PlanningProductionDialog.tsx`,
       *  `TASK-FE-PLAN-04`, SUR-17) — reaproveita `PlanningCultivation`
       *  (armadilha 2: não é uma entidade própria). */
      production: {
        singularLabel: string;
        rowLabel: string;
        actions: {
          edit: string;
        };
        dialog: {
          title: string;
          fields: {
            cultivation: string;
            productionQuantity: string;
          };
          errors: {
            required: string;
          };
          updatedToast: string;
        };
      };
      /** Nível 3 — Atividades da operação (`PlanningActivitySection.tsx` +
       *  `PlanningActivityDialog.tsx`, `TASK-FE-PLAN-05`, SUR-18..20). Sem
       *  `employee_id`/`description`/`use_app`/`anticipate` — código morto
       *  removido do legado em 2023 (`GAP-PLAN-ACT-EMPLOYEE-01`,
       *  `[AVALIADO]`). */
      activity: {
        singularLabel: string;
        actions: {
          new: string;
          edit: string;
          delete: string;
        };
        deletedToast: string;
        empty: {
          title: string;
          description: string;
        };
        deleteConfirm: {
          header: string;
          body: string;
        };
        dialog: {
          title: {
            create: string;
            edit: string;
          };
          fields: {
            activity: string;
            startDate: string;
            endDate: string;
          };
          placeholders: {
            activity: string;
          };
          errors: {
            required: string;
          };
          createdToast: string;
          updatedToast: string;
        };
      };
      /** Grupo fixo "Outros" do cultivo — Outras Atividades
       *  (`PlanningOtherActivitiesSection.tsx` + `PlanningOtherActivities
       *  Dialog.tsx`, `TASK-FE-PLAN-07`, SUR-30..32). Filha do CULTIVO, NÃO
       *  da atividade (armadilha 1 da Tarefa). Diálogo SÓ de criação — sem
       *  edição exposta (armadilha 2, `AM-17`/`C-26`). */
      otherActivity: {
        singularLabel: string;
        actions: {
          new: string;
          delete: string;
        };
        deletedToast: string;
        empty: {
          title: string;
          description: string;
        };
        deleteConfirm: {
          header: string;
          body: string;
        };
        dialog: {
          title: string;
          fields: {
            activity: string;
            quantity: string;
            amount: string;
            total: string;
          };
          placeholders: {
            activity: string;
          };
          errors: {
            required: string;
          };
          totalHelperText: string;
          createdToast: string;
        };
      };
      /** Nível 4a — Insumos (Produto) de uma atividade
       *  (`PlanningActivityProductSection.tsx` + `PlanningActivityProduct
       *  Dialog.tsx`, `TASK-FE-PLAN-06`, SUR-21..23). Cascata
       *  Armazém→Produto→Unidade→Estoque (degradada — `GAP-PLAN-FE-06`). */
      product: {
        singularLabel: string;
        actions: {
          new: string;
          edit: string;
          delete: string;
        };
        deletedToast: string;
        empty: {
          title: string;
          description: string;
        };
        deleteConfirm: {
          header: string;
          body: string;
        };
        dialog: {
          title: {
            create: string;
            edit: string;
          };
          fields: {
            warehouse: string;
            product: string;
            measurement: string;
            stock: string;
            quantity: string;
            amount: string;
            total: string;
          };
          placeholders: {
            warehouse: string;
            product: string;
          };
          errors: {
            required: string;
          };
          stockHelperText: string;
          totalHelperText: string;
          createdToast: string;
          updatedToast: string;
        };
      };
      /** Nível 4b — Equipamentos de uma atividade
       *  (`PlanningActivityEquipmentSection.tsx` + `PlanningActivityEquipment
       *  Dialog.tsx`, `TASK-FE-PLAN-06`, SUR-24..26). Autofill
       *  `measurement`='H'+`amount`=`vl_time_productive` (`GAP-PLAN-FE-06`). */
      equipment: {
        singularLabel: string;
        actions: {
          new: string;
          edit: string;
          delete: string;
        };
        deletedToast: string;
        empty: {
          title: string;
          description: string;
        };
        deleteConfirm: {
          header: string;
          body: string;
        };
        dialog: {
          title: {
            create: string;
            edit: string;
          };
          fields: {
            equipment: string;
            measurement: string;
            quantity: string;
            amount: string;
            total: string;
          };
          placeholders: {
            equipment: string;
          };
          errors: {
            required: string;
          };
          totalHelperText: string;
          createdToast: string;
          updatedToast: string;
        };
      };
      /** Nível 4c — MO/Serviços de uma atividade
       *  (`PlanningActivityFunctionSection.tsx` + `PlanningActivityFunction
       *  Dialog.tsx`, `TASK-FE-PLAN-06`, SUR-27..29). Cascata
       *  Executor→Funcionário (degradada — `GAP-PLAN-FE-06`). `DELETE` real
       *  (corrige `C-32`). */
      function: {
        singularLabel: string;
        actions: {
          new: string;
          edit: string;
          delete: string;
        };
        deletedToast: string;
        empty: {
          title: string;
          description: string;
        };
        deleteConfirm: {
          header: string;
          body: string;
        };
        /** Indicador textual genérico na linha da lista quando há
         *  funcionário vinculado — nunca renderiza o `uuid` cru. */
        employeeAssignedBadge: string;
        dialog: {
          title: {
            create: string;
            edit: string;
          };
          fields: {
            executor: string;
            employee: string;
            measurement: string;
            quantity: string;
            amount: string;
            total: string;
          };
          placeholders: {
            executor: string;
            employee: string;
          };
          errors: {
            required: string;
          };
          totalHelperText: string;
          /** Placeholder neutro exibido enquanto/se o nome do funcionário
           *  vinculado não puder ser resolvido (`getEmployeeByUuid`,
           *  GATEADO por `employees_view` — `GAP-PLAN-FE-06`). Nunca o
           *  `uuid` cru. */
          employeeUnresolvedLabel: string;
          createdToast: string;
          updatedToast: string;
        };
      };
    };
  };
}
