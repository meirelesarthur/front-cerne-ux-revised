// src/@types/language/module-lote-fazenda/index.ts
// Interface de tradução do módulo "Lote/Fazenda" (TransferBatchFarm —
// Operacional > Pecuária > Transferências, 97-Esteiras/041,
// TASK-FE-041-LF-01..04). O conteúdo mora em
// src/constants/languages/{idioma}/languageLoteFazenda.ts. Molde estrutural
// DIRETO de `module-transfer-abc-batch/index.ts` (mesma classe de feature:
// grid + create + subfluxo financeiro com rateio/parcelas), acrescido dos
// blocos "Importar" (mirror `module-rainfalls`), "Novo Lote" e "Módulo/Área"
// (modais aditivos do wizard de Processamentos).
//
// Chave TOP-LEVEL `loteFazenda` — LIVRE, sem colisão com `livestock`
// (`transferAbcBatch`, feature intra-fazenda DIFERENTE).
export interface ModuleLoteFazenda {
  loteFazenda: {
    transferBatchFarm: {
      singularLabel: string;
      pluralLabel: string;
      status: {
        pending: string;
        processing: string;
        finished: string;
        canceled: string;
      };
      list: {
        columns: {
          code: string;
          date: string;
          employee: string;
          batch: string;
          farmFrom: string;
          farmTo: string;
          financial: string;
          status: string;
        };
        actions: {
          cancel: string;
          generateFinancial: string;
          process: string;
        };
        emptyState: {
          titleEmpty: string;
          descriptionEmpty: string;
        };
        cancelConfirmTitle: string;
        cancelConfirmMessage: string;
        canceledToast: string;
        receiveConfirmTitle: string;
        receiveConfirmMessage: string;
        receivedToast: string;
      };
      form: {
        title: {
          create: string;
        };
        fields: {
          header: {
            code: string;
            date: string;
            employee: string;
            category: string;
            batch: string;
            farmTo: string;
            hasFinancial: string;
          };
          financial: {
            sectionTitle: string;
            vlTotal: string;
            fiscalDocument: string;
            proprietary: string;
            installmentsSectionTitle: string;
            installmentsCount: string;
            firstInstallmentDate: string;
            installmentsInterval: string;
            installmentDate: string;
            installmentValue: string;
            generateInstallments: string;
            regenerateInstallmentsConfirmTitle: string;
            regenerateInstallmentsConfirmDescription: string;
            emptyInstallments: string;
            installmentsSumLabel: string;
            incomeSectionTitle: string;
            expenseSectionTitle: string;
            category: string;
            categoryPlaceholder: string;
            costCenter: string;
            costCenterPlaceholder: string;
            value: string;
            addRow: string;
            removeRow: string;
            emptyRows: string;
            sumLabel: string;
            sumHint: string;
            hasInput: string;
            inputDate: string;
            inputValue: string;
            reportReceivableButton: string;
            reportPayableButton: string;
            reportErrorToast: string;
            reportPopupBlockedToast: string;
            backButton: string;
            saveButton: string;
            savedToast: string;
            notFoundTitle: string;
            notFoundDescription: string;
            validation: {
              vlTotalRequired: string;
              fiscalDocumentRequired: string;
              numberType: string;
              installmentsCountRequired: string;
              firstInstallmentDateRequired: string;
              installmentsIntervalRequired: string;
              installmentDateRequired: string;
              installmentValueRequired: string;
              installmentsMin: string;
              installmentsSumMismatch: string;
              categoryRequired: string;
              centerRequired: string;
              categoryValueRequired: string;
              categoriesMin: string;
              categoriesSumMismatch: string;
              inputDateRequired: string;
              inputValueRequired: string;
            };
          };
        };
        hints: {
          batchHelp: string;
        };
        animalsCountLabel: string;
        eligibleAnimalsByCategory: {
          countLabel: string;
        };
        validation: {
          dateRequired: string;
          batchRequired: string;
          farmToRequired: string;
        };
      };
      import: {
        title: string;
        subtitle: string;
        downloadShortcut: string;
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
        rowErrorsTitle: string;
        cancelButton: string;
        submitButton: string;
        successToast: string;
        downloadTemplateError: string;
      };
      addButton: string;
      importButton: string;
      processButton: string;
    };
    newBatch: {
      title: string;
      openButton: string;
      fields: {
        description: string;
        date: string;
        employee: string;
        specie: string;
        categories: string;
        corral: string;
        parameterWeight: string;
      };
      submitButton: string;
      cancelButton: string;
      createdToast: string;
      validation: {
        descriptionRequired: string;
        dateRequired: string;
        specieRequired: string;
        categoriesRequired: string;
      };
    };
    changeBatchModuleArea: {
      title: string;
      fields: {
        code: string;
        date: string;
        batch: string;
        qtd: string;
        employee: string;
        area: string;
        grazing: string;
      };
      submitButton: string;
      cancelButton: string;
      successToast: string;
      validation: {
        codeRequired: string;
        dateRequired: string;
        batchRequired: string;
        areaOrGrazingRequired: string;
      };
    };
  };
}
