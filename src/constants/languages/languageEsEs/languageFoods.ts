// src/constants/languages/languageEsEs/languageFoods.ts
// Traducción ES-ES del módulo "Formulação" (Food — Fábrica/Ración,
// TASK-FOOD-FE-01).

import { ModuleFoods } from '@/@types/language/module-foods';

export const languageFoods: ModuleFoods = {
  food: {
    singularLabel: 'Fórmula de Alimento',
    pluralLabel: 'Fórmulas de Alimento',
    list: {
      pageTitle: 'Fórmula de Alimento',
      pageSubtitle: 'Administre las fórmulas de ración de la fábrica.',
      deletedToast: 'Fórmula de alimento eliminada con éxito',
      duplicatedToast: 'Fórmula de alimento duplicada con éxito',
      reportErrorToast: 'No fue posible generar el informe de la fórmula de alimento.',
      columns: {
        code: 'Código',
        product: 'Producto',
        date: 'Fecha',
        quantity: 'Cantidad',
        measurement: 'Unidad',
        type: 'Tipo',
        status: 'Estado',
        activeLabel: 'Activo',
        inactiveLabel: 'Inactivo',
      },
      actions: {
        edit: 'Editar',
        delete: 'Eliminar',
        duplicate: 'Duplicar',
        report: 'Informe',
      },
      emptyState: {
        titleEmpty: 'Ninguna fórmula de alimento registrada.',
        descriptionEmpty: 'Comience agregando la primera fórmula de alimento.',
        titleFiltered: 'Ninguna fórmula de alimento encontrada.',
        descriptionFiltered: 'Intente ajustar los filtros o borrar la búsqueda.',
        cta: 'Agregar Fórmula de Alimento',
      },
    },
    filter: {
      title: 'Filtrar fórmulas de alimento',
      product: 'Producto',
      productPlaceholder: 'Buscar por ración',
      status: 'Estado',
      statusAll: 'Todos',
      statusOptions: {
        active: 'Activo',
        inactive: 'Inactivo',
      },
      type: 'Tipo',
      typeAll: 'Todos',
    },
    form: {
      title: {
        create: 'Nueva Fórmula de Alimento',
        edit: 'Editar Fórmula de Alimento',
      },
      fields: {
        code: 'Código',
        responsible: 'Responsable',
        date: 'Fecha',
        status: 'Activo',
        product: 'Producto',
        quantity: 'Cantidad',
        measurement: 'Unidad',
        type: 'Tipo',
        feedstocks: 'Composición',
        feedstockProduct: 'Materia Prima',
        feedstockMeasurement: 'Unidad',
        feedstockPercentageP: 'Porcentaje (%)',
        feedstockPercentageU: 'Cantidad',
        total: 'Total',
        addFeedstock: 'Agregar Materia Prima',
        removeFeedstock: 'Quitar',
      },
      typeOptions: {
        percentage: 'Porcentaje',
        unit: 'Unidad',
      },
      hints: {
        quantityTooltip:
          'Esta es la medida estándar de la fórmula. Si la fórmula fue creada para 1kg, pero usted va a producir 10kg, el sistema multiplicará los insumos por 10 automáticamente.',
      },
      validation: {
        productRequired: 'Seleccione la ración.',
        dateRequired: 'Informe la fecha.',
        quantityMin: 'Informe una cantidad mayor que cero.',
        measurementRequired: 'Seleccione la unidad.',
        typeRequired: 'Seleccione el tipo.',
        feedstocksMin: 'Agregue al menos una materia prima.',
        feedstockProductRequired: 'Seleccione la materia prima.',
        percentageMin: 'Informe un valor mayor o igual a cero.',
        percentageSumMustBe100: 'La suma de los porcentajes debe ser igual a 100%.',
      },
    },
  },
};
