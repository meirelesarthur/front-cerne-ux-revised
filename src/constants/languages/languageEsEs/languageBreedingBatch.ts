// src/constants/languages/languageEsEs/languageBreedingBatch.ts
// Traducción ES-ES del módulo "Lotes de Reproducción" (BreedingBatch —
// Operacional / Reproducción, 97-Esteiras/048, Tareas 04/05/06/07).

import { ModuleBreedingBatch } from '@/@types/language/module-breeding-batch';

export const languageBreedingBatch: ModuleBreedingBatch = {
  breedingBatch: {
    singularLabel: 'Lote de Reproducción',
    pluralLabel: 'Lotes de Reproducción',
    titleModule: 'Lotes de Reproducción',
    list: {
      pageTitle: 'Lotes de Reproducción',
      pageSubtitle: 'Administre los lotes de reproducción registrados.',
      deletedToast: 'Lote de reproducción eliminado con éxito',
      newButton: 'Nuevo Lote',
      table: {
        code: 'Código',
        date: 'Fecha',
        responsible: 'Responsable',
        description: 'Descripción',
        actions: 'Acciones',
      },
      actions: {
        view: 'Ver',
        edit: 'Editar',
        delete: 'Eliminar',
      },
      emptyState: {
        titleEmpty: 'Ningún lote de reproducción registrado.',
        descriptionEmpty: 'Comience registrando un nuevo lote de reproducción.',
        titleFiltered: 'Ningún registro encontrado.',
        descriptionFiltered: 'Intente ajustar los filtros.',
        cta: 'Nuevo Lote',
      },
      filter: {
        title: 'Filtrar Lotes de Reproducción',
        startDate: 'Fecha Inicial',
        endDate: 'Fecha Final',
      },
      deleteDialog: {
        title: '¿Eliminar lote de reproducción?',
        description: 'será eliminado permanentemente.',
        warning: 'Esta acción no se puede deshacer.',
      },
    },
    detail: {
      title: 'Lote de Reproducción',
      backButton: 'Volver',
      editButton: 'Editar',
      sections: {
        generalData: 'Datos Generales',
        linkedBatches: 'Lotes Vinculados',
      },
      fields: {
        code: 'Código',
        date: 'Fecha',
        description: 'Descripción',
        responsible: 'Responsable',
        breedingSeason: 'Estación de Monta',
        createdAt: 'Creado el',
        updatedAt: 'Actualizado el',
      },
      notFound: {
        title: 'Lote de reproducción no encontrado.',
        description: 'El registro pudo haber sido eliminado o el enlace es incorrecto.',
      },
      invalidParamsToast: {
        title: 'Lote de Reproducción',
        description: 'Parámetros inválidos para mostrar el detalle.',
      },
      linkedBatchesTable: {
        code: 'Código',
        description: 'Descripción',
      },
      linkedBatchesEmpty: 'Ningún lote vinculado.',
    },
    form: {
      title: {
        create: 'Nuevo Lote de Reproducción',
        edit: 'Editar Lote de Reproducción',
      },
      fields: {
        code: 'Código',
        responsible: 'Responsable',
        date: 'Fecha',
        description: 'Descripción',
        breedingSeason: 'Estación de Monta',
        batches: 'Lotes',
        addBatchButton: 'Agregar Lote',
        removeBatchButton: 'Eliminar',
      },
      validation: {
        dateRequired: 'Ingrese la fecha',
        descriptionRequired: 'Ingrese la descripción',
        breedingSeasonRequired: 'Ingrese la estación de monta',
        batchesMinRequired: 'Agregue al menos un lote',
        batchRequired: 'Seleccione un lote',
        batchDuplicate: 'Este lote ya fue seleccionado en otra línea',
        batchInvalidDate:
          'La fecha de creación del lote es más reciente que la fecha del lote de reproducción',
      },
      unsavedChangesDialog: {
        title: '¿Salir sin guardar?',
        description: 'Existen cambios no guardados en este formulario que se perderán',
        confirmButton: 'Salir sin guardar',
      },
    },
  },
};
