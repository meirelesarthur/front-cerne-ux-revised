// src/constants/languages/languageEsEs/languageSeparations.ts
// Traducción ES-ES del módulo de APARTACIÓN (Operacional > Pecuaria).
// Namespace `separations` — LIBRE (frontend-contract-apartacao.md §1).

import { ModuleSeparations } from '@/@types/language/module-separations';

export const languageSeparations: ModuleSeparations = {
  separation: {
    singularLabel: 'Apartación',
    pluralLabel: 'Apartaciones',
    list: {
      pageTitle: 'Apartación',
      pageSubtitle: 'Gestione las apartaciones de lotes de la finca.',
      deletedToast: 'Apartación eliminada con éxito.',
      table: {
        code: 'Código',
        date: 'Fecha',
        employeeName: 'Responsable',
        batchCount: 'Cant. Lotes',
        animalCount: 'Cant. Animales',
        processingStatus: {
          processed: 'Procesado',
          pending: 'Pendiente',
        },
      },
      actions: {
        view: 'Ver',
        edit: 'Editar',
        delete: 'Eliminar',
      },
      helpVideo: 'Video de ayuda',
      helpVideoComingSoon: 'Disponible próximamente',
      emptyState: {
        titleEmpty: 'Ninguna apartación registrada.',
        descriptionEmpty: 'Comience agregando la primera apartación.',
        titleFiltered: 'Ningún registro encontrado.',
        descriptionFiltered: 'Intente ajustar los filtros.',
      },
      error: {
        message: 'No fue posible cargar los datos.',
        retry: 'Intentar de nuevo',
      },
    },
    filter: {
      title: 'Filtrar apartaciones',
      batch: 'Lote',
    },
    deleteDialog: {
      title: 'Confirmar eliminación',
      descriptionTemplate:
        'La apartación {code} será eliminada permanentemente. Esta acción no se puede deshacer.',
    },
    detail: {
      pageTitleTemplate: 'Apartación {code}',
      notFound: {
        title: 'Apartación no encontrada.',
        description: 'La apartación solicitada no existe o fue eliminada.',
        back: 'Volver a la lista',
      },
      sections: {
        header: 'Encabezado',
        batches: 'Lotes',
      },
      fields: {
        code: 'Código',
        date: 'Fecha',
        employeeName: 'Responsable',
      },
      batchesTable: {
        description: 'Lote',
        empty: 'Ningún lote vinculado.',
      },
      backButton: 'Volver',
    },
    form: {
      title: {
        create: 'Nueva Apartación',
        edit: 'Editar Apartación',
      },
      fields: {
        code: 'Código',
        date: 'Fecha',
        batches: 'Lotes',
      },
      placeholders: {
        batches: 'Seleccione los lotes',
      },
      hints: {
        codeGeneratedOnSave: 'Generado al guardar',
      },
      validation: {
        dateRequired: 'La fecha es obligatoria.',
        batchesRequired: 'Seleccione al menos un lote.',
        batchesMin: 'Seleccione al menos un lote.',
      },
      batchDateWarning: {
        title: 'Aviso de consistencia de fecha',
        itemTemplate: '{description} (fecha {date})',
        description: 'Los siguientes lotes tienen una fecha divergente de la apartación: {list}',
      },
    },
  },
};
