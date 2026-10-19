// src/constants/languages/languageEsEs/languageFoodBeats.ts
// Traducción ES-ES del módulo "Batida" (FoodBeat — Fábrica, TASK-FB-FE-01).

import { ModuleFoodBeats } from '@/@types/language/module-food-beats';

export const languageFoodBeats: ModuleFoodBeats = {
  foodBeat: {
    singularLabel: 'Lote de Alimentación',
    pluralLabel: 'Lotes de Alimentación',
    list: {
      columns: {
        code: 'Código',
        date: 'Fecha',
        type: 'Tipo',
        warehouse: 'Almacén',
        productOrFood: 'Ración/Producto',
        quantity: 'Cantidad',
        user: 'Responsable',
      },
      actions: {
        view: 'Ver',
        edit: 'Editar',
        delete: 'Eliminar',
        report: 'Informe',
      },
      emptyState: {
        titleEmpty: 'Ningún lote de alimentación registrado.',
        descriptionEmpty: 'Comience agregando el primer lote de alimentación.',
        titleFiltered: 'Ningún lote de alimentación encontrado.',
        descriptionFiltered: 'Intente ajustar los filtros o borrar la búsqueda.',
        cta: 'Agregar Lote de Alimentación',
      },
      deletedToast: 'Lote de alimentación eliminado con éxito',
      reportErrorToast: 'No fue posible generar el informe del lote de alimentación.',
    },
    filter: {
      title: 'Filtrar lotes de alimentación',
      product: 'Ración/Producto',
      user: 'Responsable',
      startDate: 'Fecha inicial',
      endDate: 'Fecha final',
      productPlaceholder: 'Buscar por ración o producto',
      userPlaceholder: 'Buscar por responsable',
    },
    form: {
      title: {
        create: 'Nuevo Lote de Alimentación',
        edit: 'Editar Lote de Alimentación',
      },
      typeOptions: {
        formulation: 'Fórmula',
        stock: 'Estoque',
      },
      fields: {
        header: {
          code: 'Código',
          responsible: 'Responsable',
          date: 'Fecha',
          type: 'Tipo',
          warehouse: 'Almacén Destino',
          food: 'Ración',
          product: 'Producto',
          productQuantity: 'Cantidad Producida',
          measurement: 'Unidad',
          quantity: 'Cantidad',
          providerLot: 'Lote',
          shelfLife: 'Validez',
          total: 'Total',
        },
        formulationItem: {
          stock: 'Almacén',
          feedstock: 'Materia Prima',
          measurement: 'Unidad',
          stockAvailable: 'Saldo Disponible',
          percentage: 'Porcentaje (%)',
          quantityPredicted: 'Cantidad Prevista',
          quantityRealized: 'Cantidad Realizada',
          difference: 'Diferencia',
          amount: 'Costo Unitario',
          total: 'Total',
          addItem: 'Agregar Materia Prima',
          removeItem: 'Quitar',
          sectionTitle: 'Composición (Materias Primas)',
          insufficientStock: 'La cantidad realizada no puede exceder el saldo disponible.',
        },
        stockItem: {
          warehouse: 'Almacén',
          stock: 'Materia Prima',
          measurement: 'Unidad',
          stockAvailable: 'Stock',
          quantity: 'Cantidad',
          amount: 'Costo Unitario',
          total: 'Total',
          addItem: 'Agregar Ítem',
          removeItem: 'Quitar',
          sectionTitle: 'Ítems de Estoque',
          insufficientStock: 'La cantidad no puede exceder el saldo disponible.',
          duplicateStock: 'Ese estoque ya fue seleccionado en otra línea.',
          footerTotalLabel: 'Total General',
        },
      },
      hints: {
        editReadonlyNotice:
          'En edición, solo la fecha puede ser modificada. Los demás campos se muestran solo para consulta.',
        quantityHelp: 'Informe la cantidad producida o retirada en este lote de alimentación.',
      },
      validation: {
        warehouseRequired: 'Seleccione el almacén.',
        dateRequired: 'Informe la fecha.',
        typeRequired: 'Seleccione el tipo.',
        foodRequired: 'Seleccione la ración.',
        productRequired: 'Seleccione el producto.',
        quantityRequired: 'Informe la cantidad.',
        quantityMin: 'Informe una cantidad mayor que cero.',
        providerLotMax: 'El lote debe tener como máximo 15 caracteres.',
        providerLotRequiredWhenHasLot:
          'Informe el lote — el producto seleccionado exige control de lote.',
        shelfLifeRequiredWhenHasLot:
          'Informe la validez — el producto seleccionado exige control de lote.',
        itemStockRequired: 'Seleccione el estoque de origen.',
        itemWarehouseRequired: 'Seleccione el almacén.',
        itemQuantityRequired: 'Informe la cantidad.',
        itemAmountRequired: 'Informe el costo unitario.',
        itemTotalRequired: 'Informe el total.',
        itemsMin: 'Agregue al menos un ítem.',
        numberType: 'Informe un número válido.',
      },
    },
    report: {
      aggregated: {
        title: 'Informe de Lotes de Alimentación',
        food: 'Ración',
        startDate: 'Fecha inicial',
        endDate: 'Fecha final',
        generate: 'Generar Informe',
      },
    },
  },
};
