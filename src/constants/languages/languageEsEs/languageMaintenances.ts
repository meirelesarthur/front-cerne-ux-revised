// src/constants/languages/languageEsEs/languageMaintenances.ts
// Traducción ES-ES del módulo Gestión de Flota — Mantenimientos (Maintenance,
// F-103) — Tareas 43/44/45 (esteira 010).

import { ModuleMaintenances } from '@/@types/language/module-maintenances';

export const languageMaintenances: ModuleMaintenances = {
  maintenance: {
    singularLabel: 'Mantenimiento',
    pluralLabel: 'Mantenimientos',
    list: {
      pageTitle: 'Mantenimientos',
      pageSubtitle: 'Mantenimientos de flota por equipo, con consumo de stock y mano de obra.',
      deletedToast: 'Mantenimiento eliminado con éxito',
      table: {
        code: 'Código',
        date: 'Fecha',
        requester: 'Solicitante',
        actions: 'Acciones',
      },
      itemsTable: {
        equipment: 'Equipo',
        warehouse: 'Almacén',
        product: 'Producto',
        measurement: 'Unidad',
        hourMeter: 'Horómetro',
        mileage: 'Km',
        quantity: 'Cantidad',
        amount: 'Valor Unitario',
        totalAmount: 'Valor Total',
        executor: 'Ejecutor',
        laborCost: 'Costo de Mano de Obra',
        note: 'Observación',
      },
      actions: {
        view: 'Ver',
        edit: 'Editar',
        delete: 'Eliminar',
      },
      filter: {
        title: 'Filtrar mantenimientos',
        equipment: 'Equipo',
        equipmentPlaceholder: 'Buscar equipo',
        startDate: 'Fecha inicio',
        endDate: 'Fecha fin',
      },
      emptyState: {
        title: 'Ningún mantenimiento registrado.',
        description: 'Comience agregando su primer mantenimiento.',
        titleFiltered: 'Ningún mantenimiento encontrado.',
        descriptionFiltered: 'Intente ajustar los filtros o borrar la búsqueda.',
        cta: 'Agregar Nuevo',
      },
      errorState: {
        title: 'No fue posible cargar los mantenimientos.',
        description: 'Verifique su conexión e intente nuevamente.',
        retry: 'Intentar nuevamente',
      },
    },
    form: {
      title: {
        create: 'Nuevo Mantenimiento',
        edit: 'Editar Mantenimiento',
      },
      subtitle: {
        create: 'Registre un nuevo mantenimiento de flota.',
        edit: 'Actualice los datos del mantenimiento.',
      },
      fields: {
        code: 'Código',
        date: 'Fecha',
        requester: 'Solicitante',
      },
      items: {
        title: 'Ítems',
        addItem: 'Agregar Ítem',
        removeItem: 'Eliminar',
        emptyRow: 'Ningún ítem agregado.',
        fields: {
          equipment: 'Equipo',
          hourMeter: 'Horómetro',
          mileage: 'Km',
          warehouse: 'Almacén',
          product: 'Producto',
          measurement: 'Unidad',
          quantity: 'Cantidad',
          stock: 'Stock',
          note: 'Observación',
          executorType: 'Tipo de Ejecutor',
          employee: 'Empleado',
          employeeHours: 'Horas',
          provider: 'Proveedor',
          providerTotal: 'Costo Total',
        },
        placeholders: {
          equipment: 'Buscar equipo',
          warehouse: 'Buscar almacén',
          product: 'Buscar producto',
          measurement: 'Seleccione la unidad',
          employee: 'Buscar empleado',
          provider: 'Buscar proveedor',
          requester: 'Buscar usuario',
        },
        executorTypeOptions: {
          employee: 'Empleado',
          provider: 'Proveedor',
        },
      },
      stockExceedsDialog: {
        title: 'Atención',
        intro: 'La cantidad informada es mayor que la cantidad en stock.',
        informedQuantityLabel: 'Cantidad Informada',
        stockQuantityLabel: 'Cantidad en stock',
        confirm: 'Cerrar',
      },
      errors: {
        invalidFields: 'Revise los campos destacados.',
      },
    },
    detail: {
      title: 'Mantenimiento',
      sections: {
        header: 'Identificación',
        items: 'Ítems',
      },
      actions: {
        edit: 'Editar',
        delete: 'Eliminar',
        generateFinancial: 'Generar Financiero',
      },
      notFound: {
        title: 'Mantenimiento no encontrado.',
        description: 'Verifique si todavía existe.',
        back: 'Volver al listado',
      },
    },
    generateFinancial: {
      pageTitlePrefix: 'Generar Financiero — Mantenimiento',
      backToDetail: 'Volver al Mantenimiento',
      providerBlock: {
        fields: {
          provider: 'Proveedor',
          number: 'Número del Título',
          typeTitle: 'Tipo de Título',
          proprietary: 'Propietario',
          note: 'Observación',
          fiscalDocument: 'Documento Fiscal',
          total: 'Valor Total',
        },
        placeholders: {
          number: 'Número del título',
          typeTitle: 'Buscar tipo de título',
          proprietary: 'Buscar propietario',
        },
      },
      apportionment: {
        title: 'Prorrateo',
        addButton: 'Agregar Categoría',
        removeButton: 'Eliminar',
        emptyLabel: 'Ninguna categoría agregada.',
        sumBadgeLabel: 'Suma del prorrateo',
        sumNotClosed: 'La suma del prorrateo debe coincidir exactamente con el Valor Total.',
        fields: {
          category: 'Categoría Financiera',
          center: 'Centro de Costo',
          value: 'Valor',
        },
        placeholders: {
          category: 'Buscar categoría',
          center: 'Buscar centro de costo',
        },
      },
      installments: {
        title: 'Plazos',
        generateButton: 'Generar Plazos',
        addButton: 'Agregar Plazo',
        removeButton: 'Eliminar',
        emptyLabel: 'Ningún plazo agregado.',
        sumBadgeLabel: 'Suma de los plazos',
        overwriteConfirm: 'Ya existen plazos generados. ¿Desea reemplazarlos?',
        fields: {
          installmentCount: 'Nº Plazos',
          firstDueDate: 'Venc. 1ª cuota',
          intervalDays: 'Intervalo (días)',
          dueDate: 'Vencimiento',
          value: 'Valor',
        },
      },
      errors: {
        alreadyGenerated: 'El financiero de este Mantenimiento ya fue generado.',
        noProviderItems: 'Este Mantenimiento no tiene ítems con proveedor.',
        apportionmentNotClosed:
          'El prorrateo de uno o más proveedores no coincide con el Valor Total.',
        installmentsRequired: 'Genere o agregue al menos un plazo para el proveedor {provider}.',
        installmentsInvalid:
          'Informe vencimiento y valor mayor que cero en todos los plazos del proveedor {provider}.',
      },
      actions: {
        generate: 'Generar',
        cancel: 'Cancelar',
      },
      notFound: {
        title: 'Mantenimiento no encontrado.',
        description: 'Verifique si todavía existe.',
        back: 'Volver al listado',
      },
    },
  },
};
