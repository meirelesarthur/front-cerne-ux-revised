// src/constants/languages/languageEsEs/languageRainfalls.ts
// Traducción ES-ES del módulo OPERACIONAL — Pluviometría (Rainfall) —
// ejecución 041, TASK-FE-041-PLV-01..05. Mirror `languageDeathAnimals`, con
// los campos propios de esta feature.

import { ModuleRainfalls } from '@/@types/language/module-rainfalls';

export const languageRainfalls: ModuleRainfalls = {
  rainfall: {
    singularLabel: 'Pluviometría',
    pluralLabel: 'Pluviometrías',
    list: {
      pageTitle: 'Pluviometría',
      pageSubtitle: 'Registro de pluviometría por área.',
      deletedToast: 'Registro de pluviometría eliminado con éxito',
      table: {
        date: 'Fecha',
        user: 'Responsable',
        areas: 'Áreas',
        areasEmpty: 'Sin áreas',
        amount: 'mm de Lluvia',
        actions: 'Acciones',
      },
      actions: {
        view: 'Ver',
        edit: 'Editar',
        delete: 'Eliminar',
        import: 'Importar',
        new: 'Nuevo',
      },
      emptyState: {
        titleEmpty: 'Ninguna pluviometría registrada.',
        descriptionEmpty: 'Comience registrando el primer índice pluviométrico.',
        titleEmptyNoCreate: 'Ninguna pluviometría registrada.',
        descriptionEmptyNoCreate: 'No tiene permiso para registrar una nueva pluviometría.',
        titleFiltered: 'Ninguna pluviometría encontrada.',
        descriptionFiltered: 'Intente ajustar los filtros o borrar la búsqueda.',
        cta: 'Nuevo registro',
      },
    },
    filter: {
      title: 'Filtrar pluviometría',
      startDate: 'Fecha inicial',
      endDate: 'Fecha final',
    },
    detail: {
      generalData: { title: 'Datos Generales' },
      fields: {
        date: 'Fecha',
        user: 'Responsable',
        amount: 'mm de Lluvia',
        areas: 'Áreas',
        areasEmpty: 'Sin áreas',
      },
      actions: { edit: 'Editar', back: 'Volver' },
      notFound: {
        title: 'Pluviometría no encontrada.',
        description: 'Verifique el enlace o vuelva al listado.',
        back: 'Volver al listado',
      },
    },
    form: {
      title: { create: 'Nueva Pluviometría', edit: 'Editar Pluviometría' },
      fields: {
        date: 'Fecha',
        amount: 'mm de Lluvia',
        areas: 'Áreas',
        user: 'Responsable',
      },
      areasPicker: {
        searchPlaceholder: 'Buscar área',
        selectedCountLabel: 'Áreas seleccionadas',
        selectAllLabel: 'Marcar todas',
        deselectAllLabel: 'Desmarcar todas',
        emptyLabel: 'Ningún área encontrada.',
        errorLabel: 'Error al cargar las áreas.',
        retryLabel: 'Intentar de nuevo',
      },
      validation: {
        dateRequired: 'La fecha es obligatoria.',
        amountRequired: 'El índice de mm de lluvia es obligatorio.',
        amountRange: 'Informe un valor entre 0 y 9999,9.',
        areasRequired: 'Seleccione al menos un área.',
      },
    },
    import: {
      title: 'Importar pluviometría',
      subtitle: 'Descargue el modelo, complételo y envíe la planilla completada.',
      downloadShortcut: 'Descargar modelo',
      instructions:
        'Complete la planilla siguiendo el modelo, sin alterar la estructura de las pestañas.',
      warning: {
        title: 'Atención',
        description:
          'Si alguna línea o área de la planilla es inválida, ningún registro se importa (importación todo o nada).',
      },
      fileUpload: {
        label: 'Archivo',
        hint: 'Formatos aceptados: XLS, XLSX. Tamaño máximo: 10MB.',
        dropzoneTitle: 'Arrastre la planilla o haga clic para seleccionar',
        dropzoneDraggingTitle: 'Suelte la planilla aquí',
        changeLabel: 'Cambiar archivo',
        removeLabel: 'Eliminar archivo',
        errorTypeMessage: 'Tipo de archivo no aceptado.',
        errorSizeMessage: 'El archivo excede el tamaño máximo.',
      },
      rowErrors: { title: 'Errores en la planilla', rowPrefix: 'Línea {row}:' },
      result: { created: 'Registros importados' },
      cancelButton: 'Cancelar',
      submitButton: 'Importar',
      closeButton: 'Cerrar',
      importSuccessToast: 'Importación de pluviometría concluida con éxito.',
      downloadTemplateError: 'No fue posible descargar el modelo.',
    },
  },
};
