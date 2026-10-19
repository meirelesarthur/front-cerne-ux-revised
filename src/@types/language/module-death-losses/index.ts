// src/@types/language/module-death-losses/index.ts
// Interface de tradução do módulo de CAUSA MORTE/PERDA (DeathLoss —
// Cadastros Base / Pecuária). Mirror `module-breeds`, SEM bloco `filter`
// (não há drawer nesta tela — fidelidade ao legado, `DeathLoss-contrato.md
// §16`), MAIS `form.fields.cause`/`form.placeholders.cause` e opções
// `causeOptions.death`/`causeOptions.loss` + `list.table.cause`.
//
// O conteúdo mora em
// src/constants/languages/{idioma}/languageCausaMortePerda.ts.

export interface ModuleDeathLosses {
  deathLoss: {
    singularLabel: string;
    list: {
      pageTitle: string;
      pageSubtitle: string;
      deletedToast: string;
      table: {
        description: string;
        cause: string;
        specie: string;
        active: string;
        activeLabel: string;
        inactiveLabel: string;
      };
      actions: {
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
      /** Copy do `DeleteConfirmDialog` — deixa claro que a exclusão é DEFINITIVA (`DeathLoss` não usa SoftDeletes). */
      deleteConfirm: {
        title: string;
        description: string;
        warning: string;
      };
    };
    /** Formulário de criação/edição — 4 campos: description, cause, is_enabled, specie_uuid (Select obrigatório). */
    form: {
      title: { create: string; edit: string };
      subtitle: { create: string; edit: string };
      fields: {
        description: string;
        cause: string;
        isEnabled: string;
        specie: string;
        /** Rótulos do enum `cause` — reutilizados no Select do formulário e no Badge da grid. */
        causeOptions: {
          death: string;
          loss: string;
        };
      };
      placeholders: {
        description: string;
        cause: string;
        specie: string;
      };
      hints: {
        specieRequired: string;
      };
      validation: {
        descriptionRequired: string;
        descriptionMaxLength: string;
        specieRequired: string;
        causeRequired: string;
      };
    };
  };
}
