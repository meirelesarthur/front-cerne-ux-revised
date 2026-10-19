// src/@types/language/module-feedlot-map/index.ts
// Interface de tradução do módulo OPERACIONAL — Mapa de Confinamento
// (FeedlotMap — Confinamento, execução 042, TASK-FE-042-200..216). O
// conteúdo mora em `src/constants/languages/{idioma}/languageFeedlotMap.ts`.
// `singularLabel`/`pluralLabel` alimentam a `queryKey` CANÔNICA
// (`queryKey.feedlotMap.tree`).

export interface ModuleFeedlotMap {
  feedlotMap: {
    singularLabel: string;
    pluralLabel: string;
    page: {
      title: string;
      newYard: string;
      viewInMap: string;
    };
    filters: {
      entryFrom: string;
      entryTo: string;
      exitFrom: string;
      exitTo: string;
      clear: string;
    };
    emptyState: {
      title: string;
      description: string;
      cta: string;
    };
    error: {
      title: string;
      description: string;
      retry: string;
    };
    street: {
      singularLabel: string;
      title: { create: string; edit: string };
      fields: { description: string; orientation: string };
      orientationOptions: { horizontal: string; vertical: string };
      deleteConfirm: { title: string; description: string };
      deletedToast: string;
      validation: {
        descriptionRequired: string;
        descriptionMaxLength: string;
        orientationRequired: string;
      };
    };
    corral: {
      singularLabel: string;
      title: { create: string; edit: string; duplicate: string };
      fields: {
        identification: string;
        name: string;
        installationType: string;
        status: string;
        width: string;
        length: string;
        area: string;
        capacity: string;
        coverage: string;
        floor: string;
        shading: string;
        trough: string;
        drinkingFountain: string;
      };
      addTrough: string;
      addDrinkingFountain: string;
      validation: {
        nameRequired: string;
        nameMaxLength: string;
        installationTypeRequired: string;
        statusRequired: string;
        widthRequired: string;
        widthMin: string;
        widthMax: string;
        lengthRequired: string;
        lengthMin: string;
        lengthMax: string;
        capacityRequired: string;
        capacityMin: string;
        coverageRequired: string;
        floorRequired: string;
        shadingRequired: string;
        troughRequired: string;
        drinkingFountainRequired: string;
      };
    };
    status: {
      title: string;
      fields: { status: string; availableAt: string; note: string };
      detachConfirm: { title: string; description: string };
      validation: {
        statusRequired: string;
        availableAtRequired: string;
        noteRequired: string;
        noteMaxLength: string;
      };
    };
    batches: {
      title: string;
      fields: {
        entryDate: string;
        exitDate: string;
        totalDays: string;
        expectedAdg: string;
        diet: string;
        feedIntake: string;
        batch: string;
      };
      addBatch: string;
      removeBatch: string;
      empty: string;
      capacityWarning: string;
      summary: {
        animals: string;
        averageStartWeight: string;
        expectedGain: string;
        postConfinementWeight: string;
      };
      validation: {
        entryDateRequired: string;
        exitDateRequired: string;
        exitDateAfterEntry: string;
        expectedAdgRequired: string;
        expectedAdgMin: string;
        batchRequired: string;
        batchDuplicate: string;
      };
    };
    transfer: {
      title: string;
      fields: {
        batch: string;
        destinationType: string;
        destination: string;
        transferDate: string;
      };
      destinationTypeOptions: { corral: string; area: string; grazing: string };
      capacityWarning: string;
      validation: {
        batchRequired: string;
        destinationTypeRequired: string;
        destinationRequired: string;
        transferDateRequired: string;
      };
    };
    dates: {
      title: string;
      fields: { entryDate: string; exitDate: string; totalDays: string; expectedAdg: string };
      validation: { exitDateAfterEntry: string; expectedAdgMin: string };
    };
    diet: {
      title: string;
      fields: { date: string; diet: string; feedIntake: string };
      validation: {
        dateRequired: string;
        dietRequired: string;
        feedIntakeRequired: string;
        feedIntakeMin: string;
      };
    };
    weighing: {
      title: string;
      columns: {
        identification: string;
        batch: string;
        lastWeighingDate: string;
        lastWeight: string;
        currentWeight: string;
        gain: string;
        days: string;
        gmd: string;
      };
      average: string;
      averageCurrentWeight: string;
      averageGain: string;
      empty: string;
      importToggle: string;
      validation: { atLeastOneWeight: string };
    };
    weighingImport: {
      title: string;
      downloadTemplate: string;
      uploadLabel: string;
      importButton: string;
      close: string;
      successToast: string;
    };
    sanitary: {
      title: string;
      fields: {
        animals: string;
        warehouse: string;
        product: string;
        measurement: string;
        stock: string;
        quantity: string;
        note: string;
      };
      addItem: string;
      removeItem: string;
      empty: string;
      stockInsufficientWarning: string;
      validation: {
        animalsRequired: string;
        itemsRequired: string;
        warehouseRequired: string;
        productRequired: string;
        measurementRequired: string;
        quantityRequired: string;
        quantityMin: string;
      };
    };
    death: {
      title: string;
      fields: { animal: string; cause: string; date: string; note: string };
      confirm: { title: string; description: string };
      validation: {
        animalRequired: string;
        causeRequired: string;
        dateRequired: string;
        noteMaxLength: string;
      };
    };
  };
}
