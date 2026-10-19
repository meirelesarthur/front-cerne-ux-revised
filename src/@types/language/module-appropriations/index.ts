// src/@types/language/module-appropriations/index.ts
// Interface de tradução do módulo OPERACIONAL — Apontamentos (Appropriation)
// — domínio PRÓPRIO (mirror `module-planos`/`module-invoices`). O conteúdo
// mora em `src/constants/languages/{idioma}/languageAppropriations.ts`.
//
// TASK-FE-2705 (fundação) → TASK-FE-2706 (listagem+modal) → TASK-FE-2707
// (form cabeçalho+casca) → TASK-FE-2708 (MO/Serviços+Máq/Implementos) →
// TASK-FE-2709 (Insumos+Produção) → TASK-FE-2710 (Ocorrências+máquina de
// estados) → TASK-FE-2711 (Apropriar) → TASK-FE-2712 (Visualização).

export interface ModuleAppropriations {
  appropriation: {
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
        area: string;
        description: string;
        date: string;
        requester: string;
        createdAt: string;
      };
      actions: {
        view: string;
        edit: string;
        finish: string;
        appropriate: string;
        revertStatus: string;
        delete: string;
      };
      filter: {
        title: string;
        area: string;
        areaPlaceholder: string;
        startDate: string;
        endDate: string;
        status: string;
        statusAll: string;
      };
      extraButtons: {
        learnMore: string;
        payments: string;
        comingSoonHint: string;
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
      sections: {
        identification: string;
        agronomicClassification: string;
      };
      fields: {
        code: string;
        date: string;
        responsible: string;
        description: string;
        area: string;
        areaTotal: string;
        operation: string;
        activity: string;
        usedArea: string;
        cultivation: string;
        harvest: string;
        warehouseProduction: string;
      };
      placeholders: {
        area: string;
        operation: string;
        activity: string;
        cultivation: string;
        harvest: string;
        warehouseProduction: string;
      };
      tabs: {
        header: string;
        labor: string;
        equipment: string;
        stock: string;
        occurrences: string;
        production: string;
      };
      addItem: string;
      removeItem: string;
      emptyRow: string;
      editWarningNotOpened: string;
      errors: {
        invalidFields: string;
        usedAreaExceedsTotal: string;
        atLeastOneItemRequired: string;
        startHourPhotoRequired: string;
      };
      labor: {
        fields: {
          type: string;
          executor: string;
          measurement: string;
          quantity: string;
          typePayment: string;
          totalQuantity: string;
          amount: string;
          totalAmount: string;
        };
        placeholders: {
          type: string;
          executor: string;
          measurement: string;
        };
        typeOptions: {
          employee: string;
          function: string;
          provider: string;
        };
        paymentOptions: {
          quantityPerHectare: string;
          value: string;
        };
      };
      equipment: {
        fields: {
          equipment: string;
          startHourMeter: string;
          note: string;
          endHourMeter: string;
          amount: string;
          measurement: string;
          startHourPhoto: string;
          /** GAP-BE-653 (TASK-FE-716, execução 034) — Foto do Horímetro
           *  Final, exclusiva da tela de Finalização. */
          endHourPhoto: string;
        };
        placeholders: {
          equipment: string;
          measurement: string;
        };
        calculatedHint: string;
        photo: {
          dropzoneTitle: string;
          dropzoneDraggingTitle: string;
        };
      };
      stock: {
        fields: {
          warehouse: string;
          product: string;
          quantity: string;
          measurement: string;
          totalQuantity: string;
          stock: string;
        };
        placeholders: {
          warehouse: string;
          product: string;
          measurement: string;
        };
        // TASK-FE-701 (AP-32, execução 034) — modal de aviso quando "Qtd
        // Total" ultrapassa a quantidade em estoque, mirror do texto do
        // legado (`_product.blade.php:45-79`).
        stockExceedsDialog: {
          title: string;
          intro: string;
          informedQuantityLabel: string;
          productiveAreaLabel: string;
          stockQuantityLabel: string;
          footerNote: string;
          confirm: string;
        };
      };
      production: {
        fields: {
          product: string;
          // TASK-FE-645 (AP-16, execução 034) — mirror EXATO de
          // `stock.fields.measurement` (Insumos), mesma fonte de dado
          // (`listMeasurementOptions`), sem endpoint novo.
          measurement: string;
          quantity: string;
          note: string;
          amount: string;
          total: string;
          stock: string;
          finalQuantity: string;
          ph: string;
          phm: string;
          damaged: string;
          burned: string;
          others: string;
          impurities: string;
          qbImpurities: string;
          moisture: string;
          qbMoisture: string;
          rate: string;
          qbTechnique: string;
          cleaningDrying: string;
          broken: string;
          // TASK-FE-661 (AP-20+21+22, execução 034) — par "(Kg)" readonly
          // calculado de cada uma das 13 métricas percentuais acima (ver
          // `AppropriationProductionTab.tsx`, `ProductionItemRow`).
          phKg: string;
          phmKg: string;
          damagedKg: string;
          burnedKg: string;
          othersKg: string;
          impuritiesKg: string;
          qbImpuritiesKg: string;
          moistureKg: string;
          qbMoistureKg: string;
          rateKg: string;
          qbTechniqueKg: string;
          cleaningDryingKg: string;
          brokenKg: string;
        };
        placeholders: {
          product: string;
          measurement: string;
        };
        sections: {
          quality: string;
          values: string;
        };
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
          existingLabel: string;
          dropzoneTitle: string;
          dropzoneDraggingTitle: string;
        };
      };
      footer: {
        finish: string;
        finishConfirmTitle: string;
        finishConfirmDescription: string;
        appropriate: string;
        revertStatus: string;
        finishedToast: string;
        insufficientStockError: string;
      };
    };
    revertStatusModal: {
      title: string;
      currentStatus: string;
      newStatus: string;
      observation: string;
      observationPlaceholder: string;
      observationRequired: string;
      confirm: string;
      cancel: string;
      revertedToast: string;
    };
    appropriateScreen: {
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
      appropriatedToast: string;
    };
    finishScreen: {
      title: string;
      subtitle: string;
      headerTitle: string;
      submit: string;
      cancel: string;
      errors: {
        endHourMeterRequired: string;
        /** GAP-BE-653 (TASK-FE-716) — replica client-side do 422 do backend
         *  (`withValidator()`, `end_hour_meter < start_hour_meter`). Foto
         *  Final é OPCIONAL por item (contrato do Gap: `nullable`/ausente =
         *  sem foto) — sem mensagem de obrigatoriedade correspondente. */
        endHourMeterLessThanStart: string;
      };
    };
    detail: {
      title: string;
      actions: {
        edit: string;
        appropriate: string;
        revertStatus: string;
        delete: string;
        back: string;
      };
      sections: {
        header: string;
        labor: string;
        equipment: string;
        stock: string;
        production: string;
        occurrences: string;
        movements: string;
      };
      movementsTable: {
        date: string;
        user: string;
        previousStatus: string;
        currentStatus: string;
        observation: string;
        empty: string;
      };
      emptySection: string;
      costCenterLabel: string;
      notFound: {
        title: string;
        description: string;
        back: string;
      };
    };
    // Relatório de Apontamento Máquina (Tarefa 46, frontend-contract-
    // apontamento-maquina.md §7) — tela de exportação PDF/Excel, "gera e
    // sai", sem prévia — mirror EXATO do bloco `report` de
    // `evolutions.evolution.report`/`sanitary.sanitary.report`.
    report: {
      pageTitle: string;
      pageSubtitle: string;
      filter: {
        startDate: string;
        endDate: string;
      };
      exportPdf: string;
      exportXlsx: string;
      toasts: {
        success: string;
        genericError: string;
      };
      hint: {
        datesRequired: string;
      };
    };
  };
}
