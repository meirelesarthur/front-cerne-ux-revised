// src/constants/languages/languageEsEs/languagePlannings.ts
// Traducción ES-ES del módulo OPERACIONAL/Agricultura — Planificaciones
// (Planning) — dominio propio, TASK-FE-PLAN-01 (esteira `97-Esteiras/007`,
// fracción LISTADO).

import { ModulePlannings } from '@/@types/language/module-plannings';

export const languagePlannings: ModulePlannings = {
  planning: {
    singularLabel: 'Planificación',
    pluralLabel: 'Planificaciones',
    list: {
      pageTitle: 'Planificaciones',
      pageSubtitle: 'Planificación de Cultivo/Variedad por cosecha.',
      deletedToast: 'Planificación eliminada con éxito',
      duplicatedToast: 'Planificación duplicada con éxito',
      reportErrorToast: 'No fue posible generar el informe de la planificación.',
      statusLabels: {
        pending: 'Pendiente',
        released: 'Liberado',
        closed: 'Cerrado',
      },
      table: {
        status: 'Estado',
        code: 'Código',
        harvest: 'Cosecha',
        responsible: 'Responsable',
        planningTotal: 'Valor Planificado',
        planningArea: 'Valor/área',
      },
      actions: {
        edit: 'Editar',
        duplicate: 'Duplicar',
        print: 'Imprimir',
        delete: 'Eliminar',
      },
      deleteConfirm: {
        header: 'Eliminar Planificación',
        body: '¿Está seguro de que desea eliminar esta planificación? Esta acción no se puede deshacer.',
      },
      emptyState: {
        title: 'Ninguna planificación registrada.',
        description: 'Comience creando su primera planificación.',
        cta: 'Nueva Planificación',
      },
    },
    form: {
      title: {
        create: 'Nueva Planificación',
        edit: 'Editar Planificación',
      },
      subtitle: {
        create: 'Planificación de Cultivo/Variedad por cosecha.',
        edit: 'Planificación de Cultivo/Variedad por cosecha.',
      },
      fields: {
        code: 'Código',
        codeGeneratedPlaceholder: 'Generado automáticamente al guardar',
        responsible: 'Responsable',
        harvest: 'Cosecha',
        createdAt: 'Fecha de registro',
        area: 'Área',
        areaTotal: 'Área Total (ha)',
        plantedArea: 'Área Plantada (ha)',
        availableArea: 'Área Disponible (ha)',
        status: 'Estado',
        commercialDollar: 'Cotización Dólar (US$)',
        realSc: 'R$/saco',
        planningTotal: 'Valor Planificado',
        planningArea: 'Valor/área',
      },
      placeholders: {
        harvest: 'Seleccione la cosecha',
        area: 'Seleccione el área',
        status: 'Seleccione el estado',
      },
      errors: {
        required: 'Campo obligatorio',
      },
      unsavedChangesDialog: {
        title: '¿Salir sin guardar?',
        description: 'Hay cambios sin guardar en este formulario que se perderán',
        confirmButton: 'Salir sin guardar',
      },
    },
    tree: {
      title: 'Cultivo/Variedad',
      empty: {
        title: 'Ningún cultivo registrado todavía.',
        description:
          'Agregue un Cultivo/Variedad para empezar a construir el árbol de la planificación.',
      },
      error: {
        title: 'No fue posible cargar el árbol.',
        description: 'Ocurrió un error al buscar los cultivos de esta planificación.',
      },
      cultivation: {
        singularLabel: 'Cultivo/Variedad',
        actions: {
          new: 'Nuevo Cultivo/Variedad',
          edit: 'Editar',
          delete: 'Eliminar',
        },
        deletedToast: 'Cultivo/variedad eliminado con éxito',
        deleteConfirm: {
          header: 'Eliminar Cultivo/Variedad',
          body: '¿Está seguro de que desea eliminar este cultivo/variedad? Las operaciones vinculadas también se eliminarán.',
        },
        dialog: {
          title: {
            create: 'Nuevo Cultivo/Variedad',
            edit: 'Editar Cultivo/Variedad',
          },
          fields: {
            cultivation: 'Cultivo',
            variety: 'Variedad',
            startDate: 'Fecha de inicio',
            endDate: 'Fecha de fin',
            startPlantingDate: 'Fecha de inicio de siembra',
            cycle: 'Ciclo (días)',
            forecast: 'Previsión de cosecha',
          },
          placeholders: {
            cultivation: 'Seleccione el cultivo',
            variety: 'Seleccione la variedad',
            varietyNoCultivation: 'Seleccione el cultivo primero',
          },
          errors: {
            required: 'Campo obligatorio',
          },
          createdToast: 'Cultivo/variedad creado con éxito',
          updatedToast: 'Cultivo/variedad actualizado con éxito',
        },
      },
      operation: {
        singularLabel: 'Operación',
        actions: {
          new: 'Crear Operación',
          definePeriod: 'Definir Período',
          delete: 'Eliminar',
        },
        deletedToast: 'Operación eliminada con éxito',
        empty: {
          title: 'Ninguna operación registrada todavía.',
          description: 'Cree una operación manualmente para empezar.',
        },
        deleteConfirm: {
          header: 'Eliminar Operación',
          body: '¿Está seguro de que desea eliminar esta operación? Esta acción no se puede deshacer.',
        },
        dialog: {
          title: {
            create: 'Crear Operación',
            definePeriod: 'Definir Período',
          },
          fields: {
            operation: 'Operación',
            startDate: 'Fecha de inicio',
            endDate: 'Fecha de fin',
          },
          placeholders: {
            operation: 'Seleccione la operación',
          },
          errors: {
            required: 'Campo obligatorio',
          },
          actions: {
            definePeriodSubmit: 'Guardar período',
          },
          createdToast: 'Operación creada con éxito',
          updatedToast: 'Período de la operación actualizado con éxito',
        },
      },
      production: {
        singularLabel: 'Producción',
        rowLabel: '1. Producción',
        actions: {
          edit: 'Definir Producción',
        },
        dialog: {
          title: 'Definir Producción',
          fields: {
            cultivation: 'Cultivo/Variedad',
            productionQuantity: 'Cantidad de producción (por ha)',
          },
          errors: {
            required: 'Campo obligatorio',
          },
          updatedToast: 'Producción actualizada con éxito',
        },
      },
      activity: {
        singularLabel: 'Actividad',
        actions: {
          new: 'Nueva Actividad',
          edit: 'Editar',
          delete: 'Eliminar',
        },
        deletedToast: 'Actividad eliminada con éxito',
        empty: {
          title: 'Aún no hay actividades registradas.',
          description: 'Agregue una actividad para comenzar.',
        },
        deleteConfirm: {
          header: 'Eliminar Actividad',
          body: '¿Está seguro de que desea eliminar esta actividad? Esta acción no se puede deshacer.',
        },
        dialog: {
          title: {
            create: 'Nueva Actividad',
            edit: 'Editar Actividad',
          },
          fields: {
            activity: 'Actividad',
            startDate: 'Fecha de inicio',
            endDate: 'Fecha de fin',
          },
          placeholders: {
            activity: 'Seleccione la actividad',
          },
          errors: {
            required: 'Campo obligatorio',
          },
          createdToast: 'Actividad creada con éxito',
          updatedToast: 'Actividad actualizada con éxito',
        },
      },
      otherActivity: {
        singularLabel: 'Otra Actividad',
        actions: {
          new: 'Agregar Actividad',
          delete: 'Eliminar',
        },
        deletedToast: 'Actividad eliminada con éxito',
        empty: {
          title: 'Aún no hay otras actividades registradas.',
          description: 'Agregue una actividad al grupo "Otros" de este cultivo.',
        },
        deleteConfirm: {
          header: 'Eliminar Actividad',
          body: '¿Está seguro de que desea eliminar esta actividad del grupo "Otros"? Esta acción no se puede deshacer.',
        },
        dialog: {
          title: 'Agregar Actividad',
          fields: {
            activity: 'Actividad',
            quantity: 'Cant./ha',
            amount: 'Valor Unitario (R$)',
            total: 'Valor Total (R$)',
          },
          placeholders: {
            activity: 'Seleccione la actividad',
          },
          errors: {
            required: 'Campo obligatorio',
          },
          totalHelperText:
            'Calculado automáticamente (Cant./ha × Valor Unitario × Área Plantada). El servidor siempre recalcula el valor final.',
          createdToast: 'Actividad agregada con éxito',
        },
      },
      product: {
        singularLabel: 'Insumo',
        actions: {
          new: 'Nuevo Insumo',
          edit: 'Editar',
          delete: 'Eliminar',
        },
        deletedToast: 'Insumo eliminado con éxito',
        empty: {
          title: 'Aún no hay insumos registrados.',
          description: 'Agregue un insumo para comenzar.',
        },
        deleteConfirm: {
          header: 'Eliminar Insumo',
          body: '¿Está seguro de que desea eliminar este insumo? Esta acción no se puede deshacer.',
        },
        dialog: {
          title: {
            create: 'Nuevo Insumo',
            edit: 'Editar Insumo',
          },
          fields: {
            warehouse: 'Almacén',
            product: 'Producto',
            measurement: 'Unidad',
            stock: 'Existencia',
            quantity: 'Cant./ha',
            amount: 'Valor Unitario (R$)',
            total: 'Valor Total (R$)',
          },
          placeholders: {
            warehouse: 'Seleccione el almacén',
            product: 'Seleccione el producto',
          },
          errors: {
            required: 'Campo obligatorio',
          },
          stockHelperText: 'Saldo disponible en el almacén seleccionado — solo informativo.',
          totalHelperText:
            'Calculado automáticamente (Cant./ha × Valor Unitario × Área Plantada). El servidor siempre recalcula el valor final.',
          createdToast: 'Insumo agregado con éxito',
          updatedToast: 'Insumo actualizado con éxito',
        },
      },
      equipment: {
        singularLabel: 'Equipo',
        actions: {
          new: 'Nuevo Equipo',
          edit: 'Editar',
          delete: 'Eliminar',
        },
        deletedToast: 'Equipo eliminado con éxito',
        empty: {
          title: 'Aún no hay equipos registrados.',
          description: 'Agregue un equipo para comenzar.',
        },
        deleteConfirm: {
          header: 'Eliminar Equipo',
          body: '¿Está seguro de que desea eliminar este equipo? Esta acción no se puede deshacer.',
        },
        dialog: {
          title: {
            create: 'Nuevo Equipo',
            edit: 'Editar Equipo',
          },
          fields: {
            equipment: 'Equipo',
            measurement: 'Unidad',
            quantity: 'Cant./ha',
            amount: 'Valor Unitario (R$)',
            total: 'Valor Total (R$)',
          },
          placeholders: {
            equipment: 'Seleccione el equipo',
          },
          errors: {
            required: 'Campo obligatorio',
          },
          totalHelperText:
            'Calculado automáticamente (Cant./ha × Valor Unitario × Área Plantada). El servidor siempre recalcula el valor final.',
          createdToast: 'Equipo agregado con éxito',
          updatedToast: 'Equipo actualizado con éxito',
        },
      },
      function: {
        singularLabel: 'MO/Servicio',
        actions: {
          new: 'Nuevo Servicio',
          edit: 'Editar',
          delete: 'Eliminar',
        },
        deletedToast: 'Servicio eliminado con éxito',
        empty: {
          title: 'Aún no hay servicios registrados.',
          description: 'Agregue un servicio para comenzar.',
        },
        deleteConfirm: {
          header: 'Eliminar Servicio',
          body: '¿Está seguro de que desea eliminar este servicio? Esta acción no se puede deshacer.',
        },
        employeeAssignedBadge: 'empleado vinculado',
        dialog: {
          title: {
            create: 'Nuevo Servicio',
            edit: 'Editar Servicio',
          },
          fields: {
            executor: 'Función/Ejecutor',
            employee: 'Empleado',
            measurement: 'Unidad',
            quantity: 'Cant./ha',
            amount: 'Valor Unitario (R$)',
            total: 'Valor Total (R$)',
          },
          placeholders: {
            executor: 'Seleccione la función',
            employee: 'Seleccione el empleado',
          },
          errors: {
            required: 'Campo obligatorio',
          },
          totalHelperText:
            'Calculado automáticamente (Cant./ha × Valor Unitario × Área Plantada). El servidor siempre recalcula el valor final.',
          employeeUnresolvedLabel: 'Empleado seleccionado',
          createdToast: 'Servicio agregado con éxito',
          updatedToast: 'Servicio actualizado con éxito',
        },
      },
    },
  },
};
