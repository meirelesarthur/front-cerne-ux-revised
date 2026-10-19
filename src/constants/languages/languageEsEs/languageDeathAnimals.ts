// src/constants/languages/languageEsEs/languageDeathAnimals.ts
// Traducción ES-ES del módulo OPERACIONAL — Muertes (DeathAnimal) —
// TASK-DA-FE-01/02. Mirror `languageFeedlotSectors`, con los campos propios
// de esta feature.

import { ModuleDeathAnimals } from '@/@types/language/module-death-animals';

export const languageDeathAnimals: ModuleDeathAnimals = {
  deathAnimal: {
    singularLabel: 'Muerte',
    pluralLabel: 'Muertes',
    list: {
      pageTitle: 'Muertes',
      pageSubtitle: 'Registro de muertes de animales del rebaño.',
      deletedToast: 'Muerte eliminada con éxito',
      table: {
        code: 'Código',
        animal: 'Animal',
        animalEmpty: 'Sin animal',
        cause: 'Causa',
        date: 'Fecha',
      },
      actions: {
        view: 'Ver',
        edit: 'Editar',
        delete: 'Eliminar',
      },
      emptyState: {
        titleEmpty: 'Ninguna muerte registrada.',
        descriptionEmpty: 'Comience registrando la primera muerte.',
        titleEmptyNoCreate: 'Ninguna muerte registrada.',
        descriptionEmptyNoCreate: 'No tiene permiso para registrar una nueva muerte.',
        titleFiltered: 'Ninguna muerte encontrada.',
        descriptionFiltered: 'Intente ajustar los filtros o borrar la búsqueda.',
        cta: 'Nueva Muerte',
      },
    },
    filter: {
      title: 'Filtrar muertes',
      animalIdentification: 'Identificación del Animal',
      animalIdentificationPlaceholder: 'Buscar por identificación',
      cause: 'Causa',
      causePlaceholder: 'Seleccione la causa',
      startDate: 'Fecha inicial',
      endDate: 'Fecha final',
    },
    detail: {
      generalData: { title: 'Datos Generales' },
      fields: {
        code: 'Código',
        date: 'Fecha',
        userName: 'Empleado Responsable',
        batch: 'Lote',
        batchEmpty: 'Sin lote',
        animal: 'Animal',
        animalEmpty: 'Sin animal',
        cause: 'Causa',
        note: 'Observación',
        noteEmpty: 'Sin observación',
      },
      actions: { edit: 'Editar', back: 'Volver' },
      notFound: {
        title: 'Muerte no encontrada.',
        description: 'Verifique el enlace o vuelva al listado.',
        back: 'Volver al listado',
      },
    },
    form: {
      title: { create: 'Nueva Muerte', edit: 'Editar Muerte' },
      fields: {
        photo: 'Foto',
        code: 'Código',
        date: 'Fecha',
        userName: 'Empleado Responsable',
        batch: 'Lote',
        animal: 'Animal',
        cause: 'Causa',
        note: 'Observación',
      },
      placeholders: {
        batch: 'Seleccione el lote',
        animal: 'Seleccione el animal',
        cause: 'Seleccione la causa',
      },
      hints: {
        codeGeneratedOnSave: 'Generado automáticamente',
        photoAccepted: 'Formatos aceptados: JPEG, PNG, GIF.',
        photoMaxSize: 'Tamaño máximo: 2MB.',
      },
      image: {
        dropzoneTitle: 'Arrastre una imagen o haga clic para seleccionar',
        dropzoneDragging: 'Suelte la imagen aquí',
        changeLabel: 'Cambiar imagen',
        removeLabel: 'Eliminar imagen',
        errorType: 'Tipo de archivo no aceptado.',
        errorSize: 'El archivo excede el tamaño máximo.',
      },
      validation: {
        dateRequired: 'La fecha es obligatoria.',
        batchRequired: 'El lote es obligatorio.',
        animalRequired: 'El animal es obligatorio.',
        causeRequired: 'La causa es obligatoria.',
      },
      dateWarning: { title: 'Fecha de la muerte' },
    },
  },
};
