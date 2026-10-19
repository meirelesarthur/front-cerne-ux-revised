// src/@types/language/module-breeding-batch/index.ts
// Interface de tradução do módulo "Lotes/Reprodução" (BreedingBatch —
// Operacional / Reprodução, 97-Esteiras/048, Tarefas 04/05/06/07). Mirror da
// convenção de `module-breeding-seasons`/`module-bull-seed-season` (instância
// simples: um único arquivo, sem decomposição por tela). O conteúdo mora em
// src/constants/languages/{idioma}/languageBreedingBatch.ts.

export interface ModuleBreedingBatch {
  breedingBatch: {
    singularLabel: string;
    pluralLabel: string;
    titleModule: string;
    list: {
      pageTitle: string;
      pageSubtitle: string;
      deletedToast: string;
      newButton: string;
      table: {
        code: string;
        date: string;
        responsible: string;
        description: string;
        actions: string;
      };
      actions: {
        view: string;
        edit: string;
        delete: string;
      };
      emptyState: {
        titleEmpty: string;
        descriptionEmpty: string;
        titleFiltered: string;
        descriptionFiltered: string;
        cta: string;
      };
      filter: {
        title: string;
        startDate: string;
        endDate: string;
      };
      deleteDialog: {
        title: string;
        description: string;
        warning: string;
      };
    };
    detail: {
      title: string;
      backButton: string;
      editButton: string;
      sections: {
        generalData: string;
        linkedBatches: string;
      };
      fields: {
        code: string;
        date: string;
        description: string;
        responsible: string;
        breedingSeason: string;
        createdAt: string;
        updatedAt: string;
      };
      /** Colunas da lista simples de lotes vinculados (Tarefa 07, contrato de
       *  tela §6 — mirror `show.blade.php`/CLM-35, sem concatenar em string). */
      linkedBatchesTable: {
        code: string;
        description: string;
      };
      /** Exibido quando `batches: []` (contrato de tela §6, DoD "Detalhe
       *  renderiza os lotes vinculados como lista, sem quebrar com
       *  batches: []"). */
      linkedBatchesEmpty: string;
      notFound: {
        title: string;
        description: string;
      };
      invalidParamsToast: {
        title: string;
        description: string;
      };
    };
    form: {
      title: { create: string; edit: string };
      fields: {
        code: string;
        responsible: string;
        date: string;
        description: string;
        breedingSeason: string;
        batches: string;
        addBatchButton: string;
        removeBatchButton: string;
      };
      validation: {
        dateRequired: string;
        descriptionRequired: string;
        breedingSeasonRequired: string;
        batchesMinRequired: string;
        batchRequired: string;
        batchDuplicate: string;
        batchInvalidDate: string;
      };
      unsavedChangesDialog: {
        title: string;
        description: string;
        confirmButton: string;
      };
    };
  };
}
