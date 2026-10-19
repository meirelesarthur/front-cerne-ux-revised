// src/@types/language/module-separations/index.ts
// -----------------------------------------------------------------------------
// Interface de tradução do módulo de APARTAÇÃO (Separation — Operacional >
// Pecuária, 97-Esteiras/005 Tarefa 24). Espelha a convenção de
// `module-birth-animals/index.ts`. Conteúdo mora em
// src/constants/languages/{idioma}/languageSeparations.ts.
//
// Namespace `separations` — LIVRE, sem colisão com `birthAnimals`/`transfers`.
//
// TASK-APART-FE-01 (fundação) cobre `list` + `filter` + `deleteDialog` +
// `detail` (tela de visualização dedicada, contrato §6). A Tarefa 25
// (formulário, contrato §7) acrescenta `form`.
// -----------------------------------------------------------------------------

export interface ModuleSeparations {
  separation: {
    singularLabel: string;
    pluralLabel: string;
    list: {
      pageTitle: string;
      pageSubtitle: string;
      deletedToast: string;
      table: {
        code: string;
        date: string;
        employeeName: string;
        batchCount: string;
        animalCount: string;
        processingStatus: {
          processed: string;
          pending: string;
        };
      };
      actions: {
        view: string;
        edit: string;
        delete: string;
      };
      helpVideo: string;
      helpVideoComingSoon: string;
      emptyState: {
        titleEmpty: string;
        descriptionEmpty: string;
        titleFiltered: string;
        descriptionFiltered: string;
      };
      error: {
        message: string;
        retry: string;
      };
    };
    filter: {
      title: string;
      batch: string;
    };
    deleteDialog: {
      title: string;
      descriptionTemplate: string;
    };
    detail: {
      pageTitleTemplate: string;
      notFound: {
        title: string;
        description: string;
        back: string;
      };
      sections: {
        header: string;
        batches: string;
      };
      fields: {
        code: string;
        date: string;
        employeeName: string;
      };
      batchesTable: {
        description: string;
        empty: string;
      };
      backButton: string;
    };
    /** Formulário de criar/editar (contrato §7, Tarefa 25). */
    form: {
      title: {
        create: string;
        edit: string;
      };
      fields: {
        code: string;
        date: string;
        batches: string;
      };
      placeholders: {
        batches: string;
      };
      hints: {
        codeGeneratedOnSave: string;
      };
      validation: {
        dateRequired: string;
        batchesRequired: string;
        batchesMin: string;
      };
      batchDateWarning: {
        title: string;
        /** Item agregado, ex.: "{description} (data {date})" — §7.4. */
        itemTemplate: string;
        /** Prefixo com placeholder `{list}` — itens unidos por ", ". */
        description: string;
      };
    };
  };
}
