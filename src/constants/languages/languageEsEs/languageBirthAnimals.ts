// src/constants/languages/languageEsEs/languageBirthAnimals.ts
// Traducción ES-ES del módulo de Nacimientos (Operacional > Pecuaria).
// Namespace `birthAnimals` — libre (frontend-contract-nascimentos.md §1).

import { ModuleBirthAnimals } from '@/@types/language/module-birth-animals';

export const languageBirthAnimals: ModuleBirthAnimals = {
  birthAnimal: {
    singularLabel: 'Nacimiento',
    pluralLabel: 'Nacimientos',
    list: {
      pageTitle: 'Nacimientos',
      pageSubtitle: 'Gestione los nacimientos (terneros) de la finca.',
      deletedToast: 'Nacimiento eliminado con éxito.',
      table: {
        code: 'Código',
        mother: 'Madre',
        fatherText: 'ID Padre/Semen',
        newborn: 'Ternero',
        breed: 'Raza',
        weight: 'Peso',
        date: 'Fecha',
      },
      actions: {
        view: 'Visualizar',
        edit: 'Editar',
        delete: 'Eliminar',
        editDisabledTooltip:
          'Este nacimiento ya tiene un destete vinculado y no puede ser editado.',
        deleteDisabledTooltip:
          'Este nacimiento ya tiene un destete vinculado y no puede ser eliminado.',
      },
      emptyState: {
        titleEmpty: 'Ningún nacimiento registrado.',
        descriptionEmpty: 'Comience agregando el primer nacimiento.',
        titleFiltered: 'Ningún registro encontrado.',
        descriptionFiltered: 'Intente ajustar los filtros.',
      },
      error: {
        message: 'No fue posible cargar los datos.',
        retry: 'Intentar de nuevo',
      },
    },
    filter: {
      title: 'Filtrar nacimientos',
      identification: 'Identificación (madre o ternero)',
      breed: 'Raza',
      startDate: 'Fecha Inicio',
      endDate: 'Fecha Fin',
    },
    deleteDialog: {
      title: 'Confirmar eliminación',
      descriptionTemplate:
        'El nacimiento {code} será eliminado permanentemente. Esta acción no puede deshacerse.',
    },
    banners: {
      weaningLocked:
        'Este nacimiento ya tiene un destete vinculado — edición y eliminación no disponibles en esta pantalla.',
    },
    detail: {
      pageTitleTemplate: 'Nacimiento {code}',
      notFound: {
        title: 'Nacimiento no encontrado.',
        description: 'El nacimiento solicitado no existe o fue eliminado.',
        back: 'Volver al listado',
      },
      sections: {
        header: 'Encabezado',
        identifications: 'Identificaciones',
      },
      fields: {
        code: 'Código',
        date: 'Fecha',
        mother: 'Madre',
        fatherText: 'ID Padre/Semen',
        fatherAnimal: 'Padre (resuelto)',
        newborn: 'Ternero',
        breed: 'Raza',
        category: 'Categoría',
        specie: 'Especie',
        birthNote: 'Observación de Nacimiento',
        batch: 'Lote',
        transferBatch: 'Lote (transferencia)',
        weight: 'Peso',
        furDescription: 'Pelaje',
        note: 'Observación',
        photo: 'Foto',
      },
      identificationsTable: {
        type: 'Tipo de Identificación',
        identification: 'Identificación',
        empty: 'Ninguna identificación registrada.',
      },
      backButton: 'Volver',
    },
    form: {
      title: {
        create: 'Nuevo Nacimiento',
        edit: 'Editar Nacimiento',
      },
      fields: {
        code: 'Código',
        date: 'Fecha',
        specie: 'Especie',
        category: 'Categoría',
        breed: 'Raza',
        birthNote: 'Observación de Nacimiento',
        weight: 'Peso',
        mother: 'Madre',
        fatherText: 'Padre/Semen',
        batch: 'Lote (filtro Madre)',
        transferBatch: 'Lote (transferencia)',
        furDescription: 'Pelaje',
        note: 'Observación',
        photo: 'Foto',
      },
      placeholders: {
        specie: 'Seleccione la especie',
        category: 'Seleccione la categoría',
        breed: 'Seleccione la raza',
        birthNote: 'Seleccione la observación de nacimiento',
        mother: 'Busque la madre por identificación',
        fatherText: 'Ingrese la identificación del padre o semen',
        batch: 'Seleccione el lote',
        transferBatch: 'Seleccione el lote de transferencia',
      },
      hints: {
        codeGeneratedOnSave: 'Generado al guardar',
        specieRequired: 'Seleccione la especie primero',
      },
      image: {
        dropzoneTitle: 'Arrastre una foto o haga clic para seleccionar',
        dropzoneDragging: 'Suelte la foto aquí',
        changeLabel: 'Cambiar foto',
        removeLabel: 'Eliminar',
        errorType: 'Formato de archivo no soportado.',
        errorSize: 'Archivo mayor que el límite permitido.',
      },
      identifications: {
        sectionTitle: 'Identificaciones del ternero',
        sectionHint: 'Agregue al menos una identificación para el ternero.',
        emptyTitle: 'Ninguna identificación agregada.',
        addRowLabel: 'Agregar identificación',
        removeRowLabel: 'Eliminar identificación',
        typeLabel: 'Tipo de Identificación',
        typePlaceholder: 'Seleccione el tipo',
        valueLabel: 'Identificación',
        valuePlaceholder: 'Ingrese la identificación',
        duplicateWarningTitle: 'Identificación ya registrada',
        duplicateWarningDescription:
          'La identificación "{{identification}}" ya está en uso por otro registro.',
      },
      batchDateWarning: {
        title: 'Aviso de consistencia de fecha',
      },
    },
    excel: {
      headerButtonLabel: 'Importar/Exportar',
      downloadTemplate: 'Descargar modelo',
      downloadTemplateError: 'No fue posible descargar el modelo.',
      import: {
        title: 'Importar Nacimientos',
        subtitle: 'Importe nacimientos en lote a partir de una planilla .xlsx.',
        instructions:
          'Descargue el modelo, complete los datos de los nacimientos y envíe el archivo completado abajo.',
        downloadShortcut: 'Descargar modelo',
        warning: {
          title: 'Atención antes de importar',
          description:
            'Si alguna línea de la planilla es inválida, ningún nacimiento será importado — corrija los errores indicados y envíe nuevamente.',
        },
        fileUpload: {
          label: 'Archivo de la planilla',
          hint: 'Formato .xlsx, hasta 10MB.',
          dropzoneTitle: 'Arrastre la planilla o haga clic para seleccionar',
          dropzoneDraggingTitle: 'Suelte la planilla aquí',
          changeLabel: 'Cambiar archivo',
          removeLabel: 'Eliminar archivo',
          errorTypeMessage: 'Formato de archivo no aceptado. Envíe un archivo .xlsx.',
          errorSizeMessage: 'El archivo excede el tamaño máximo permitido (10MB).',
        },
        rowErrors: {
          title: 'No fue posible importar la planilla',
        },
        result: {
          created: 'Nacimientos importados',
        },
        importSuccessToast: 'Nacimientos importados con éxito.',
        noPermission: 'No tiene permiso para importar nacimientos.',
        cancelButton: 'Cancelar',
        submitButton: 'Importar',
        closeButton: 'Cerrar',
      },
    },
  },
};
