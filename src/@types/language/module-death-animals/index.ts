// src/@types/language/module-death-animals/index.ts
// Interface de tradução do módulo OPERACIONAL — Mortes (DeathAnimal —
// Pecuária, TASK-DA-FE-01/02). Mirror `module-feedlot-sectors` (par
// singular/plural, list/filter/detail/form/status), com os campos próprios
// desta feature: foto (`ImageUpload`), Funcionário Responsável (`userName`),
// fallback de `animal`/`batch` nulos, guarda de data (`dateWarning`).
//
// O conteúdo mora em
// src/constants/languages/{idioma}/languageDeathAnimals.ts.

export interface ModuleDeathAnimals {
  deathAnimal: {
    singularLabel: string;
    pluralLabel: string;
    list: {
      pageTitle: string;
      pageSubtitle: string;
      deletedToast: string;
      table: {
        code: string;
        animal: string;
        animalEmpty: string;
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
        titleFiltered: string;
        descriptionFiltered: string;
        cta: string;
      };
    };
    filter: {
      title: string;
      animalIdentification: string;
      animalIdentificationPlaceholder: string;
      cause: string;
      causePlaceholder: string;
      startDate: string;
      endDate: string;
    };
    /** Tela de Detalhe (view) — exibe todos os campos do Resource, incluindo "Funcionário Responsável". */
    detail: {
      generalData: { title: string };
      fields: {
        code: string;
        date: string;
        userName: string;
        batch: string;
        batchEmpty: string;
        animal: string;
        animalEmpty: string;
        cause: string;
        note: string;
        noteEmpty: string;
      };
      actions: { edit: string; back: string };
      notFound: { title: string; description: string; back: string };
    };
    /** Formulário de criação/edição (TASK-DA-FE-02) — 8 campos na ordem do legado. */
    form: {
      title: { create: string; edit: string };
      fields: {
        photo: string;
        code: string;
        date: string;
        userName: string;
        batch: string;
        animal: string;
        cause: string;
        note: string;
      };
      placeholders: {
        batch: string;
        animal: string;
        cause: string;
      };
      hints: {
        codeGeneratedOnSave: string;
        photoAccepted: string;
        photoMaxSize: string;
      };
      image: {
        dropzoneTitle: string;
        dropzoneDragging: string;
        changeLabel: string;
        removeLabel: string;
        errorType: string;
        errorSize: string;
      };
      validation: {
        dateRequired: string;
        batchRequired: string;
        animalRequired: string;
        causeRequired: string;
      };
      dateWarning: { title: string };
    };
  };
}
