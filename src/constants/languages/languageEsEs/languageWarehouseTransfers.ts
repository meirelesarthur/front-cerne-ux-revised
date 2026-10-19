// src/constants/languages/languageEsEs/languageWarehouseTransfers.ts
// Traducción ES-ES del módulo "Trans. Armazém" (WarehouseTransfer —
// Inventario, escritura, TASK-WT-FE-01).

import { ModuleWarehouseTransfers } from '@/@types/language/module-warehouse-transfers';

export const languageWarehouseTransfers: ModuleWarehouseTransfers = {
  warehouseTransfer: {
    singularLabel: 'Transferencia entre Almacenes',
    pluralLabel: 'Transferencias entre Almacenes',
    list: {
      columns: {
        code: 'Código',
        date: 'Fecha',
        product: 'Producto',
        originWarehouse: 'Almacén Origen',
        destinationWarehouse: 'Almacén Destino',
        quantity: 'Cantidad',
        user: 'Responsable',
      },
      actions: {
        view: 'Ver',
        edit: 'Editar',
        delete: 'Eliminar',
      },
      emptyState: {
        titleEmpty: 'Ninguna transferencia registrada.',
        descriptionEmpty: 'Comience agregando la primera transferencia entre almacenes.',
        titleFiltered: 'Ninguna transferencia encontrada.',
        descriptionFiltered: 'Intente ajustar los filtros o borrar la búsqueda.',
        cta: 'Agregar Transferencia',
      },
      deletedToast: 'Transferencia eliminada con éxito',
    },
    filter: {
      title: 'Filtrar transferencias',
      product: 'Producto',
      productPlaceholder: 'Buscar por producto',
      destinationWarehouse: 'Almacén Destino',
      destinationWarehousePlaceholder: 'Buscar por almacén destino',
      dateFrom: 'Fecha inicial',
      dateTo: 'Fecha final',
    },
    form: {
      title: {
        create: 'Nueva Transferencia',
        edit: 'Editar Transferencia',
      },
      fields: {
        header: {
          code: 'Código',
          user: 'Responsable',
          date: 'Fecha',
          type: 'Tipo',
          typeValue: 'Transferencia',
          originWarehouse: 'Almacén (origen)',
          destinationWarehouse: 'Almacén Destino',
        },
        item: {
          product: 'Producto',
          measurement: 'Unidad',
          stockAvailable: 'Existencia',
          quantity: 'Cantidad',
          unitValue: 'Valor Unitario',
          totalValue: 'Valor Total',
          costCenter: 'Centro de Costo',
          addItem: 'Agregar Ítem',
          removeItem: 'Quitar',
          sectionTitle: 'Ítems de la Transferencia',
          insufficientStock: 'La cantidad no puede exceder el saldo disponible.',
          duplicateStock: 'Esa existencia ya fue seleccionada en otra línea.',
          footerTotalLabel: 'Total General',
        },
      },
      hints: {
        originWarehouseHelp:
          'El almacén de origen filtra los productos disponibles y no se envía con la transferencia.',
      },
      validation: {
        dateRequired: 'Informe la fecha.',
        destinationWarehouseRequired: 'Seleccione el almacén de destino.',
        originWarehouseRequired: 'Seleccione el almacén de origen.',
        itemsMin: 'Agregue al menos un ítem.',
        itemStockRequired: 'Seleccione el producto/existencia de origen.',
        itemQuantityRequired: 'Informe la cantidad.',
        quantityMin: 'Informe una cantidad mayor que cero.',
        itemCostCenterRequired: 'Seleccione el centro de costo.',
        numberType: 'Informe un número válido.',
      },
    },
  },
};
