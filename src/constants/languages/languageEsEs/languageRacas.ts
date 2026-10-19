// src/constants/languages/languageEsEs/languageRacas.ts
// Traducción ES-ES del módulo de RAZAS (Registros Base).

import { ModuleBreeds } from '@/@types/language/module-breeds';

export const languageRacas: ModuleBreeds = {
  breed: {
    singularLabel: 'Raza',
    list: {
      pageTitle: 'Razas',
      pageSubtitle: 'Administre las razas vinculadas a las especies registradas.',
      deletedToast: 'Raza eliminada con éxito',
      table: {
        description: 'Descripción',
        specie: 'Especie',
        active: 'Activo',
        activeLabel: 'Activo',
        inactiveLabel: 'Inactivo',
      },
      actions: {
        edit: 'Editar',
        delete: 'Eliminar',
      },
      emptyState: {
        titleEmpty: 'Ninguna raza registrada.',
        descriptionEmpty: 'Comience agregando la primera raza.',
        titleEmptyNoCreate: 'Ninguna raza disponible.',
        descriptionEmptyNoCreate:
          'Todavía no hay razas registradas. Comuníquese con el administrador de la plataforma.',
        titleFiltered: 'Ninguna raza encontrada.',
        descriptionFiltered: 'Intente ajustar los filtros o borrar la búsqueda.',
        cta: 'Nueva Raza',
      },
      deleteConfirm: {
        title: 'Eliminar raza',
        description: '¿Está seguro de que desea eliminar la raza',
        warning:
          'Esta acción no se puede deshacer. Una raza con registros vinculados no puede eliminarse; desactívela.',
      },
    },
    filter: {
      title: 'Filtrar razas',
      search: 'Buscar',
      searchPlaceholder: 'Buscar por descripción',
      isEnabled: 'Estado',
      isEnabledAll: 'Todos',
      enabledOptions: {
        active: 'Activo',
        inactive: 'Inactivo',
      },
      specie: 'Especie',
      specieAll: 'Todas',
      specieSearchPlaceholder: 'Buscar por descripción',
    },
    form: {
      title: {
        create: 'Nueva Raza',
        edit: 'Editar Raza',
      },
      subtitle: {
        create: 'Registre una nueva raza vinculada a una especie.',
        edit: 'Actualice los datos de la raza.',
      },
      fields: {
        description: 'Descripción',
        isEnabled: 'Activo',
        specie: 'Especie',
      },
      placeholders: {
        description: 'Ej.: Nelore',
        specie: 'Buscar por descripción',
      },
      hints: {
        specieRequired: 'La especie es obligatoria.',
      },
      validation: {
        descriptionRequired: 'La descripción es obligatoria',
        descriptionMaxLength: 'La descripción debe tener como máximo 100 caracteres',
        specieRequired: 'Seleccione una especie',
      },
    },
  },
};
