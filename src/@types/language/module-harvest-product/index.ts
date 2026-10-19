// src/@types/language/module-harvest-product/index.ts
// Interface de tradução do módulo "Colheita de Frutas" (HarvestProduct —
// Operacional / Agricultura, F-040, execução 040, TASK-FE-1093). Mirror da
// convenção de `module-protocol-season`/`module-loss-animals` (instância
// simples: um único arquivo, sem decomposição por tela). O conteúdo mora em
// src/constants/languages/{idioma}/languageHarvestProduct.ts.
//
// Namespace `harvestProduct` (singular) — NUNCA `harvest`/`harvests` (módulo
// de Safra já migrado, `@/@types/language/index.d.ts::harvests`, contrato
// §7.3).
//
// SEM nível extra de nesting (diferente de `protocolSeasons.protocolSeason`
// / `lossAnimals.lossAnimal`): o contrato §7.3 fixa `singularLabel` ==
// `pluralLabel` == "Colheita de Frutas" para este módulo — um wrapper
// singular/plural distinto seria redundante. Consumido como
// `languageGB.harvestProduct.form.fields`, um único nível.

export interface ModuleHarvestProduct {
  singularLabel: string;
  pluralLabel: string;
  titleModule: string;
  createTitle: string;
  editTitle: string;
  list: {
    table: {
      code: string;
      date: string;
      client: string;
      area: string;
      product: string;
      boxesCount: string;
      /** FID-G5 (execução 040, correção 3) — tooltip do badge "Caixas"
       *  (legado `harvest-products/index.blade.php:95-101`), 1 linha por
       *  caixa. Placeholders `{n}` (posição 1-based) / `{amount}` (peso já
       *  formatado, pt-BR, sem unidade) substituídos via `.replace()` —
       *  mirror da convenção de template do projeto (ex.: `AnimalBulkActionBar.
       *  tsx::selectedOne`). */
      boxTooltipLabel: string;
      totalWeight: string;
      actions: string;
    };
    actions: {
      view: string;
      edit: string;
      delete: string;
    };
    newButton: string;
    emptyState: {
      titleEmpty: string;
      descriptionEmpty: string;
      titleFiltered: string;
      descriptionFiltered: string;
      cta: string;
    };
    deleteDialog: {
      title: string;
      warning: string;
    };
  };
  filter: {
    title: string;
    area: string;
    client: string;
    dateStart: string;
    dateEnd: string;
    clearAllFilters: string;
    applyFilters: string;
  };
  form: {
    code: string;
    codeHelper: string;
    date: string;
    area: string;
    client: string;
    product: string;
    plate: string;
    city: string;
    driverName: string;
    driverNif: string;
    boxesSectionTitle: string;
    boxAmount: string;
    addBoxButton: string;
    removeBoxButton: string;
    lookupErrorRetry: string;
    lookupNoResults: string;
    lookupTypeToSearch: string;
  };
  validation: {
    dateRequired: string;
    areaRequired: string;
    clientRequired: string;
    productRequired: string;
    boxAmountRequired: string;
    boxesMinOne: string;
  };
  toast: {
    createSuccess: string;
    updateSuccess: string;
    deleteSuccess: string;
    deleteError: string;
  };
  detail: {
    title: string;
    backButton: string;
    editButton: string;
    sections: {
      generalData: string;
      boxes: string;
    };
    table: {
      amount: string;
    };
    notFound: {
      title: string;
      description: string;
    };
    invalidParamsToast: {
      title: string;
      description: string;
    };
  };
}
