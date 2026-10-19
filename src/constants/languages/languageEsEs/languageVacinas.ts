// src/constants/languages/languageEsEs/languageVacinas.ts
// Traducción ES-ES del módulo de VACUNAS (Registros Base / Pecuaria).

import { ModuleVaccines } from '@/@types/language/module-vaccines';

export const languageVacinas: ModuleVaccines = {
  vaccine: {
    singularLabel: 'Vacuna',
    list: {
      pageTitle: 'Vacunas',
      pageSubtitle: 'Administre los tipos de vacuna aplicables a los animales.',
      deletedToast: 'Vacuna eliminada con éxito',
      table: {
        description: 'Descripción',
        specie: 'Especie',
        active: 'Activo',
        activeLabel: 'Activo',
        inactiveLabel: 'Inactivo',
      },
      actions: { edit: 'Editar', delete: 'Eliminar' },
      emptyState: {
        titleEmpty: 'Ninguna vacuna registrada.',
        descriptionEmpty: 'Comience agregando la primera vacuna.',
        titleEmptyNoCreate: 'Ninguna vacuna disponible.',
        descriptionEmptyNoCreate:
          'Todavía no hay vacunas registradas. Comuníquese con el administrador de la plataforma.',
        titleFiltered: 'Ninguna vacuna encontrada.',
        descriptionFiltered: 'Intente ajustar los filtros o borrar la búsqueda.',
        cta: 'Nueva Vacuna',
      },
      deleteConfirm: {
        title: 'Eliminar vacuna',
        description: '¿Está seguro de que desea eliminar la vacuna',
        warning:
          'Esta acción no se puede deshacer. Una vacuna con registros vinculados no puede eliminarse; desactívela.',
      },
    },
    filter: {
      title: 'Filtrar vacunas',
      search: 'Buscar',
      searchPlaceholder: 'Buscar por descripción',
      isEnabled: 'Estado',
      isEnabledAll: 'Todos',
      enabledOptions: { active: 'Activa', inactive: 'Inactiva' },
      specie: 'Especie',
      specieAll: 'Todas',
      specieSearchPlaceholder: 'Buscar por descripción',
    },
    form: {
      title: { create: 'Nueva Vacuna', edit: 'Editar Vacuna' },
      subtitle: {
        create: 'Registre un nuevo tipo de vacuna.',
        edit: 'Actualice los datos de la vacuna.',
      },
      fields: { description: 'Descripción', isEnabled: 'Estado', specie: 'Especie' },
      placeholders: { description: 'Ej.: Aftosa', specie: 'Buscar por descripción' },
      validation: {
        descriptionRequired: 'La descripción es obligatoria',
        descriptionMaxLength: 'La descripción debe tener como máximo 100 caracteres',
      },
    },
  },
};
