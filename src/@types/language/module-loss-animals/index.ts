// src/@types/language/module-loss-animals/index.ts
// Interface de tradução do módulo de PERDAS (LossAnimal — Operacional /
// Pecuária, F-043, execução 040). Mirror `module-death-losses` (bloco
// `list`/`form`), MAIS o bloco `filter` (drawer de 4 campos, ausente em
// DeathLoss) e `detailTitle`/`form.fields.{responsible,animal,cause,batch}`
// (campos extras do domínio Operacional).
//
// O conteúdo mora em
// src/constants/languages/{idioma}/languageLossAnimal.ts.

export interface ModuleLossAnimals {
  lossAnimal: {
    singularLabel: string;
    pluralLabel: string;
    titleModule: string;
    detailTitle: string;
    list: {
      pageTitle: string;
      pageSubtitle: string;
      deletedToast: string;
      table: {
        code: string;
        animal: string;
        /** FID-G5 (execução 040) — legado exibe `animal->category->description`. */
        category: string;
        cause: string;
        date: string;
      };
      actions: {
        view: string;
        edit: string;
        delete: string;
      };
      emptyState: {
        titleEmpty: string;
        descriptionEmpty: string;
        titleEmptyNoCreate: string;
        descriptionEmptyNoCreate: string;
        cta: string;
      };
      deleteConfirm: {
        title: string;
        description: string;
        warning: string;
      };
      deleteBusinessError: string;
    };
    filter: {
      title: string;
      animal: string;
      cause: string;
      startDate: string;
      endDate: string;
    };
    form: {
      title: { create: string; edit: string };
      fields: {
        code: string;
        codePlaceholder: string;
        date: string;
        responsible: string;
        batch: string;
        animal: string;
        cause: string;
        note: string;
      };
      placeholders: {
        batch: string;
        animal: string;
        cause: string;
        note: string;
      };
      validation: {
        dateRequired: string;
        animalRequired: string;
        causeRequired: string;
        /** TASK-BE-1078/TASK-FE-2780 (FID-043-03) — mensagens do
         *  `GET /loss-animals/check-date`, mirror LITERAL do legado
         *  `CheckDatesController` (palavra por palavra). */
        checkDate: {
          animalEntryAfterLossDate: string;
          batchCreationAfterMovementDate: string;
        };
      };
    };
  };
}
