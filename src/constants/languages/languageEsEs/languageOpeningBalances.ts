// src/constants/languages/languageEsEs/languageOpeningBalances.ts
// Traducción ES-ES del módulo de INVENTARIO INICIAL (Cadastros Base).
// TASK-FE-1040 (fundación) — rótulo fiel al legado (`trad.estoque_inicial`,
// Doc Bruta §13). TASK-FE-1042 (listado) agrega `list`/`filter`.

import { ModuleOpeningBalances } from '@/@types/language/module-opening-balances';

export const languageOpeningBalances: ModuleOpeningBalances = {
  openingBalance: {
    singularLabel: 'Inventario Inicial',
    pluralLabel: 'Inventarios Iniciales',
    list: {
      pageTitle: 'Inventarios Iniciales',
      pageSubtitle: 'Administre los saldos iniciales registrados por producto y almacén.',
      deletedToast: 'Inventario Inicial eliminado con éxito',
      table: {
        product: 'Producto',
        measurement: 'Un. Medida',
        warehouse: 'Almacén',
        quantity: 'Cantidad',
        movementDate: 'Fec. Movimiento',
        providerLot: 'Lote Proveedor',
        classification: 'Clasificación',
        // Fallback literal del legado (`trad.var_nao_possui`).
        noData: 'No Posee',
      },
      actions: {
        edit: 'Editar',
        delete: 'Eliminar',
      },
      emptyState: {
        titleEmpty: 'Ningún inventario inicial registrado.',
        descriptionEmpty: 'Comience agregando el primer inventario inicial.',
        titleFiltered: 'Ningún inventario inicial encontrado.',
        descriptionFiltered: 'Intente ajustar los filtros o limpiar la búsqueda.',
        cta: 'Agregar Inventario Inicial',
      },
    },
    filter: {
      title: 'Filtrar inventarios iniciales',
      search: 'Buscar',
      searchPlaceholder: 'Buscar por producto o lote',
      product: 'Producto',
      productPlaceholder: 'Todos los productos',
      warehouse: 'Almacén',
      warehousePlaceholder: 'Todos los almacenes',
    },
    // Formulario Crear/Editar, Zonas 1-3 — TASK-FE-1043.
    form: {
      title: {
        create: 'Nuevo Inventario Inicial',
        edit: 'Editar Inventario Inicial',
      },
      subtitle: {
        create: 'Complete los datos del saldo inicial de inventario',
        edit: 'Actualice el saldo inicial de inventario',
      },
      sections: {
        identification: 'Identificación',
        quantitiesValues: 'Cantidades y Valores',
        additionalInfo: 'Información Adicional',
        coffeeInfo: 'Información del Café',
      },
      fields: {
        product: 'Producto',
        warehouse: 'Almacén',
        measurement: 'Unidad de Medida',
        quantity: 'Cant. Total',
        amount: 'Vl. Unitario',
        totalAmount: 'Valor Total',
        averageCost: 'Costo Medio Unitario',
        providerLot: 'Lote Proveedor',
        expirationDate: 'Fecha de Vencimiento',
        classification: 'Clasificación',
        drink: 'Bebida',
      },
      placeholders: {
        product: 'Buscar producto por nombre o código...',
        warehouse: 'Seleccione el almacén...',
        providerLot: 'Ej: LOT-2025-001',
        classification: 'Seleccione la clasificación...',
      },
      hints: {
        measurementAutoFilled: 'Completada automáticamente a partir del producto seleccionado',
        totalAmountFormula: '= Cant. × Vl. Unit.',
        averageCostFormula: '= Valor Total ÷ Cant. Total',
      },
      // Jerga de clasificación de bebida/calidad de taza del Café
      // (`agro365/app/ItemInvoice.php::drinks()`) — texto IDÉNTICO en los 3
      // idiomas, misma grafía del legado (la jerga técnica no se traduce).
      drinkOptions: {
        extMole: 'EXT. MOLE',
        mole: 'MOLE',
        duroMais: 'DURO +',
        duro: 'DURO',
        duroVerde: 'DURO/VERDE',
        duroSujo: 'DURO/SUJO',
        duroFrtd: 'DURO/FRTD',
        duro1Riada: 'DURO/1 RIADA',
        duro2Riadas: 'DURO/2 RIADAS',
        duro3Riadas: 'DURO/3 RIADAS',
        duro4Riadas: 'DURO/4 RIADAS',
        duroRiado: 'DURO RIADO',
        riado: 'RIADO',
        d1ri1rio: 'D/1RI/1RIO',
        d1ri2rio: 'D/1RI/2RIO',
        d2ri1rio: 'D/2RI/1RIO',
        dRiRio: 'D/RI/RIO',
        riadoRio: 'RIADO/RIO',
        rio: 'RIO',
        rioZona: 'RIO ZONA',
        rioZonal: 'RIO ZONAL',
      },
      validation: {
        quantityRequired: 'Informe la cantidad',
        quantityMin: 'Informe una cantidad válida (mayor que cero)',
        quantityMax: 'La cantidad total excede el máximo permitido.',
        amountRequired: 'Informe el valor unitario',
        amountMin: 'El valor unitario no puede ser negativo',
        amountMax: 'El valor unitario excede el máximo permitido.',
        totalMax:
          'El valor total (cantidad × valor unitario) excede el máximo permitido (99.999.999,99).',
        providerLotRequired: 'Lote obligatorio para este producto',
        providerLotMaxLength: 'El lote debe tener como máximo 15 caracteres',
        expirationDateRequired: 'Fecha de vencimiento obligatoria para este producto',
      },
      duplicateAlert: {
        title: 'Ya existe un saldo inicial para este producto en este almacén.',
        dismissAction: 'Entendido',
      },
      errors: {
        invalidFields: 'Hay campos obligatorios sin completar o inválidos.',
      },
    },
    // Detalle (vista) — TASK-FE-1045.
    detail: {
      pageTitle: 'Ver Inventario Inicial',
      notFound: {
        title: 'Inventario Inicial no encontrado',
        description: 'El registro solicitado no existe o ha sido eliminado.',
        back: 'Atrás',
      },
      actions: {
        back: 'Atrás',
        edit: 'Editar',
      },
    },
    // Acciones de Excel (descargar modelo/importar/exportar) — TASK-FE-1047.
    excel: {
      downloadTemplate: 'Descargar modelo',
      export: 'Exportar',
      downloadTemplateError: 'No se pudo descargar el modelo. Intente nuevamente.',
      exportError: 'No se pudieron exportar los datos. Intente nuevamente.',
      import: {
        menuLabel: 'Importar',
        title: 'Importar Inventario Inicial',
        subtitle:
          'Descargue el modelo, complételo y envíe la planilla para registrar los saldos iniciales en lote.',
        instructions:
          'Las columnas Producto, Almacén, Cant. Total y Vl. Unitario son obligatorias en cada fila. Seleccione el Producto y el Almacén desde los desplegables validados (hojas auxiliares de la planilla) — el saldo siempre se importa sin lote.',
        warning: {
          title: 'Los registros existentes se sobrescriben',
          description:
            'Si ya existe un saldo inicial para el mismo producto y almacén, la cantidad y el valor unitario de esta planilla REEMPLAZAN los valores actuales — la importación nunca se suma a las cantidades ya registradas.',
        },
        downloadShortcut: 'Descargar modelo',
        fileUpload: {
          label: 'Planilla completada',
          hint: 'Envíe el archivo .xlsx completado a partir del modelo descargado.',
          dropzoneTitle: 'Arrastre la planilla o haga clic para seleccionar',
          dropzoneDraggingTitle: 'Suelte la planilla aquí',
          changeLabel: 'Cambiar archivo',
          removeLabel: 'Eliminar archivo',
          errorTypeMessage: 'Formato no aceptado. Envíe un archivo .xlsx.',
          errorSizeMessage: 'El archivo excede el tamaño máximo de 10MB.',
        },
        cancelButton: 'Cancelar',
        submitButton: 'Importar',
        importSuccessToast: 'Importación del inventario inicial completada con éxito.',
        result: {
          imported: 'Importados',
        },
        rowErrors: {
          title: 'Algunas filas no se pudieron importar — corríjalas y envíe nuevamente',
          rowPrefix: 'Fila {row}:',
        },
        closeButton: 'Cerrar',
      },
    },
  },
};
