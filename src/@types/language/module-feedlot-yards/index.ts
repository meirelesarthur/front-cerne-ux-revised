// src/@types/language/module-feedlot-yards/index.ts
// Interface de tradução do módulo OPERACIONAL — Pátio (FeedlotYard) — domínio
// PRÓPRIO (mirror `module-pastures`/`module-appropriations`). O conteúdo mora
// em `src/constants/languages/{idioma}/languageFeedlotYards.ts`.
//
// TASK-PT-FE-01 (listagem + detalhe + rota + menu + exclusão) + TASK-PT-FE-02
// (formulário criar/editar), execução 046. `priority` (rótulo "Ordem",
// `CLM-17`) só aparece no bloco `detail` — nunca em `list`/`form`.

export interface ModuleFeedlotYards {
  feedlotYard: {
    singularLabel: string;
    pluralLabel: string;
    list: {
      pageTitle: string;
      pageSubtitle: string;
      deletedToast: string;
      table: {
        code: string;
        name: string;
        area: string;
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
      isActive: string;
      isActiveAll: string;
    };
    /** Único ponto onde `priority` (Ordem) aparece — mirror `DetalheCentroCusto`. */
    detail: {
      generalData: { title: string };
      fields: {
        code: string;
        name: string;
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
    /** Formulário de criação/edição (TASK-PT-FE-02) — 5 campos + code readonly + area derivada. */
    form: {
      title: { create: string; edit: string };
      fields: {
        code: string;
        name: string;
        width: string;
        length: string;
        area: string;
        isActive: string;
        observation: string;
      };
      placeholders: {
        name: string;
        width: string;
        length: string;
      };
      hints: {
        codeGenerated: string;
      };
      validation: {
        nameRequired: string;
        nameMaxLength: string;
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
    /** Diálogo Criar/Editar do Mapa de Confinamento (`FeedlotYardDialog.tsx`,
     *  97-Esteiras/063, TASK-063-MAPA-01/02) — feedback quando não há
     *  `dirtyFields` no submit (em vez de fechar em silêncio) e estado de
     *  erro da query de detalhe (em vez de formulário em branco). */
    dialog: {
      noChangesToast: string;
      loadError: {
        message: string;
        retry: string;
      };
    };
  };
}
