// src/@types/language/module-animal-fazenda/index.ts
// Interface de tradução do módulo "Animal/Fazenda" (TransferAnimalFarm —
// Operacional > Pecuária > Transferências, 97-Esteiras/042,
// TASK-FE-042-101..106). O conteúdo mora em
// src/constants/languages/{idioma}/languageAnimalFazenda.ts. Molde estrutural
// DIRETO de `module-lote-fazenda/index.ts` (mesma classe de feature: grid +
// create + subfluxo financeiro com rateio/parcelas), acrescido do seletor de
// animais por categoria (`animalSelector`, sem precedente na irmã) e da tela
// Visualizar (`show`, a irmã não tem).
//
// Chave TOP-LEVEL `animalFazenda` — LIVRE, sem colisão com `livestock`/
// `loteFazenda`.
export interface ModuleAnimalFazenda {
  animalFazenda: {
    transferAnimalFarm: {
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
          farmFrom: string;
          farmTo: string;
          financial: string;
          status: string;
        };
        actions: {
          view: string;
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
            farmTo: string;
            category: string;
            hasFinancial: string;
          };
          animalSelector: {
            batchFilter: string;
            categoryFilter: string;
            selectAllButton: string;
            unselectAllButton: string;
            selectedOfTotal: string;
            emptyFilter: string;
            emptyAnimals: string;
            aggregatesTitle: string;
            aggregates: {
              total: string;
              weight: string;
              average: string;
              ua: string;
              uaAverage: string;
            };
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
            // DIV-08 (063-est03-9-reprovacoes) — "Possui entrada?" restaurado.
            hasInput: string;
            inputDate: string;
            inputValue: string;
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
              inputDateRequired: string;
              inputValueRequired: string;
              installmentsMin: string;
              installmentsSumMismatch: string;
              categoryRequired: string;
              centerRequired: string;
              categoryValueRequired: string;
              categoriesMin: string;
              categoriesSumMismatch: string;
            };
          };
        };
        hints: {
          categoryFilterHelp: string;
        };
        validation: {
          dateRequired: string;
          farmToRequired: string;
          animalsRequired: string;
        };
      };
      show: {
        title: string;
        fields: {
          code: string;
          date: string;
          createdAt: string;
          status: string;
          farmFrom: string;
          farmTo: string;
          category: string;
          employee: string;
          hasFinancial: string;
        };
        animalsSectionTitle: string;
        animalsColumns: {
          identification: string;
        };
        emptyAnimals: string;
        notFoundTitle: string;
        notFoundDescription: string;
        backButton: string;
        invalidParamsToast: {
          title: string;
          description: string;
        };
      };
      addButton: string;
      processButton: string;
    };
  };
}
