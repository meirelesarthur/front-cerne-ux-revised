// src/@types/language/module-feedlot-sectors/index.ts
// Interface de tradução do módulo OPERACIONAL — Setor (FeedlotSector) —
// domínio PRÓPRIO (mirror `module-feedlot-yards`). O conteúdo mora em
// `src/constants/languages/{idioma}/languageFeedlotSectors.ts`.
//
// TASK-FS-FE-01 (listagem + detalhe + rota + menu + exclusão) + TASK-FS-FE-02
// (formulário criar/editar). `priority` (rótulo "Ordem") só aparece no bloco
// `detail` — nunca em `list`/`form`. `filter`/`form` têm campo extra
// `feedlotYard` (FK visível, ausente em `FeedlotYard`, que é o topo da
// hierarquia).

export interface ModuleFeedlotSectors {
  feedlotSector: {
    singularLabel: string;
    pluralLabel: string;
    list: {
      pageTitle: string;
      pageSubtitle: string;
      deletedToast: string;
      table: {
        code: string;
        name: string;
        feedlotYard: string;
        area: string;
        createdAt: string;
        active: string;
        activeLabel: string;
        inactiveLabel: string;
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
      code: string;
      codePlaceholder: string;
      name: string;
      namePlaceholder: string;
      feedlotYard: string;
      feedlotYardPlaceholder: string;
      isActive: string;
      isActiveAll: string;
    };
    /** Único ponto onde `priority` (Ordem) aparece — mirror `DetalheFeedlotYard`. */
    detail: {
      generalData: { title: string };
      fields: {
        code: string;
        name: string;
        feedlotYard: string;
        priority: string;
        width: string;
        length: string;
        area: string;
        observation: string;
        active: string;
        createdAt: string;
        updatedAt: string;
      };
      actions: { edit: string; back: string };
      notFound: { title: string; description: string; back: string };
    };
    /** Formulário de criação/edição (TASK-FS-FE-02) — 6 campos + code readonly + total_area derivada. */
    form: {
      title: { create: string; edit: string };
      fields: {
        code: string;
        name: string;
        feedlotYard: string;
        width: string;
        length: string;
        area: string;
        isActive: string;
        observation: string;
      };
      placeholders: {
        feedlotYard: string;
        width: string;
        length: string;
      };
      hints: {
        codeGenerated: string;
      };
      validation: {
        nameRequired: string;
        nameMaxLength: string;
        feedlotYardRequired: string;
        widthRequired: string;
        widthMin: string;
        lengthRequired: string;
        lengthMin: string;
        isActiveRequired: string;
        observationMaxLength: string;
      };
    };
    status: {
      active: string;
      inactive: string;
    };
    /** Diálogo Criar/Editar do Mapa de Confinamento (`FeedlotSectorDialog.tsx`,
     *  97-Esteiras/063, TASK-063-MAPA-01/02) — mirror `module-feedlot-yards.dialog`. */
    dialog: {
      noChangesToast: string;
      loadError: {
        message: string;
        retry: string;
      };
    };
  };
}
