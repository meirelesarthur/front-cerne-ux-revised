// src/constants/languages/languageEsEs/languageDietBeats.ts
// Traducción ES-ES del módulo "Batida" (DietBeat — Operacional/Pecuaria,
// TASK-FE-DIET-04).

import { ModuleDietBeats } from '@/@types/language/module-diet-beats';

export const languageDietBeats: ModuleDietBeats = {
  dietBeat: {
    singularLabel: 'Ración',
    pluralLabel: 'Raciones',
    list: {
      pageTitle: 'Ración',
      pageSubtitle: 'Administre las raciones de dieta registradas.',
      deletedToast: 'Ración eliminada con éxito',
      columns: {
        code: 'Código',
        date: 'Fecha',
        diet: 'Dieta',
        equipment: 'Vagón',
        user: 'Operador',
        total: 'Total',
      },
      actions: {
        view: 'Ver',
        edit: 'Editar',
        delete: 'Eliminar',
      },
      emptyState: {
        titleEmpty: 'Ninguna ración registrada.',
        descriptionEmpty: 'Comience agregando la primera ración.',
        titleFiltered: 'Ninguna ración encontrada.',
        descriptionFiltered: 'Intente ajustar los filtros o borrar la búsqueda.',
        cta: 'Agregar Ración',
      },
    },
    filter: {
      title: 'Filtrar raciones',
      equipment: 'Vagón',
      equipmentPlaceholder: 'Buscar por vagón',
      diet: 'Dieta',
      dietPlaceholder: 'Buscar por dieta',
      date: 'Fecha',
    },
    form: {
      title: {
        create: 'Nueva Ración',
        edit: 'Editar Ración',
      },
      fields: {
        header: {
          code: 'Código',
          responsible: 'Operador',
          equipment: 'Vagón',
          diet: 'Dieta',
          measurement: 'Unidad',
          quantity: 'Cantidad Producida',
          date: 'Fecha',
        },
        item: {
          product: 'Ingrediente',
          measurement: 'Unidad',
          stock: 'Almacén',
          stockAvailable: 'Saldo Disponible',
          dryMatter: 'Materia Seca (%)',
          costValue: 'Costo Unitario',
          quantityPlanned: 'Cantidad Prevista',
          quantityRealized: 'Cantidad Realizada',
          percentage: 'Porcentaje (%)',
          difference: 'Diferencia',
          total: 'Total',
          sectionTitle: 'Ítems de la Ración',
          insufficientStock: 'La cantidad realizada no puede exceder el saldo disponible.',
          emptyUntilDiet: 'Seleccione una dieta para generar los ítems.',
        },
      },
      hints: {
        quantityTooltip: 'Ingrese la cantidad total producida en esta ración.',
      },
      validation: {
        equipmentRequired: 'Seleccione el vagón.',
        dietRequired: 'Seleccione la dieta.',
        measurementRequired: 'Seleccione la unidad.',
        dateRequired: 'Ingrese la fecha.',
        quantityRequired: 'Ingrese la cantidad.',
        quantityMin: 'Ingrese una cantidad mayor que cero.',
        itemStockRequired: 'Seleccione el almacén de origen.',
        itemQuantityRealizedRequired: 'Ingrese la cantidad realizada.',
        itemQuantityRealizedMin: 'Ingrese una cantidad mayor que cero.',
        itemsMin: 'Seleccione una dieta con al menos un ingrediente.',
        numberType: 'Ingrese un número válido.',
      },
    },
  },
};
