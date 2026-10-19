// src/constants/languages/languageEsEs/languageFeedingPhases.ts
// Traducción ES del módulo "Fases de Alimentación" (FeedingPhase —
// Operacional/Pecuaria/Confinamiento, F-034, TASK-FP-FE-01). Estructura
// espejo de `languagePtBr/languageFeedingPhases.ts`.

import { ModuleFeedingPhases } from '@/@types/language/module-feeding-phases';

export const languageFeedingPhases: ModuleFeedingPhases = {
  feedingPhase: {
    singularLabel: 'Fase de Alimentación',
    pluralLabel: 'Fases de Alimentación',
    list: {
      pageTitle: 'Fases de Alimentación',
      pageSubtitle: 'Administre las fases de alimentación registradas.',
      deletedToast: 'Fase de alimentación eliminada con éxito',
      columns: {
        code: 'Código',
        name: 'Nombre',
        responsible: 'Empleado Responsable',
        createdAt: 'Creado',
        updatedAt: 'Actualizado',
      },
      actions: {
        view: 'Ver',
        edit: 'Editar',
        delete: 'Eliminar',
      },
      emptyState: {
        titleEmpty: 'Ninguna fase de alimentación registrada.',
        descriptionEmpty: 'Comience agregando la primera fase de alimentación.',
        titleFiltered: 'Ninguna fase de alimentación encontrada.',
        descriptionFiltered: 'Intente ajustar los filtros o borrar la búsqueda.',
        cta: 'Agregar Fase de Alimentación',
      },
    },
    filter: {
      title: 'Filtrar fases de alimentación',
      name: 'Nombre',
      namePlaceholder: 'Buscar por nombre',
      diet: 'Dieta',
      dietAll: 'Todas',
      changeRule: 'Regla de Cambio',
      changeRuleAll: 'Todas',
    },
    form: {
      title: {
        create: 'Nueva Fase de Alimentación',
        edit: 'Editar Fase de Alimentación',
      },
      fields: {
        code: 'Código',
        responsible: 'Empleado Responsable',
        date: 'Fecha',
        name: 'Nombre de la Fase',
        observation: 'Observación',
      },
      changeRuleOptions: {
        byDays: 'Por Días',
        byWeight: 'Por Peso',
      },
      items: {
        title: 'Ítems de la Fase',
        sequence: 'Orden',
        diet: 'Dieta',
        changeRule: 'Regla de Cambio',
        minimumStart: 'Mínimo/Inicio',
        maximumEnd: 'Máximo/Fin',
        addItem: 'Agregar Ítem',
        removeItem: 'Eliminar',
      },
      validation: {
        dateRequired: 'Ingrese la fecha.',
        nameRequired: 'Ingrese el nombre de la fase.',
        nameMax: 'El nombre debe tener como máximo 120 caracteres.',
        observationMax: 'La observación debe tener como máximo 1500 caracteres.',
        itemsMin: 'Agregue al menos un ítem.',
        itemDietRequired: 'Seleccione la dieta.',
        itemChangeRuleRequired: 'Seleccione la regla de cambio.',
        itemMinimumStartMin: 'Ingrese un valor entero mayor o igual a 1.',
        itemMaximumEndMin: 'Ingrese un valor entero mayor o igual a 1.',
        itemMinimumStartExceedsMaximumEnd: 'El Mínimo/Inicio no puede ser mayor que el Máximo/Fin.',
        itemMinimumStartMustExceedPreviousMaximumEnd:
          'El Mínimo/Inicio debe ser mayor que el Máximo/Fin del ítem anterior.',
        itemMaximumEndBelowMinimumStart: 'El Máximo/Fin no puede ser menor que el Mínimo/Inicio.',
        itemMaximumEndMustPrecedeNextMinimumStart:
          'El Máximo/Fin debe ser menor que el Mínimo/Inicio del próximo ítem.',
      },
    },
  },
};
