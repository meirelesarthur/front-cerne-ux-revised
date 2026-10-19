// src/constants/languages/languageEsEs/languageBreedingSeasons.ts
// Traducción ES-ES del módulo "Estación de Monta" (BreedingSeason —
// Operacional / Reproducción, 97-Esteiras/003, Tareas 12/13).

import { ModuleBreedingSeasons } from '@/@types/language/module-breeding-seasons';

export const languageBreedingSeasons: ModuleBreedingSeasons = {
  breedingSeason: {
    singularLabel: 'Estación de Monta',
    pluralLabel: 'Estaciones de Monta',
    titleModule: 'Estación de Monta',
    list: {
      pageTitle: 'Estación de Monta',
      pageSubtitle: 'Administre las estaciones de monta registradas.',
      deletedToast: 'Estación de monta eliminada con éxito',
      newButton: 'Nueva Estación de Monta',
      table: {
        code: 'Código',
        date: 'Fecha de Registro',
        startDate: 'Fecha Inicial',
        endDate: 'Fecha Final',
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
        titleEmpty: 'Ninguna estación de monta registrada.',
        descriptionEmpty: 'Comience registrando una nueva estación de monta.',
        titleFiltered: 'Ningún registro encontrado.',
        descriptionFiltered: 'Intente ajustar los filtros.',
        cta: 'Nueva Estación de Monta',
      },
      filter: {
        title: 'Filtrar Estaciones de Monta',
        responsible: 'Responsable',
      },
      deleteDialog: {
        title: '¿Eliminar estación de monta?',
        description: 'será eliminada permanentemente.',
        warning: 'Esta acción no se puede deshacer.',
      },
    },
    detail: {
      title: 'Estación de Monta',
      backButton: 'Volver',
      editButton: 'Editar',
      stats: {
        days: 'Días',
        weeks: 'Semanas',
      },
      sections: {
        generalData: 'Datos Generales',
      },
      fields: {
        code: 'Código',
        date: 'Fecha de Registro',
        startDate: 'Fecha Inicial',
        endDate: 'Fecha Final',
        responsible: 'Responsable',
        description: 'Descripción',
        createdAt: 'Creado el',
        updatedAt: 'Actualizado el',
      },
      notFound: {
        title: 'Estación de monta no encontrada.',
        description: 'El registro pudo haber sido eliminado o el enlace es incorrecto.',
      },
      invalidParamsToast: {
        title: 'Estación de Monta',
        description: 'Parámetros inválidos para mostrar el detalle.',
      },
    },
    form: {
      title: {
        create: 'Nueva Estación de Monta',
        edit: 'Editar Estación de Monta',
      },
      fields: {
        code: 'Código',
        responsible: 'Responsable',
        date: 'Fecha de Registro',
        description: 'Descripción',
        startDate: 'Fecha Inicial',
        endDate: 'Fecha Final',
        daysPreview: 'Días',
        weeksPreview: 'Semanas',
      },
      validation: {
        dateRequired: 'Ingrese la fecha',
        descriptionRequired: 'Ingrese la descripción',
        startDateRequired: 'Ingrese la fecha inicial',
        endDateRequired: 'Ingrese la fecha final',
        endDateBeforeStartDate: 'La fecha de inicio no puede ser mayor que la fecha final',
      },
      unsavedChangesDialog: {
        title: '¿Salir sin guardar?',
        description: 'Existen cambios no guardados en este formulario que se perderán',
        confirmButton: 'Salir sin guardar',
      },
    },
    chart: {
      title: 'Días por mes',
      empty: 'Sin datos para el período informado.',
    },
  },
};
