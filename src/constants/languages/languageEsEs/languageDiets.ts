// src/constants/languages/languageEsEs/languageDiets.ts
// Traducción ES-ES del módulo "Dieta" (Diet — Operacional/Pecuaria,
// TASK-FE-DIET-01).

import { ModuleDiets } from '@/@types/language/module-diets';

export const languageDiets: ModuleDiets = {
  diet: {
    singularLabel: 'Dieta',
    pluralLabel: 'Dietas',
    list: {
      pageTitle: 'Dieta',
      pageSubtitle: 'Administre las dietas registradas.',
      deletedToast: 'Dieta eliminada con éxito',
      columns: {
        code: 'Código',
        date: 'Fecha',
        product: 'Producto',
        objective: 'Objetivo',
        estimatedCost: 'Costo Estimado',
        costPerKg: 'Costo por Kg',
      },
      actions: {
        view: 'Ver',
        edit: 'Editar',
        delete: 'Eliminar',
      },
      emptyState: {
        titleEmpty: 'Ninguna dieta registrada.',
        descriptionEmpty: 'Comience agregando la primera dieta.',
        titleFiltered: 'Ninguna dieta encontrada.',
        descriptionFiltered: 'Intente ajustar los filtros o borrar la búsqueda.',
        cta: 'Agregar Dieta',
      },
    },
    filter: {
      title: 'Filtrar dietas',
      search: 'Producto',
      searchPlaceholder: 'Buscar por producto',
      objective: 'Objetivo',
      objectiveAll: 'Todas',
      date: 'Fecha',
    },
    form: {
      title: {
        create: 'Nueva Dieta',
        edit: 'Editar Dieta',
      },
      fields: {
        code: 'Código',
        responsible: 'Responsable',
        date: 'Fecha',
        product: 'Producto',
        quantity: 'Cantidad Referencia',
        measurement: 'Unidad',
        objective: 'Objetivo',
        type: 'Tipo',
        observation: 'Observación',
        ingredients: 'Composición',
        ingredientProduct: 'Ingrediente',
        ingredientMeasurement: 'Unidad',
        ingredientDryMatter: 'Materia Seca (%)',
        ingredientCostValue: 'Costo Unitario',
        ingredientQuantityP: 'Porcentaje (%)',
        ingredientQuantityU: 'Cantidad',
        ingredientTotal: 'Total',
        addIngredient: 'Agregar Ingrediente',
        removeIngredient: 'Eliminar',
      },
      objectiveOptions: {
        adaptation: 'Adaptación',
        growth: 'Crecimiento',
        termination: 'Terminación',
      },
      typeOptions: {
        percentage: 'Porcentaje',
        unit: 'Unidad',
      },
      hints: {
        quantityTooltip:
          'Esta es la medida estándar de la dieta. Si la dieta fue creada para 1kg, pero producirá 10kg, el sistema multiplicará los ingredientes por 10 automáticamente.',
      },
      validation: {
        productRequired: 'Seleccione el producto.',
        measurementRequired: 'Seleccione la unidad.',
        dateRequired: 'Ingrese la fecha.',
        objectiveRequired: 'Seleccione el objetivo.',
        typeRequired: 'Seleccione el tipo.',
        quantityMin: 'Ingrese una cantidad mayor que cero.',
        observationMax: 'La observación debe tener como máximo 1500 caracteres.',
        ingredientsMin: 'Agregue al menos un ingrediente.',
        ingredientProductRequired: 'Seleccione el ingrediente.',
        ingredientMeasurementRequired: 'Seleccione la unidad.',
        dryMatterMin: 'Ingrese un valor mayor o igual a cero.',
        costValueMin: 'Ingrese un valor mayor o igual a cero.',
        ingredientQuantityMin: 'Ingrese un valor mayor que cero.',
        ingredientsSumMustBe100: 'La suma de los porcentajes debe ser igual a 100%.',
      },
    },
  },
};
