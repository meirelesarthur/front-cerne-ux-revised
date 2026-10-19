// src/constants/languages/languageEsEs/languageStockWriteoffs.ts
// Traducción ES-ES del módulo de BAJA DE STOCK (Administrativo). Esteira 038,
// fatia READ (TASK-FE-3001/3002/3003) + fatia WRITE (TASK-FE-3004/3005/3006).

import { ModuleStockWriteoffs } from '@/@types/language/module-stock-writeoffs';

export const languageStockWriteoffs: ModuleStockWriteoffs = {
  stockWriteoff: {
    singularLabel: 'Baja de Stock',
    pluralLabel: 'Bajas de Stock',
    list: {
      pageTitle: 'Baja de Stock',
      pageSubtitle: 'Consulte y elimine bajas de stock registradas para la finca activa.',
      reportButton: 'Informe',
      table: {
        code: 'Código',
        user: 'Responsable',
        warehouse: 'Almacén',
        createdAt: 'Registrado el',
        type: 'Tipo',
        actions: {
          viewDetail: 'Ver Detalle',
          delete: 'Eliminar',
          emitNfe: 'Emitir NFe',
        },
      },
      emptyState: {
        title: 'No se encontraron bajas de stock.',
        description: 'Aún no hay bajas de stock registradas para la finca activa.',
        titleFiltered: 'No se encontraron bajas de stock.',
        descriptionFiltered: 'Intente ajustar el período o limpiar el filtro.',
        cta: 'Nueva baja',
      },
      deletedToast: 'Baja de stock eliminada con éxito',
      deleteDialog: {
        description: '¿Está seguro de que desea eliminar la baja de stock',
        warning:
          'Esta eliminación restaura el stock debitado por esta baja. Es una operación irreversible y puede afectar informes ya emitidos.',
      },
    },
    filter: {
      title: 'Filtrar bajas de stock',
      startDate: 'Fecha de registro (desde)',
      endDate: 'Fecha de registro (hasta)',
      dateRangeInvalid: 'La fecha final no puede ser anterior a la fecha inicial.',
    },
    detail: {
      sections: {
        identification: 'Identificación',
        items: 'Ítems de la Baja',
      },
      fields: {
        code: 'Código',
        type: 'Tipo',
        typeNote: 'Observación del tipo',
        createdAt: 'Registrado el',
        user: 'Responsable',
        warehouse: 'Almacén',
        justification: 'Justificación',
      },
      table: {
        product: 'Producto',
        quantity: 'Cantidad',
        value: 'Valor Unit.',
        amount: 'Valor Total',
        lot: 'Lote',
      },
      totals: {
        quantity: 'Cantidad Total',
        amount: 'Total General',
      },
      itemsEmpty: {
        title: 'No se encontraron ítems.',
        description: 'Esta baja no tiene ítems registrados.',
      },
      notFound: {
        title: 'Baja de stock no encontrada.',
        description: 'No hay baja de stock para el identificador informado.',
        back: 'Volver al listado',
      },
      invalidParamsToast: {
        title: 'Parámetros inválidos',
        description: 'El identificador de la baja es inválido para mostrar el detalle.',
      },
      noData: 'No Posee',
      backButton: 'Volver',
      actions: {
        emitNfe: 'Emitir NFe',
      },
    },
    typeOptions: {
      loss: 'Pérdida',
      deterioration: 'Deterioro',
      theft: 'Robo',
      damage: 'Avería',
      inventory: 'Inventario',
      accounting: 'Contabilización',
      pettyTheft: 'Hurto',
      expirationDate: 'Fecha de Vencimiento',
      freeGift: 'Obsequio',
      donation: 'Donación',
      others: 'Otros',
      consumption: 'Consumo',
      paymentInProduct: 'Pago con Producto',
    },
    form: {
      title: 'Nueva Baja de Stock',
      subtitle: 'Registre la baja de ítems del stock de la finca activa.',
      header: {
        sectionTitle: 'Identificación',
        code: 'Código',
        user: 'Usuario',
        date: 'Fecha',
        type: 'Motivo de baja',
        typePlaceholder: 'Seleccione el motivo de la baja',
        typeNote: 'Observación',
        typeNotePlaceholder: 'Observación adicional sobre el motivo seleccionado (opcional)',
        warehouse: 'Almacén',
        warehousePlaceholder: 'Seleccione el almacén',
        justification: 'Justificación',
        justificationPlaceholder: 'Describa el motivo de esta baja de stock',
        costCenter: 'Centro de Costo',
        costCenterPlaceholder: 'Seleccione el centro de costo (opcional)',
        costCenterHint: 'Campo solo informativo — no es persistido por el sistema.',
      },
      items: {
        sectionTitle: 'Ítems de la Baja',
        addItem: 'Agregar Ítem',
        removeItem: 'Eliminar ítem',
        emptyRow: 'Ningún ítem agregado.',
        stock: 'Producto / Lote',
        stockPlaceholder: 'Seleccione el almacén para listar los stocks',
        saldo: 'Saldo',
        unit: 'Unidad',
        lot: 'Lote',
        quantity: 'Cantidad',
        value: 'Valor Unit.',
        amount: 'Valor Total',
      },
      attachments: {
        sectionTitle: 'Anexos',
        addButton: 'Agregar Anexo',
        removeButton: 'Eliminar anexo',
        emptyLabel: 'Ningún anexo agregado.',
        fields: {
          name: 'Nombre',
          namePlaceholder: 'Nombre del anexo',
          file: 'Archivo',
        },
        fillBeforeAddError: 'Complete el anexo actual antes de agregar uno nuevo.',
        defaultName: 'No Informado',
        dropzoneTitle: 'Arrastre un archivo o haga clic para seleccionar',
        dropzoneDraggingTitle: 'Suelte el archivo aquí',
        changeLabel: 'Cambiar archivo',
        removeLabel: 'Eliminar archivo',
        errorTypeMessage: 'Tipo de archivo no aceptado.',
        errorSizeMessage: 'El archivo excede el tamaño máximo permitido (10MB).',
      },
      footer: {
        cancel: 'Cancelar',
        save: 'Guardar',
      },
      errors: {
        invalidFields: 'Verifique los campos destacados e intente nuevamente.',
      },
      createdToast: 'Baja de stock creada con éxito',
    },
    report: {
      title: 'Informe de Bajas de Stock',
      subtitle: 'Genere el informe en PDF de las bajas de stock de la finca activa.',
      filters: {
        warehouse: 'Almacén',
        warehousePlaceholder: 'Seleccione el almacén',
        product: 'Producto',
        productPlaceholder: 'Seleccione el producto (opcional)',
        startDate: 'Fecha inicial',
        endDate: 'Fecha final',
      },
      submit: 'Generar Informe',
      openError: 'No fue posible generar el informe. Intente nuevamente.',
    },
    nfeHandoff: {
      button: 'Emitir NFe',
      alreadyEmittedWarning: {
        title: 'NFe ya emitida',
        description: 'Esta baja de stock ya tiene una NFe vinculada.',
      },
      draftErrorToast: {
        title: 'No fue posible preparar la NFe',
        description:
          'No fue posible cargar los datos de la baja para precompletar la NFe. Aún puede crear la NFe manualmente.',
      },
      linkedToast: 'NFe vinculada con éxito',
      autoLinkErrorToast: {
        title: 'No fue posible vincular la NFe a la baja',
        description:
          'La NFe fue guardada correctamente, pero no fue posible vincularla a la baja de stock de origen. La acción "Emitir NFe" puede seguir apareciendo en esta baja.',
      },
    },
  },
};
