// src/@types/language/module-diet-beats/index.ts
// Interface de tradução do módulo "Batida" (DietBeat — Operacional/
// Pecuária, TASK-FE-DIET-04). O conteúdo mora em
// src/constants/languages/{idioma}/languageDietBeats.ts.
//
// Shape completo declarado de uma vez (mirror `module-diets/index.ts`):
// `list`/`filter` (TASK-FE-DIET-05) e `form` (TASK-FE-DIET-06) já
// reservados nesta Tarefa.
export interface ModuleDietBeats {
  dietBeat: {
    singularLabel: string;
    pluralLabel: string;
    list: {
      pageTitle: string;
      pageSubtitle: string;
      deletedToast: string;
      columns: {
        code: string;
        date: string;
        diet: string;
        equipment: string;
        user: string;
        total: string;
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
    };
    filter: {
      title: string;
      equipment: string;
      equipmentPlaceholder: string;
      diet: string;
      dietPlaceholder: string;
      date: string;
    };
    form: {
      title: {
        create: string;
        edit: string;
      };
      fields: {
        header: {
          code: string;
          responsible: string;
          equipment: string;
          diet: string;
          measurement: string;
          quantity: string;
          date: string;
        };
        item: {
          product: string;
          measurement: string;
          stock: string;
          stockAvailable: string;
          dryMatter: string;
          costValue: string;
          quantityPlanned: string;
          quantityRealized: string;
          percentage: string;
          difference: string;
          total: string;
          sectionTitle: string;
          insufficientStock: string;
          emptyUntilDiet: string;
        };
      };
      hints: {
        quantityTooltip: string;
      };
      /** Mensagens de validação do schema Yup (`diet-beat-schema.ts`). */
      validation: {
        equipmentRequired: string;
        dietRequired: string;
        measurementRequired: string;
        dateRequired: string;
        quantityRequired: string;
        quantityMin: string;
        itemStockRequired: string;
        itemQuantityRealizedRequired: string;
        itemQuantityRealizedMin: string;
        itemsMin: string;
        numberType: string;
      };
    };
  };
}
