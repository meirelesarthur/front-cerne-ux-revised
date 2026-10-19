// src/constants/languages/languageEsEs/languageFuncionarioXEventos.ts
// Traducción ES-ES del módulo "Empleado X Eventos" (Administrativo / Gestión
// de Personal). Bloque `list`/`filter`/`importModal`/`reportButton`
// (TASK-FE-FXE-01) + `matrix` (TASK-FE-FXE-02).

import { ModuleEmployeeEvents } from '@/@types/language/module-employee-events';

export const languageFuncionarioXEventos: ModuleEmployeeEvents = {
  employeeEvent: {
    singularLabel: 'Vínculo Empleado x Evento',
    pluralLabel: 'Empleado x Eventos',
    addLinkButton: 'Agregar vínculo',
    addLinkModal: {
      title: 'Agregar vínculo',
      description: 'Seleccione el empleado para administrar sus vínculos de eventos.',
      employeeLabel: 'Empleado',
      employeePlaceholder: 'Buscar por nombre o documento',
      cancelButton: 'Cancelar',
      confirmButton: 'Continuar',
    },
    list: {
      pageTitle: 'Empleado x Eventos',
      pageSubtitle: 'Seleccione un empleado para administrar sus vínculos de eventos de nómina.',
      table: {
        name: 'Nombre',
        document: 'Documento',
        office: 'Cargo',
        actions: {
          manageLinks: 'Administrar vínculos',
        },
      },
      emptyState: {
        titleEmpty: 'Ningún empleado registrado.',
        descriptionEmpty: 'Registre empleados para administrar sus vínculos de eventos.',
        titleFiltered: 'Ningún empleado encontrado.',
        descriptionFiltered: 'Intente ajustar los filtros o borrar la búsqueda.',
      },
    },
    filter: {
      title: 'Filtrar empleados',
      search: 'Buscar',
      searchPlaceholder: 'Buscar por nombre o documento',
      startDate: 'Fecha de registro (desde)',
      endDate: 'Fecha de registro (hasta)',
      isEnabled: 'Estado',
      isEnabledAll: 'Todos',
      enabledOptions: {
        active: 'Activo',
        inactive: 'Inactivo',
      },
    },
    importModal: {
      menuButtonLabel: 'Importar planilla',
      title: 'Importar Empleado x Eventos',
      subtitle:
        'Descargue la plantilla, complétela y suba la planilla para sincronizar los vínculos.',
      downloadShortcut: 'Descargar plantilla',
      instructions:
        'La planilla tiene 5 columnas: Empleado, Evento, Valor, Método y Habilitado. Todas las columnas son obligatorias en cada fila.',
      warning: {
        title: 'Sincronización por empleado',
        description:
          'La importación sincroniza los vínculos de cada empleado presente en la planilla — los vínculos existentes no enviados para ese empleado se eliminan, los enviados se crean o actualizan (misma regla de la Matriz de Vínculos).',
      },
      fileUpload: {
        label: 'Planilla (.xlsx)',
        hint: 'Archivo .xlsx de hasta 10MB.',
        dropzoneTitle: 'Arrastre un archivo o haga clic para seleccionar',
        dropzoneDraggingTitle: 'Suelte el archivo aquí',
        changeLabel: 'Cambiar archivo',
        removeLabel: 'Eliminar archivo',
        errorTypeMessage: 'Tipo de archivo no aceptado. Envíe un archivo .xlsx.',
        errorSizeMessage: 'El archivo excede el tamaño máximo permitido (10MB).',
      },
      rowErrors: {
        title: 'Filas con error',
      },
      result: {
        employeesProcessedLabel: 'Empleados procesados',
        rowsProcessedLabel: 'Filas procesadas',
        createdLabel: 'Creados',
        updatedLabel: 'Actualizados',
        deletedLabel: 'Eliminados',
      },
      cancelButton: 'Cancelar',
      submitButton: 'Importar',
      closeButton: 'Cerrar',
      importSuccessToast: 'Vínculos importados con éxito',
      downloadTemplateError: 'No se pudo descargar la plantilla. Intente de nuevo.',
    },
    reportButton: {
      label: 'Informe PDF',
      exportError: {
        title: 'Empleado x Eventos',
        description: 'No se pudo generar el informe. Intente de nuevo.',
      },
    },
    matrix: {
      title: 'Vínculos de Eventos',
      createTitle: 'Nuevo vínculo',
      header: {
        employeeLabel: 'Empleado',
        employeeSelectPlaceholder: 'Buscar por nombre o documento',
        nifLabel: 'CPF/CNPJ',
        functionLabel: 'Función',
      },
      backButton: 'Volver',
      emptyState: {
        title: 'Ningún vínculo registrado.',
        description: 'Agregue un evento para comenzar a configurar los vínculos de este empleado.',
      },
      addEventButton: 'Agregar nuevo',
      addEventPlaceholder: 'Seleccione un evento',
      noEventsAvailable: 'No hay eventos activos registrados en esta finca.',
      removeRowButton: 'Eliminar',
      table: {
        event: 'Evento',
        condition: 'Condición',
        value: 'Valor',
        method: 'Método',
        enabled: 'Habilitado',
      },
      saveButton: 'Guardar',
      cancelButton: 'Cancelar',
      saveSuccessToast: 'Vínculos guardados con éxito',
      saveError: {
        title: 'Vínculos de Eventos',
        description: 'No se pudieron guardar los vínculos. Intente de nuevo.',
      },
      invalidParamsToast: {
        title: 'Parámetros inválidos',
        description:
          'El identificador del empleado es inválido para mostrar la Matriz de Vínculos.',
      },
    },
  },
};
