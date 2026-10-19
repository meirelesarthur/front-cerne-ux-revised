// src/@types/language/module-diets/index.ts
// Interface de tradução do módulo "Dieta" (Diet — Operacional/Pecuária,
// TASK-FE-DIET-01). O conteúdo mora em
// src/constants/languages/{idioma}/languageDiets.ts.
//
// Shape completo declarado de uma vez (mirror `module-foods/index.ts`):
// `list`/`filter` (TASK-FE-DIET-02) e `form` (TASK-FE-DIET-03) já reservados
// nesta Tarefa para não reabrir este arquivo de interface em cada Tarefa
// seguinte — as STRINGS de tradução (nos 3 `languageDiets.ts`) também já
// foram escritas nesta mesma janela de execução.
export interface ModuleDiets {
  diet: {
    singularLabel: string;
    pluralLabel: string;
    list: {
      pageTitle: string;
      pageSubtitle: string;
      deletedToast: string;
      columns: {
        code: string;
        date: string;
        product: string;
        objective: string;
        estimatedCost: string;
        costPerKg: string;
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
      search: string;
      searchPlaceholder: string;
      objective: string;
      objectiveAll: string;
      date: string;
    };
    form: {
      title: {
        create: string;
        edit: string;
      };
      fields: {
        code: string;
        responsible: string;
        date: string;
        product: string;
        quantity: string;
        measurement: string;
        objective: string;
        type: string;
        observation: string;
        ingredients: string;
        ingredientProduct: string;
        ingredientMeasurement: string;
        ingredientDryMatter: string;
        ingredientCostValue: string;
        ingredientQuantityP: string;
        ingredientQuantityU: string;
        ingredientTotal: string;
        addIngredient: string;
        removeIngredient: string;
      };
      /** Labels das opções do enum `DietObjective`
       *  (`@/constants/diet/diet-objective.ts`). */
      objectiveOptions: {
        adaptation: string;
        growth: string;
        termination: string;
      };
      /** Labels das opções do enum `DietType`
       *  (`@/constants/diet/diet-type.ts`). */
      typeOptions: {
        percentage: string;
        unit: string;
      };
      hints: {
        quantityTooltip: string;
      };
      /** Mensagens de validação do schema Yup (`diet-schema.ts`). */
      validation: {
        productRequired: string;
        measurementRequired: string;
        dateRequired: string;
        objectiveRequired: string;
        typeRequired: string;
        quantityMin: string;
        observationMax: string;
        ingredientsMin: string;
        ingredientProductRequired: string;
        ingredientMeasurementRequired: string;
        dryMatterMin: string;
        costValueMin: string;
        ingredientQuantityMin: string;
        ingredientsSumMustBe100: string;
      };
    };
  };
}
