// src/constants/languages/languageEsEs/languageLossAnimal.ts
// Traducción ES-ES del módulo de PÉRDIDAS (Operacional / Pecuaria).

import { ModuleLossAnimals } from '@/@types/language/module-loss-animals';

export const languageLossAnimal: ModuleLossAnimals = {
  lossAnimal: {
    singularLabel: 'Pérdida',
    pluralLabel: 'Pérdidas',
    titleModule: 'Pérdidas',
    detailTitle: 'Detalles de la Pérdida',
    list: {
      pageTitle: 'Pérdidas',
      pageSubtitle: 'Gestione los registros de pérdida de animales de la granja activa.',
      deletedToast: 'Pérdida eliminada con éxito',
      table: {
        code: 'Código',
        animal: 'Animal',
        category: 'Categoría',
        cause: 'Causa',
        date: 'Fecha',
      },
      actions: {
        view: 'Ver',
        edit: 'Editar',
        delete: 'Eliminar',
      },
      emptyState: {
        titleEmpty: 'Ninguna información registrada.',
        descriptionEmpty: 'Comience registrando su primera pérdida.',
        titleEmptyNoCreate: 'Ninguna pérdida disponible.',
        descriptionEmptyNoCreate:
          'Aún no hay pérdidas registradas. Contacte al administrador de la plataforma.',
        cta: 'Nueva Pérdida',
      },
      deleteConfirm: {
        title: 'Eliminar pérdida',
        description: '¿Está seguro que desea eliminar este registro de pérdida',
        warning: 'Esta eliminación es definitiva y no se puede deshacer.',
      },
      deleteBusinessError:
        'Registro vinculado a otra tabla, solo podrá eliminarse si se retira el vínculo.',
    },
    filter: {
      title: 'Filtrar Pérdidas',
      animal: 'Animal',
      cause: 'Causa',
      startDate: 'Fecha inicio',
      endDate: 'Fecha fin',
    },
    form: {
      title: {
        create: 'Nueva Pérdida',
        edit: 'Editar Pérdida',
      },
      fields: {
        code: 'Código',
        codePlaceholder: 'Generado al guardar',
        date: 'Fecha',
        responsible: 'Responsable',
        batch: 'Lote',
        animal: 'Animal',
        cause: 'Causa',
        note: 'Observación',
      },
      placeholders: {
        batch: 'Seleccione el lote',
        animal: 'Busque por identificación',
        cause: 'Seleccione la causa',
        note: 'Observación opcional',
      },
      validation: {
        dateRequired: 'La fecha es obligatoria',
        animalRequired: 'Seleccione un animal',
        causeRequired: 'Seleccione una causa',
        checkDate: {
          animalEntryAfterLossDate:
            'La fecha de entrada del animal es posterior a la fecha de la pérdida.',
          batchCreationAfterMovementDate:
            'La fecha de creación del lote/área es posterior a la fecha del movimiento.',
        },
      },
    },
  },
};
