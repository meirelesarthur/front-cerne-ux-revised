// src/constants/languages/languageEsEs/languageAnimals.ts
// Traducción ES-ES del módulo "Rebaño" (Animal — Registros Base / Pecuaria,
// ejecución 027). TASK-FE-880 (infra) + TASK-FE-881 (listado/filtro).

import { ModuleAnimals } from '@/@types/language/module-animals';

export const languageAnimals: ModuleAnimals = {
  animal: {
    singularLabel: 'Animal',
    pluralLabel: 'Rebaño',

    typeOptions: {
      single: 'Individual',
      noId: 'Sin Identificación',
    },

    reproductiveStatusOptions: {
      pregnant: 'Preñada',
      empty: 'Vacía',
      calved: 'Parida',
    },

    statusOptions: {
      active: 'Activo',
      pending: 'Pendiente',
      death: 'Muerto',
      loss: 'Perdido',
      sale: 'Vendido',
      deleted: 'Eliminado',
    },

    originOptions: {
      birth: 'Nacimiento',
      processing: 'Procesamiento',
      registration: 'Registro',
    },

    depreciationTypeOptions: {
      withResidual: 'Con Valor Residual',
      withoutResidual: 'Sin Valor Residual',
    },

    list: {
      pageTitle: 'Rebaño',
      pageSubtitle: 'Administre los animales del rebaño de la finca activa.',
      deletedToast: 'Animal eliminado con éxito',
      table: {
        type: 'Tipo',
        identificationType: 'Tipo de Identificación',
        identificationTypeEmpty: '—',
        identification: 'Identificación',
        identificationEmpty: 'Sin ID',
        category: 'Categoría',
        batch: 'Lote',
        batchEmpty: 'Sin lote',
        batchMore: '+{count}',
        weight: 'Peso Actual (Kg)',
        status: 'Estado',
        reproductiveStatus: 'Estado Reproductivo',
        reproductiveStatusEmpty: 'N/D',
      },
      actions: {
        edit: 'Editar',
        delete: 'Eliminar',
      },
      emptyState: {
        titleEmpty: 'Ningún animal registrado.',
        descriptionEmpty: 'Comience agregando el primer animal del rebaño.',
        titleEmptyNoCreate: 'Ningún animal disponible.',
        descriptionEmptyNoCreate:
          'Todavía no hay animales registrados. Contacte al administrador de la finca.',
        titleFiltered: 'Ningún animal encontrado.',
        descriptionFiltered: 'Intente ajustar los filtros o limpiar la búsqueda.',
        cta: 'Nuevo Animal',
      },
      deleteConfirm: {
        title: 'Eliminar animal',
        description: '¿Está seguro que desea eliminar el animal',
        warning:
          'Esta acción es definitiva y no se puede deshacer. Si hay vínculos dependientes, la eliminación puede ser bloqueada por el sistema.',
      },
      error: {
        message: 'No fue posible cargar el rebaño.',
        retry: 'Intentar de nuevo',
      },

      bulkBar: {
        ariaLabel: 'Acciones masivas',
        clearSelection: 'Limpiar selección',
        selectedOne: '{count} animal seleccionado',
        selectedMany: '{count} animales seleccionados',
        reproductiveStatus: 'Estado Reproductivo',
        batchTransfer: 'Transferir de Lote',
        deleteMany: {
          action: 'Eliminar Animales',
          confirmWord: 'BORRAR',
        },
      },
    },

    managementScreen: {
      pageTitle: 'Gestión de Animales',
      pageSubtitle:
        'Gestione el rebaño y las acciones en lote (transferencia, estado reproductivo, eliminación) desde una pantalla dedicada.',
    },

    filter: {
      title: 'Filtrar rebaño',
      search: 'Buscar Id Animal',
      searchPlaceholder: 'Buscar Id Animal',
      category: 'Categoría',
      categoryAll: 'Todas',
      batch: 'Lote',
      batchAll: 'Todos',
      status: 'Estado',
      statusAll: 'Todos',
      origin: 'Origen',
      originAll: 'Todas',
      reproductiveStatus: 'Estado Reproductivo',
      reproductiveStatusAll: 'Todos',
    },

    dialogs: {
      reproductiveStatus: {
        title: 'Estado Reproductivo en masa',
        countTemplate: 'Aplicar a {count} animales seleccionados.',
        pregnancyDate: 'Fecha de Preñez',
        birthForecast: 'Previsión de Parto',
        submitButton: 'Aplicar',
        successMessage: '{count} animal(es) actualizado(s) con éxito.',
      },
      deleteMany: {
        title: 'Eliminar animales',
        countTemplate: 'Está a punto de eliminar {count} animales.',
        warning:
          'Los animales serán eliminados. Los animales con vínculos activos (lanzamientos, nacimientos, pesajes, etc.) no pueden eliminarse y toda la operación se cancela.',
        confirmLabel: 'Escriba {word} para confirmar',
        submitButton: 'Eliminar',
        successMessage: '{count} animal(es) eliminado(s) con éxito.',
        blockedTitle:
          'Los animales siguientes tienen vínculos activos e impidieron la eliminación:',
        blockedMore: 'y {count} animal(es) más.',
        blockedTruncated: 'El servidor limitó la lista; pueden existir otros animales bloqueados.',
        blockedDeselect: 'Desmarcar bloqueados',
      },
      batchTransfer: {
        title: 'Transferir de Lote',
        countTemplate: '{count} animales seleccionados.',
        sameBatchMode: 'Mismo lote para todos',
        perAnimalMode: 'Lote diferente por animal',
        batchLabel: 'Lote de destino',
        batchPlaceholder: 'Seleccione el lote',
        animalColumnLabel: 'Animal',
        submitButton: 'Transferir',
        successMessage: '{count} animal(es) transferido(s) con éxito.',
      },
    },

    excel: {
      downloadTemplate: 'Descargar modelo',
      downloadTemplateError: 'No fue posible descargar el modelo.',
      export: 'Exportar',
      exportError: 'No fue posible exportar el rebaño.',
      import: {
        menuLabel: 'Importar',
        title: 'Importar Rebaño',
        subtitle: 'Importe animales en lote desde una planilla .xlsx.',
        instructions:
          'Descargue el modelo, complete los datos del rebaño y envíe el archivo completado abajo.',
        downloadShortcut: 'Descargar modelo',
        warning: {
          title: 'Atención antes de importar',
          description:
            'Si alguna fila de la planilla es inválida, ningún animal será importado — corrija los errores indicados y envíe nuevamente.',
        },
        fileUpload: {
          label: 'Archivo de la planilla',
          hint: 'Formato .xlsx, hasta 10MB.',
          dropzoneTitle: 'Arrastre la planilla o haga clic para seleccionar',
          dropzoneDraggingTitle: 'Suelte la planilla aquí',
          changeLabel: 'Cambiar archivo',
          removeLabel: 'Eliminar archivo',
          errorTypeMessage: 'Tipo de archivo no aceptado. Envíe un archivo .xlsx.',
          errorSizeMessage: 'El archivo excede el tamaño máximo permitido (10MB).',
        },
        rowErrors: {
          title: 'No fue posible importar la planilla',
        },
        result: {
          created: 'Animales importados',
          childrenCreated: 'Terneros creados',
        },
        importSuccessToast: 'Rebaño importado con éxito.',
        cancelButton: 'Cancelar',
        submitButton: 'Importar',
        closeButton: 'Cerrar',
      },
    },

    form: {
      title: {
        create: 'Nuevo Animal',
        edit: 'Editar Animal',
      },
      subtitle: {
        create: 'Registre un nuevo animal del rebaño de la finca activa.',
        edit: 'Modifique los datos del animal seleccionado.',
      },

      fields: {
        photo: 'Foto',
        type: 'Tipo',
        quantity: 'Cantidad',
        specie: 'Especie',
        category: 'Categoría',
        breed: 'Raza',
        entryDate: 'Fecha de Entrada',
        birthDate: 'Fecha de Nacimiento',
        identificationType: 'Tipo de Identificación',
        identification: 'Identificación',
        weight: 'Peso (Kg)',
        priceKiloAlive: 'Precio Kg Vivo',
        furDescription: 'Descripción Pelaje',
        note: 'Observación',
        startWeight: 'Peso de Entrada',
        valueUnitary: 'Valor Unitario',
        unityAnimalUa: 'UA (Unidad Animal)',
        priceArrobaAlive: 'Precio @ Vivo',

        motherAnimal: 'Madre',
        fatherAnimal: 'Padre',

        categoryMatrice: 'Estadio Reproductivo',
        reproductiveStatus: 'Estado Reproductivo',
        birthForecast: 'Previsión de Parto',

        childCategory: 'Categoría del Ternero',
        childBirthDate: 'Fecha de Nacimiento del Ternero',
        childWeight: 'Peso del Ternero',
        childIdentificationType: 'Tipo de Identificación del Ternero',
        childIdentification: 'Identificación del Ternero',

        depreciationType: 'Tipo de Depreciación',
        vlAcquisition: 'Valor de Adquisición',
        residual: 'Residual (%)',
        depreciation: 'Depreciación (%)',
        lifeBens: 'Vida Útil (años)',
        vlResidual: 'Valor Residual',
        vlDepreciate: 'Valor a Depreciar',
        vlDepreciated: 'Vl. Depreciado',
        sdDepreciate: 'Sd. a Depreciar',
      },

      placeholders: {
        type: 'Seleccione el tipo',
        specie: 'Seleccione la especie',
        category: 'Seleccione la categoría',
        breed: 'Seleccione la raza',
        identificationType: 'Seleccione el tipo',
        identification: 'Ingrese la identificación',
        motherAnimal: 'Ingrese la identificación de la madre',
        fatherAnimal: 'Ingrese la identificación del padre',
        categoryMatrice: 'Seleccione el estadio reproductivo',
        reproductiveStatus: 'Seleccione el estado reproductivo',
        childCategory: 'Seleccione la categoría del ternero',
        childIdentificationType: 'Seleccione el tipo',
        depreciationType: 'Seleccione el tipo',
      },

      hints: {
        specieRequired: 'Seleccione la especie para habilitar Categoría y Raza.',
        quantityBatch: 'Se crearán {quantity} animales idénticos, todos "Sin Identificación".',
        calculatedEmpty: '—',
      },

      identifications: {
        sectionTitle: 'Identificación',
        sectionHint: 'Agregue al menos un tipo/identificación para el animal individual.',
        emptyTitle: 'Ninguna identificación agregada.',
        addRowLabel: 'Agregar identificación',
        removeRowLabel: 'Eliminar identificación',
        noIdHint:
          'Animal "Sin Identificación" — el sistema asigna automáticamente "Sin ID" a cada registro creado.',
        duplicateWarningTitle: 'Identificación ya registrada',
        duplicateWarningDescription:
          'La identificación "{{identification}}" ya está en uso por otro animal activo de esta finca. Aún puede guardar normalmente.',
      },

      image: {
        dropzoneTitle: 'Arrastre una imagen o haga clic para seleccionar',
        dropzoneDragging: 'Suelte la imagen aquí',
        changeLabel: 'Cambiar foto',
        removeLabel: 'Eliminar foto',
        errorType: 'Tipo de archivo no aceptado.',
        errorSize: 'El archivo excede el tamaño máximo permitido.',
      },

      sections: {
        genealogy: 'Genealogía',
        reproductiveStatus: 'Estadio/Estado Reproductivo',
        child: {
          title: 'Ternero',
          hint: 'Complete todos los campos para registrar el ternero junto con la madre.',
          createOnlyHint:
            'Disponible solamente en la creación del animal — el ternero se registra como un nuevo animal vinculado a la madre.',
        },
        depreciation: 'Depreciación',
      },
    },
  },
};
