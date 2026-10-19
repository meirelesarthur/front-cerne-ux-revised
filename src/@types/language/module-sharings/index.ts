// src/@types/language/module-sharings/index.ts
// Interface de tradução do módulo "Compartilhamento" (Sharing — Integrações,
// F-122, 97-Esteiras/070, TASK-CP-FE-01/02/03). Mirror estrutural de
// `module-breeding-mating` (instância simples: um único arquivo, sem
// decomposição por tela). Chave raiz `sharings`. O conteúdo mora em
// src/constants/languages/{idioma}/languageSharings.ts.
//
// Título divergente Index/View (plural) vs. Create (singular) — `DIV-04`/
// `CL-042`, preservado DELIBERADAMENTE (não é bug funcional, é fidelidade
// textual ao legado — ver `list.pageTitle` vs. `form.createTitle`).

export interface ModuleSharings {
  sharings: {
    singularLabel: string;
    pluralLabel: string;
    list: {
      pageTitle: string;
      pageSubtitle: string;
      table: {
        date: string;
        tenant: string;
        user: string;
        actions: string;
      };
      actions: {
        edit: string;
        view: string;
        delete: string;
      };
      emptyState: {
        title: string;
        description: string;
        cta: string;
      };
      deleteDialog: {
        header: string;
        body: string;
        confirm: string;
        cancel: string;
      };
      deletedToast: string;
      error: {
        message: string;
        retry: string;
      };
    };
    form: {
      /** "Compartilhamento" (singular) no Create — `DIV-04`, preservado. */
      createTitle: string;
      /** "Compartilhamentos" (plural) no Edit — `DIV-04`, preservado. */
      editTitle: string;
      fields: {
        date: string;
        responsible: string;
        tenant: string;
        items: string;
      };
      placeholders: {
        tenant: string;
      };
      /** Label do checkbox único (`value="markings"`). */
      itemsLabel: string;
      save: string;
      cancel: string;
      createdToast: string;
      updatedToast: string;
      validation: {
        dateRequired: string;
        tenantRequired: string;
        itemsRequired: string;
      };
    };
    detail: {
      /** "Compartilhamentos" (plural) — mirror `list.pageTitle` (`CL-042`). */
      pageTitle: string;
      responsible: string;
      tenant: string;
      date: string;
      items: string;
      backButton: string;
      notFound: {
        title: string;
        description: string;
      };
      error: {
        message: string;
        retry: string;
      };
    };
  };
}
