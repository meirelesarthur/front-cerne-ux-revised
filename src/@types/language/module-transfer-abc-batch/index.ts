// src/@types/language/module-transfer-abc-batch/index.ts
// Interface de tradução do módulo "Transferência ABC de Animais entre
// Lotes" (TransferAbcBatch — Operacional > Pecuária > Transferências,
// 97-Esteiras/039). O conteúdo mora em
// src/constants/languages/{idioma}/languageTransferAbcBatch.ts. Molde
// estrutural DIRETO de `module-farm-transfers/index.ts`, acrescido de
// `type.{entrada,saida}` (discriminador `type` 1/2, sem equivalente no
// irmão) e do bloco `form.fields.animal` (repeater de animais, mirror
// `form.fields.item` do irmão).
//
// Chave TOP-LEVEL `livestock` (Tarefa explícita, mirror do padrão de módulo
// próprio já usado por `farmTransfers`/`warehouseTransfers`).
export interface ModuleTransferAbcBatch {
  transferAbcBatch: {
    singularLabel: string;
    pluralLabel: string;
    type: {
      entrada: string;
      saida: string;
    };
    list: {
      columns: {
        code: string;
        date: string;
        description: string;
        type: string;
        user: string;
      };
      actions: {
        view: string;
        delete: string;
      };
      emptyState: {
        titleEmpty: string;
        descriptionEmpty: string;
        cta: string;
      };
      deletedToast: string;
      deleteConfirmMessage: string;
    };
    detail: {
      title: string;
      invalidParamsToast: {
        title: string;
        description: string;
      };
      notFound: {
        title: string;
        description: string;
      };
      fields: {
        code: string;
        date: string;
        type: string;
        description: string;
        user: string;
        provider: string;
        client: string;
        originBatch: string;
        destinationBatch: string;
      };
      animalsSectionTitle: string;
      animalsColumns: {
        animal: string;
        lastWeight: string;
        actualWeight: string;
        value: string;
        totalValue: string;
      };
      expensesSectionTitle: string;
      incomesSectionTitle: string;
      financialColumns: {
        code: string;
        note: string;
        amount: string;
        dueDate: string;
      };
      emptyFinancial: string;
      backButton: string;
      deleteButton: string;
    };
    form: {
      title: {
        create: string;
      };
      fields: {
        header: {
          code: string;
          date: string;
          type: string;
          description: string;
          provider: string;
          client: string;
          originBatch: string;
          destinationBatch: string;
        };
        animal: {
          animal: string;
          lastWeight: string;
          actualWeight: string;
          value: string;
          totalValue: string;
          addAnimal: string;
          removeAnimal: string;
          sectionTitle: string;
          emptyAnimals: string;
          duplicateAnimal: string;
          footerTotalLabel: string;
        };
        financial: {
          sectionTitle: string;
          allocationSectionTitle: string;
          number: string;
          typeTitle: string;
          proprietary: string;
          note: string;
          fiscalDocument: string;
          hasInput: string;
          inputDate: string;
          inputValue: string;
          category: string;
          categoryPlaceholder: string;
          costCenter: string;
          costCenterPlaceholder: string;
          planAccount: string;
          planAccountPlaceholder: string;
          value: string;
          percent: string;
          addRow: string;
          removeRow: string;
          emptyRows: string;
          sumLabel: string;
          sumHint: string;
          installmentsSectionTitle: string;
          installmentsCount: string;
          firstInstallmentDate: string;
          installmentsInterval: string;
          installmentDate: string;
          installmentValue: string;
          generateInstallments: string;
          regenerateInstallmentsConfirmTitle: string;
          regenerateInstallmentsConfirmDescription: string;
          installmentEntryBadge: string;
          emptyInstallments: string;
          installmentsSumLabel: string;
        };
      };
      hints: {
        originBatchHelp: string;
      };
      validation: {
        dateRequired: string;
        typeRequired: string;
        descriptionRequired: string;
        providerRequired: string;
        clientRequired: string;
        originBatchRequired: string;
        destinationBatchRequired: string;
        batchesMustDiffer: string;
        animalsMin: string;
        animalRequired: string;
        actualWeightRequired: string;
        valueRequired: string;
        numberType: string;
        financialNumberRequired: string;
        typeTitleRequired: string;
        proprietaryRequired: string;
        financialNoteRequired: string;
        inputDateRequired: string;
        inputValueRequired: string;
        installmentsMin: string;
        installmentDateRequired: string;
        installmentValueRequired: string;
        installmentsSumMismatch: string;
        fiscalDocumentRequired: string;
        hasInputRequired: string;
        installmentsCountRequired: string;
        firstInstallmentDateRequired: string;
        installmentsIntervalRequired: string;
        categoriesMin: string;
        categoryRequired: string;
        centerRequired: string;
        categoryValueRequired: string;
        categoriesSumMismatch: string;
      };
    };
  };
}
