// src/constants/languages/languageEsEs/languageOrders.ts
// Traducción ES-ES del módulo "Pedidos" (Order — Operacional / Ventas, F-051,
// 97-Esteiras/043, PED-FE-01 — fundación).

import { ModuleOrders } from '@/@types/language/module-orders';

export const languageOrders: ModuleOrders = {
  order: {
    singularLabel: 'Pedido',
    pluralLabel: 'Pedidos',
    titleModule: 'Pedidos',

    list: {
      pageTitle: 'Pedidos',
      table: {
        columns: {
          status: 'Estado',
          code: 'Nº',
          date: 'Fecha',
          client: 'Cliente',
          user: 'Responsable',
          total: 'Vl. Total',
          actions: 'Acciones',
        },
        actions: {
          view: 'Ver',
          edit: 'Editar',
          delete: 'Eliminar',
          print: 'Imprimir',
          generateSale: 'Generar Venta',
          generateSaleTooltip: 'Disponible solo para pedidos abiertos o en procesamiento.',
          editDisabledTooltip: 'Solo se pueden editar pedidos abiertos o en procesamiento.',
          deleteDisabledTooltip: 'Solo se pueden eliminar pedidos abiertos o en procesamiento.',
        },
      },
      emptyState: {
        titleEmpty: 'Ningún pedido registrado.',
        descriptionEmpty: 'Comience agregando el primer pedido.',
        titleFiltered: 'Ningún pedido encontrado.',
        descriptionFiltered: 'Intente ajustar los filtros o borrar la búsqueda.',
        cta: 'Agregar Pedido',
      },
      deletedToast: 'Pedido eliminado con éxito',
      printErrorToast: 'No fue posible generar el PDF del pedido.',
      deleteConfirm: {
        title: '¿Está seguro?',
        description: 'Esta acción no se puede deshacer.',
      },
      error: {
        message: 'No fue posible cargar los pedidos.',
        retry: 'Intentar de nuevo',
      },
    },

    filter: {
      title: 'Filtrar pedidos',
      search: 'Nº',
      searchPlaceholder: 'Buscar por número',
      product: 'Producto',
      productPlaceholder: 'Buscar por producto',
      client: 'Cliente',
      clientPlaceholder: 'Buscar por cliente',
      startDate: 'Fecha inicial',
      endDate: 'Fecha final',
      paginationQuantity: 'Registros por página',
    },

    detail: {
      notFound: {
        title: 'Pedido no encontrado',
        description: 'El pedido solicitado no existe o fue eliminado.',
        back: 'Volver al listado',
      },
      backButton: 'Volver',
      editButton: 'Editar',
      printButton: 'Imprimir',
      generateSaleButton: 'Generar Venta',
      sections: {
        header: 'Datos del Pedido',
        items: 'Ítems',
        payment: 'Pago',
        totals: 'Totales',
      },
      emptyItems: 'Ningún ítem registrado.',
      originBudgetLabel: 'Origen: Presupuesto',
      dates: {
        createdAt: 'Creado el',
        updatedAt: 'Actualizado el',
      },
    },

    status: {
      emAberto: 'Abierto',
      emProcessamento: 'En Procesamiento',
      finalizado: 'Finalizado',
      cancelado: 'Cancelado',
    },

    hasInputOptions: {
      sim: 'Sí',
      nao: 'No',
    },

    fiscalDocumentOptions: {
      sim: 'Sí',
      nao: 'No',
    },

    form: {
      title: {
        create: 'Nuevo Pedido',
        edit: 'Editar Pedido',
      },
      sections: {
        header: 'Datos del Pedido',
        items: 'Ítems del Pedido',
        payment: 'Pago',
      },
      fields: {
        header: {
          code: 'Número',
          user: 'Responsable',
          date: 'Fecha',
          client: 'Cliente',
          note: 'Observación',
        },
        footer: {
          subtotal: 'Subtotal',
          freight: 'Flete',
          discount: 'Descuento',
          total: 'Total',
        },
        item: {
          sectionTitle: 'Ítems del Pedido',
          product: 'Producto',
          productPlaceholder: 'Buscar producto',
          um: 'UM',
          quantity: 'Cantidad',
          price: 'Precio',
          discount: 'Descuento',
          discountPercent: 'Descuento %',
          total: 'Total',
          addItem: 'Agregar ítem',
          removeItem: 'Eliminar ítem',
          addIncompleteError: 'Complete todos los campos del ítem actual antes de agregar otro.',
          removeLastError: 'Debe mantener al menos un ítem en el pedido.',
          removeConfirm: {
            title: '¿Eliminar ítem?',
            description: 'Este ítem será eliminado del pedido.',
          },
          productModal: {
            addAria: 'Agregar nuevo producto',
            editAria: 'Editar producto seleccionado',
          },
        },
        payment: {
          sectionTitle: 'Pago',
          paymentMethod: 'Forma de Pago',
          hasInput: '¿Tiene Entrada?',
          inputDate: 'Fecha de la Entrada',
          inputValue: 'Valor de la Entrada',
          installments: 'Nº de Cuotas',
          dueDate: 'Vencimiento (1ª Cuota)',
          interval: 'Intervalo entre Cuotas (días)',
          fiscalDocument: 'Deducible',
          installmentsTable: {
            date: 'Fecha',
            value: 'Valor',
          },
          adjustRefusedToast: 'Ajuste inválido: la última cuota quedaría en cero o negativa.',
        },
      },
      placeholders: {
        header: {
          client: 'Seleccione el cliente',
        },
      },
      clientModal: {
        addAria: 'Agregar nuevo cliente',
        editAria: 'Editar cliente seleccionado',
      },
      unsavedChangesDialog: {
        title: '¿Salir sin guardar?',
        description: 'Hay cambios no guardados en este formulario que se perderán',
        confirmButton: 'Salir sin guardar',
      },
      errors: {
        invalidFields: 'Revise los campos obligatorios destacados e intente nuevamente.',
      },
      noChangesToast: 'Nada para guardar — no se realizó ningún cambio.',
      validation: {
        clientRequired: 'Seleccione el cliente.',
        dateRequired: 'Informe la fecha.',
        freightMin: 'Informe un flete mayor o igual a cero.',
        itemsMin: 'Agregue al menos un ítem.',
        itemProductRequired: 'Seleccione el producto.',
        itemQuantityRequired: 'Informe la cantidad.',
        itemPriceRequired: 'Informe el precio.',
        itemDiscountExceedsTotal:
          '¡El valor del descuento no puede ser mayor que el total del producto!',
        itemDiscountPercentMax: '¡El porcentaje del descuento no puede ser mayor que 100!',
        noteMax: 'La observación debe tener como máximo 200 caracteres.',
        installmentInputDateRequired: 'Informe la fecha de la entrada.',
        installmentInputValueRequired: 'Informe el valor de la entrada.',
        paymentMethodRequired: 'Seleccione la forma de pago.',
        installmentsRequired: 'Informe el número de cuotas.',
        dueDateRequired: 'Informe el vencimiento de la 1ª cuota.',
        installmentDateInvalid: 'Por favor ingrese una fecha válida.',
        numberType: 'Informe un número válido.',
      },
    },

    generateSaleScreen: {
      pageTitle: 'Generar Venta a partir del Pedido',
      backButton: 'Volver',
      saveButton: 'Generar Venta',
      sections: {
        order: 'Pedido de Origen',
        items: 'Ítems Elegibles',
      },
      orderFields: {
        code: 'Nº del Pedido',
        client: 'Cliente',
        status: 'Estado',
      },
      item: {
        orderedQuantity: 'Cant. Pedida',
        remainingQuantity: 'Saldo Disponible',
        availableStock: 'Stock Disponible',
        stockLoadError: 'No fue posible consultar el stock de este ítem.',
      },
      emptyEligibleItems: {
        title: 'Ningún ítem con saldo disponible.',
        description: 'Todos los ítems de este pedido ya fueron totalmente vendidos.',
      },
      loadError: {
        message: 'No fue posible cargar los datos del pedido para generar la venta.',
        retry: 'Intentar de nuevo',
      },
      successToast: 'Venta generada con éxito a partir del pedido',
      validation: {
        itemsMin: 'Este pedido no tiene ítems elegibles para generar una venta.',
        itemQuantityExceedsRemaining: 'La cantidad no puede ser mayor que el saldo disponible.',
      },
    },
  },
};
