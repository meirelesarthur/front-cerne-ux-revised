// src/constants/languages/languageEsEs/languageBatch.ts
// Traducción ES-ES del módulo de LOTES ANIMALES (Cadastros Base / Pecuaria).
// Fundación de la regeneración de las pantallas (TASK-FE-1074) — mirror
// `languageCausaMortePerda` + `statusOptions` (enum BatchStatus A/P/I/R,
// consumido por TASK-FE-1075) + `archiveConfirm` (M5) + `importExport` (D1,
// contrato v1.1 §8).

import { ModuleBatches } from '@/@types/language/module-batches';

export const languageBatch: ModuleBatches = {
  batch: {
    singularLabel: 'Lote Animal',
    pluralLabel: 'Lotes Animales',
    list: {
      pageTitle: 'Lotes Animales',
      pageSubtitle: 'Administre los lotes de manejo del rebaño.',
      deletedToast: 'Lote animal eliminado con éxito',
      table: {
        code: 'Código',
        description: 'Descripción',
        date: 'Fecha',
        specie: 'Especie',
        categories: 'Categorías',
        status: 'Estado',
        totalAnimals: 'Total de Animales',
      },
      actions: {
        edit: 'Editar lote animal',
        delete: 'Eliminar lote animal',
        archive: 'Archivar lote animal',
      },
      emptyState: {
        titleEmpty: 'Ningún lote animal registrado.',
        titleFiltered: 'Ningún resultado encontrado.',
        titleEmptyNoCreate: 'Ningún lote animal disponible.',
        descriptionEmpty: 'Comience agregando el primer lote animal.',
        descriptionFiltered: 'Intente ajustar o quitar los filtros actuales.',
        descriptionEmptyNoCreate:
          'Aún no hay lotes animales registrados. Póngase en contacto con el administrador de la plataforma.',
        cta: 'Nuevo Lote Animal',
      },
      deleteConfirm: {
        title: 'Eliminar lote animal',
        description: '¿Está seguro de que desea eliminar el lote animal',
        warning: 'Esta eliminación es definitiva y no se puede deshacer.',
      },
    },
    statusOptions: {
      active: 'Activo',
      pending: 'Pendiente',
      inactive: 'Inactivo',
      archived: 'Archivado',
    },
    archiveConfirm: {
      title: 'Archivar lote animal',
      description: '¿Está seguro de que desea archivar el lote animal',
      warning: 'Un lote archivado sale del listado y no puede reactivarse desde la pantalla.',
      successToast: 'Lote animal archivado con éxito',
    },
    filter: {
      title: 'Filtrar Lotes Animales',
      description: 'Buscar por descripción',
    },
    form: {
      title: {
        create: 'Nuevo Lote Animal',
        edit: 'Editar Lote Animal',
      },
      subtitle: {
        create: 'Registre un nuevo lote de manejo del rebaño.',
        edit: 'Actualice los datos del lote animal.',
      },
      fields: {
        code: 'Código',
        description: 'Descripción',
        date: 'Fecha',
        specie: 'Especie',
        parameterWeight: 'Peso',
        categories: 'Categorías',
        animals: 'Animales',
        animalsCounter: '{count} animal(es) seleccionado(s)',
      },
      placeholders: {
        description: 'Ej.: Lote de recría — potrero 3',
        specie: 'Buscar por descripción',
        parameterWeight: 'Buscar por descripción',
        categories: 'Buscar por descripción',
        animals: 'Buscar por identificación',
      },
      validation: {
        descriptionRequired: 'La descripción es obligatoria',
        descriptionMaxLength: 'La descripción debe tener como máximo 100 caracteres',
        dateRequired: 'La fecha es obligatoria',
        specieRequired: 'Seleccione una especie',
        categoriesRequired: 'Seleccione al menos una categoría',
        categoriesMin: 'Seleccione al menos una categoría',
      },
      warnings: {
        categoriesClearedBySpecieChange:
          'Las categorías y los animales seleccionados fueron eliminados porque la especie fue cambiada.',
        animalsClearedByCategoryRemoval:
          'Los animales seleccionados de esta categoría fueron eliminados porque la categoría fue desmarcada.',
        animalsClearedByWeightChange:
          'Algunos animales seleccionados fueron eliminados porque ya no pertenecen al rango de peso elegido.',
      },
      candidateAnimals: {
        selectAllLabel: 'Marcar todos',
        deselectAllLabel: 'Desmarcar todos',
        totalAnimalsLabel: 'Total de Animales',
        emptyLabel: 'Ningún animal candidato encontrado para esta categoría.',
        errorLabel: 'Error al cargar los animales candidatos.',
        retryLabel: 'Intentar de nuevo',
        searchPlaceholder: 'Buscar por identificación',
      },
      footer: {
        totalAnimals: 'Total de Animales del Lote',
        totalWeight: 'Peso Total del Lote (Kg)',
        averageWeight: 'Peso Medio del Lote (Kg)',
        totalUa: 'Total de UA',
        averageUa: 'UA Media',
      },
    },
    importExport: {
      downloadTemplate: 'Descargar modelo',
      downloadTemplateError: 'No fue posible descargar el modelo',
      importSpreadsheet: 'Importar planilla',
      modalTitle: 'Importar Lote Animal',
      modalDescription:
        'Cada archivo importa exactamente 1 lote (encabezado + animales). Para importar varios lotes, repita el proceso con un archivo por lote.',
      instructions:
        'Complete la hoja "cabecalho" (Fecha, Especie, Descripción) y la hoja "animais" (Identificación) del modelo antes de enviar.',
      warning: {
        title: 'El lote puede crearse vacío',
        description:
          'Si alguna identificación de animal no se encuentra (inexistente, ya vinculada a otro lote, o de otra finca), el lote igual se crea — pero sin ningún animal vinculado. Verifique siempre el mensaje mostrado después de la importación.',
      },
      fileUpload: {
        label: 'Archivo (.xlsx)',
        hint: 'Solo archivos .xlsx, hasta 10 MB.',
        dropzoneTitle: 'Arrastre un archivo o haga clic para seleccionar',
        dropzoneDraggingTitle: 'Suelte el archivo aquí',
        changeLabel: 'Cambiar archivo',
        removeLabel: 'Quitar archivo',
        errorTypeMessage: 'Formato no aceptado. Envíe un archivo .xlsx.',
        errorSizeMessage: 'El archivo supera el tamaño máximo de 10 MB.',
      },
      result: {
        successTitle: 'Lote importado con éxito',
        partialTitle: 'Lote creado sin animales vinculados',
        codeLabel: 'Código del lote',
        totalAnimalsLabel: 'Animales vinculados',
      },
      successToast: 'Lote animal importado con éxito',
      errorToast: 'No fue posible importar el lote animal',
      cancelButton: 'Cancelar',
      submitButton: 'Importar',
      closeButton: 'Cerrar',
    },
    // Informe "Rendimiento Animal Individual" (F-234, TASK-FE-PA-01,
    // `GET /batch-profitability-report`) — mirror `report` de Vacas Prenhas.
    report: {
      pageTitle: 'Rendimiento Animal',
      pageSubtitle: 'Genere el informe de rendimiento individual del animal en PDF o Excel.',
      filters: {
        sale: 'Venta',
        batch: 'Lote',
        startDate: 'Fecha Inicial',
        endDate: 'Fecha Final',
      },
      fields: {
        reportType: 'Tipo de Informe',
      },
      reportTypeOptions: {
        pdf: 'PDF',
        excel: 'Excel',
      },
      submitButton: 'Generar Informe',
      successToast: 'Informe generado con éxito.',
      errorToast: 'No fue posible generar el informe.',
      hint: {
        saleOrPeriodRequired:
          'Seleccione una Venta o complete el período (Fecha Inicial y Fecha Final) para generar el informe.',
      },
    },
  },
};
