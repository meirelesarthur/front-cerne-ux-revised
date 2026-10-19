// src/constants/languages/languageEsEs/languageNutritions.ts
// Traducción ES-ES del módulo "Nutrición" (Nutrition — Operacional /
// Lanzamiento de consumo de ración, TASK-NT-FE-01).

import { ModuleNutritions } from '@/@types/language/module-nutritions';

export const languageNutritions: ModuleNutritions = {
  nutrition: {
    singularLabel: 'Nutrición',
    pluralLabel: 'Nutriciones',
    list: {
      columns: {
        code: 'Código',
        date: 'Fecha',
        employeeOrUser: 'Responsable',
        areasGrazings: 'Áreas/Pastoreos',
        batches: 'Lotes',
        products: 'Productos',
        quantity: 'Cantidad Total',
        timeControl: 'Control de Horas',
        actions: 'Acciones',
      },
      actions: {
        view: 'Ver',
        edit: 'Editar',
        delete: 'Eliminar',
      },
      emptyState: {
        titleEmpty: 'Ninguna nutrición registrada.',
        descriptionEmpty: 'Comience agregando la primera nutrición.',
        titleFiltered: 'Ninguna nutrición encontrada.',
        descriptionFiltered: 'Intente ajustar los filtros o borrar la búsqueda.',
        cta: 'Agregar Nutrición',
      },
      deletedToast: 'Nutrición eliminada con éxito',
    },
    filter: {
      title: 'Filtrar nutriciones',
      startDate: 'Fecha inicial',
      endDate: 'Fecha final',
      product: 'Producto',
      productPlaceholder: 'Buscar por producto',
      batch: 'Lote',
      batchPlaceholder: 'Buscar por lote',
      employee: 'Empleado',
      employeePlaceholder: 'Buscar por empleado',
    },
    detail: {
      back: 'Volver',
    },
    form: {
      title: {
        create: 'Nueva Nutrición',
        edit: 'Editar Nutrición',
        view: 'Ver Nutrición',
      },
      fields: {
        header: {
          code: 'Código',
          date: 'Fecha',
          user: 'Responsable',
          timeControl: 'Control de Horas',
        },
        item: {
          sectionTitle: 'Ítems',
          warehouse: 'Almacén',
          warehouseDeletedSuffix: '(eliminado)',
          product: 'Producto',
          dietBeat: 'Dieta Automática',
          um: 'Unidad',
          stock: 'Existencia',
          quantity: 'Cantidad',
          area: 'Área',
          grazing: 'Pastoreo',
          trough: 'Comedero',
          note: 'Observación',
          costCenter: 'Centro de Costo',
          batches: 'Lotes',
          batchesSearchPlaceholder: 'Buscar lote',
          batchesSelectedCountLabel: 'Lotes seleccionados',
          addItem: 'Agregar Ítem',
          removeItem: 'Quitar',
          insufficientStock: 'La cantidad no puede exceder la existencia disponible.',
        },
        employee: {
          sectionTitle: 'Control de Horas',
          funcType: 'Tipo',
          funcExecutor: 'Ejecutor',
          funcUm: 'Unidad',
          funcTotalQuantity: 'Cantidad Total',
          addEmployee: 'Agregar',
          removeEmployee: 'Quitar',
        },
      },
      validation: {
        dateRequired: 'Informe la fecha.',
        numberType: 'Informe un número válido.',
        quantityMin: 'Informe una cantidad mayor que cero.',
        itemTroughRequired: 'Seleccione el comedero.',
        itemQuantityRequired: 'Informe la cantidad.',
        itemProductOrDietRequired: 'Seleccione el producto o la dieta automática.',
        itemWarehouseRequired: 'Seleccione el almacén.',
        itemBatchesMin: 'Seleccione al menos un lote.',
        itemsMin: 'Agregue al menos un ítem.',
        employeeFuncTypeRequired: 'Seleccione el tipo.',
        employeeFuncExecutorRequired: 'Seleccione el ejecutor.',
        employeeFuncUmRequired: 'Seleccione la unidad.',
        employeeFuncTotalRequired: 'Informe la cantidad total.',
      },
    },
    options: {
      funcType: {
        employee: 'Empleado',
        function: 'Función',
        provider: 'Proveedor',
      },
      timeControl: {
        yes: 'Sí',
        no: 'No',
      },
    },
  },
};
