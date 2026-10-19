// src/@types/language/module-invoices/index.ts
// Interface de tradução do módulo "Doc. Fiscal/Entrada" (Invoice) — domínio
// PRÓPRIO (mirror `module-planos`/`module-warehouses`), NÃO sub-módulo de
// `module-base-registrations`. Conteúdo em
// `src/constants/languages/{idioma}/languageInvoices.ts`.
//
// TASK-FE-2760 (fundação) → TASK-FE-2761 (validação) → TASK-FE-2762
// (listagem) → TASK-FE-2763..2766 (formulário, casca+4 abas) → TASK-FE-2768
// (visualização) → TASK-FE-2769 (roteamento, sem chave nova).

export interface ModuleInvoices {
  invoice: {
    singularLabel: string;
    pluralLabel: string;

    documentTypeOptions: {
      nfe: string;
      cte: string;
      nfse: string;
      nfce: string;
      danfe: string;
      darf: string;
      dare: string;
      gru: string;
    };
    classificationOptions: {
      notClassified: string;
      capex: string;
      opex: string;
    };
    apportionmentTypeOptions: {
      value: string;
      product: string;
    };
    appropriationTypeOptions: {
      none: string;
      agriculture: string;
      pasture: string;
      equipmentMaintenance: string;
      fueling: string;
      unavailableSuffix: string;
    };

    list: {
      pageTitle: string;
      pageSubtitle: string;
      deletedToast: string;
      table: {
        number: string;
        series: string;
        provider: string;
        dtEmission: string;
        type: string;
        vlTotal: string;
        code: string;
      };
      actions: {
        view: string;
        edit: string;
        print: string;
        delete: string;
      };
      emptyState: {
        titleEmpty: string;
        descriptionEmpty: string;
        titleFiltered: string;
        descriptionFiltered: string;
        cta: string;
      };
      deleteConfirm: {
        title: string;
        description: string;
        blockedByExpenseMovementError: string;
      };
    };

    filter: {
      title: string;
      number: string;
      numberPlaceholder: string;
      provider: string;
      dtEmissionFrom: string;
      dtEmissionTo: string;
      product: string;
      proprietary: string;
      vlTotal: string;
    };

    form: {
      title: { create: string; edit: string };
      subtitle: { create: string; edit: string };
      tabs: {
        header: string;
        items: string;
        installments: string;
        apportionment: string;
      };
      fields: {
        number: string;
        series: string;
        provider: string;
        proprietary: string;
        stateRegistration: string;
        harvest: string;
        dtEmission: string;
        deliveryDate: string;
        state: string;
        typeTitle: string;
        type: string;
        classification: string;
        apportionmentType: string;
        nfeKey: string;
        note: string;

        product: string;
        measurement: string;
        quantity: string;
        amount: string;
        discount: string;
        totalAmount: string;
        generatesStock: string;
        warehouse: string;
        appropriationType: string;
        ipi: string;
        icms: string;
        providerLot: string;
        shelfLife: string;
        financialCategory: string;
        costCenter: string;
        cultivation: string;
        addsToInventory: string;
        /** TASK-FE-625 (DF-05) — "Cultura" do bloco Apropriação Agrícola
         *  (`aprop_cultivation_uuid`), DISTINTO de `cultivation` acima
         *  ("Classificação", campo geral do item). */
        apropCultivation: string;
        area: string;
        activity: string;
        operation: string;
        equipmentFamily: string;
        equipmentDescription: string;
        equipmentProductiveTime: string;
        equipmentAcquisitionValue: string;
        equipmentStatus: string;
        equipmentStatusActive: string;
        equipmentStatusInactive: string;
        // TASK-FE-629/630/631 (DF-10, execução 035) — ~19 campos novos do
        // Modal "Dados do Bem para Inventário", mirror 1:1 dos labels já
        // usados em `CreateOrUpdateEquipamento.tsx`/
        // `EquipamentoFiscalVeiculoTab.tsx`/
        // `EquipamentoFinanceiroDepreciacaoTab.tsx` (não inventar texto novo).
        equipmentProprietary: string;
        equipmentType: string;
        equipmentTypeOwn: string;
        equipmentHourMeter: string;
        equipmentYearMod: string;
        equipmentBrand: string;
        equipmentPatrimony: string;
        equipmentColor: string;
        equipmentModel: string;
        equipmentChassi: string;
        equipmentRenavam: string;
        equipmentSerie: string;
        equipmentPlate: string;
        equipmentUf: string;
        equipmentHasDepreciation: string;
        equipmentDepreciationType: string;
        equipmentDepreciationTypeWithResidual: string;
        equipmentDepreciationTypeWithoutResidual: string;
        equipmentResidual: string;
        equipmentLifeBens: string;
        equipmentDepreciationPercent: string;
        /** Preview client-side (calculado, nunca enviado no payload — GAP-BE-623). */
        equipmentVlResidual: string;
        /** Preview client-side (calculado, nunca enviado no payload — GAP-BE-623). */
        equipmentVlDepreciate: string;
        equipmentDtAcquisition: string;
        equipmentSpecification: string;

        hasDownPayment: string;
        downPaymentDate: string;
        downPaymentValue: string;
        installmentCount: string;
        firstDueDate: string;
        intervalDays: string;

        percentage: string;
        apportionedValue: string;
        automaticWriteOff: string;
        bankAccount: string;
        balance: string;
        movementDate: string;
      };
      placeholders: {
        number: string;
        series: string;
        provider: string;
        proprietary: string;
        harvest: string;
        state: string;
        typeTitle: string;
        type: string;
        classification: string;
        apportionmentType: string;
        product: string;
        warehouse: string;
        financialCategory: string;
        costCenter: string;
        cultivation: string;
        appropriationType: string;
        apropCultivation: string;
        area: string;
        activity: string;
        operation: string;
        equipmentFamily: string;
        equipmentProprietary: string;
        equipmentUf: string;
      };
      sections: {
        header: string;
        items: string;
        totals: string;
        installments: string;
        apportionment: string;
        equipment: string;
        installmentGenerator: string;
        writeOff: string;
        /** Título do Modal "Dados do Bem para Inventário" (TASK-FE-629/630/631). */
        equipmentModalTitle: string;
        /** Cabeçalhos de seção do card do item (TASK-FE-646/DF-11). */
        itemProductAndQuantity: string;
        itemStockAndAppropriation: string;
        itemFiscalAndClassification: string;
      };
      // TASK-FE-628 (DF-03, execução 035) — Upload XML NFe (parse+prefill).
      xmlImport: {
        buttonLabel: string;
        modalTitle: string;
        modalSubtitle: string;
        fileUpload: {
          label: string;
          hint: string;
          dropzoneTitle: string;
          dropzoneDraggingTitle: string;
          changeLabel: string;
          removeLabel: string;
          errorTypeMessage: string;
          errorSizeMessage: string;
        };
        submitButton: string;
        cancelButton: string;
        successToast: string;
        genericError: string;
        providerUnmatchedHint: string;
      };
      // TASK-FE-629/630/631 (DF-10, execução 035) — Modal "Dados do Bem para
      // Inventário" (Dialog v3, 3 abas), gatilho na linha de item.
      equipmentModal: {
        triggerButton: string;
        /** Toggle do painel inline colapsável (TASK-FE-648/DF-18). */
        showButton: string;
        hideButton: string;
        tabs: {
          identification: string;
          fiscalVehicle: string;
          financial: string;
        };
      };
      // TASK-FE-668 (DF-25, rework, execução 034) — Modal "Criar Produto a
      // partir do XML" (substitui o antigo `window.open` em nova aba,
      // `itemRow.createProductFromXmlButton`).
      createProductFromXmlModal: {
        title: string;
        subtitle: string;
        cancelButton: string;
        saveButton: string;
        successToast: string;
      };
      totalsFields: {
        vlItems: string;
        vlIpi: string;
        vlDiscount: string;
        vlFreight: string;
        vlSafe: string;
        vlExpense: string;
        conveyor: string;
        vlTotal: string;
      };
      itemRow: {
        addButton: string;
        removeButton: string;
        emptyLabel: string;
        /** GAP-BE-630/DF-13 (TASK-FE-653) — item de XML sem Produto casado
         *  (`product_matched===false`): botão "+" ao lado do Select
         *  "Produto" que abre o cadastro de Produto em nova aba, com a
         *  descrição/NCM do XML como hint (NÃO auto-cria). */
        createProductFromXmlButton: string;
        /** Prefixo exibido junto da descrição crua do XML quando o item
         *  não casou com nenhum Produto existente. */
        xmlUnmatchedHintPrefix: string;
      };
      installmentRow: {
        dueDate: string;
        value: string;
        addButton: string;
        removeButton: string;
        emptyLabel: string;
        generateButton: string;
        overwriteConfirm: string;
        sumBadgeLabel: string;
      };
      apportionmentRow: {
        addButton: string;
        removeButton: string;
        emptyLabel: string;
        sumBadgeLabel: string;
      };
      writeOffDisabledHint: string;
      hints: {
        classificationDefault: string;
        appropriationBranchUnavailable: string;
        farmFromSwitcher: string;
        branchNotMigrated: string;
        providerQuickAddUnavailable: string;
        lotRequiredWhenHasLot: string;
        writeOnlyDisabledInEdit: string;
      };
      duplicateAlert: {
        title: string;
        dismissAction: string;
      };
      validation: {
        numberRequired: string;
        seriesRequired: string;
        dtEmissionRequired: string;
        providerRequired: string;
        proprietaryRequired: string;
        stateRequired: string;
        typeTitleRequired: string;
        typeRequired: string;
        apportionmentTypeRequired: string;

        itemsRequired: string;
        productRequired: string;
        quantityRequired: string;
        quantityMin: string;
        amountRequired: string;
        warehouseRequiredWhenGeneratesStock: string;

        installmentsRequired: string;
        dueDateRequired: string;
        valueRequired: string;
        installmentsSum: string;

        categoriesRequired: string;
        categoryRequired: string;
        percentageRequired: string;
        percentageMax100: string;
        categoriesPercentageSum100: string;
        centerRequired: string;
        itemCategoryRequiredWhenApportionmentProduct: string;
        itemCenterRequiredWhenApportionmentProduct: string;

        // TASK-FE-629/630/631 (DF-10) — Modal "Dados do Bem para
        // Inventário", mirror 1:1 das mensagens de `equipment-schema.ts`.
        equipmentYearModMaxLength: string;
        equipmentPatrimonyMaxLength: string;
        equipmentChassiMaxLength: string;
        equipmentRenavamMaxLength: string;
        equipmentSerieMaxLength: string;
        equipmentPlateMaxLength: string;
        equipmentColorMaxLength: string;
        equipmentModelMaxLength: string;
        equipmentResidualRequiredWithResidualType: string;
        equipmentSpecificationMaxLength: string;
      };
      errors: {
        invalidFields: string;
      };
    };

    detail: {
      title: string;
      sections: {
        header: string;
        items: string;
        totals: string;
        installments: string;
        apportionment: string;
      };
      printButton: string;
      emptyInstallments: string;
      emptyApportionment: string;
      emptyItems: string;
      apportionmentUnavailable: string;
      notFound: {
        title: string;
        description: string;
        back: string;
      };
      actions: {
        edit: string;
      };
      table: {
        noData: string;
        installment: string;
        dueDate: string;
        value: string;
        balance: string;
      };
    };
  };
}
