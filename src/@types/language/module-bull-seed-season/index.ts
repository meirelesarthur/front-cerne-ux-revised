// src/@types/language/module-bull-seed-season/index.ts
// Interface de tradução do módulo "Touros/Sêmen/Embrião" (BullSeedSeason —
// Operacional / Reprodução, 97-Esteiras/005, Tarefas 24/25). Mirror da
// convenção de `module-breeding-seasons` (instância simples: um único
// arquivo, sem decomposição por tela). O conteúdo mora em
// src/constants/languages/{idioma}/languageBullSeedSeason.ts.
//
// Bloco `form` (Tarefa 25) — formulário único de criação/edição + os 2
// subcadastros dinâmicos (Animais/Produtos).

export interface ModuleBullSeedSeason {
  bullSeedSeason: {
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
        breedingSeason: string;
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
      deleteButton: string;
      sections: {
        generalData: string;
        animals: string;
        products: string;
      };
      fields: {
        code: string;
        date: string;
        description: string;
        breedingSeason: string;
        createdAt: string;
        updatedAt: string;
      };
      animalsEmpty: string;
      productsEmpty: string;
      productsTable: {
        product: string;
        warehouse: string;
        quantity: string;
        measurement: string;
        noWarehouse: string;
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
    form: {
      title: {
        create: string;
        edit: string;
      };
      fields: {
        code: string;
        date: string;
        description: string;
        breedingSeason: string;
      };
      animals: {
        sectionTitle: string;
        animalLabel: string;
        addButton: string;
        removeButton: string;
        emptyState: string;
      };
      products: {
        sectionTitle: string;
        warehouseLabel: string;
        productLabel: string;
        quantityLabel: string;
        measurementLabel: string;
        stockLabel: string;
        addButton: string;
        removeButton: string;
        emptyState: string;
      };
      validation: {
        dateRequired: string;
        descriptionRequired: string;
        breedingSeasonRequired: string;
        animalRequired: string;
        productRequired: string;
        quantityRequired: string;
        quantityMin: string;
      };
      unsavedChangesDialog: {
        title: string;
        description: string;
        confirmButton: string;
      };
    };
  };
}
