// src/constants/languages/languageEsEs/languageCategoryMatrix.ts
// Traducción ES-ES del módulo de ESTADIO REPRODUCTIVO (CategoryMatrix —
// Registros Base > Pecuaria).

import { ModuleCategoryMatrix } from '@/@types/language/module-category-matrix';

export const languageCategoryMatrix: ModuleCategoryMatrix = {
  categoryMatrix: {
    singularLabel: 'Estadio Reproductivo',
    list: {
      pageTitle: 'Estadio Reproductivo',
      pageSubtitle: 'Administre los estadios reproductivos utilizados en el registro de animales.',
      deletedToast: 'Estadio reproductivo eliminado con éxito',
      table: {
        description: 'Descripción',
        status: 'Estado',
        specie: 'Especie',
        active: 'Activo',
        inactive: 'Inactivo',
      },
      actions: {
        edit: 'Editar',
        delete: 'Eliminar',
      },
      emptyState: {
        titleEmpty: 'Ningún estadio reproductivo registrado.',
        descriptionEmpty: 'Comience agregando el primer estadio reproductivo.',
        titleFiltered: 'Ningún estadio reproductivo encontrado.',
        descriptionFiltered: 'Intente ajustar los filtros o borrar la búsqueda.',
        cta: 'Nuevo Estadio Reproductivo',
      },
    },
    filter: {
      title: 'Filtrar estadios reproductivos',
      search: 'Buscar',
      searchPlaceholder: 'Buscar por descripción',
      isEnabled: 'Estado',
      isEnabledAll: 'Todos',
      enabledOptions: {
        active: 'Activo',
        inactive: 'Inactivo',
      },
      specie: 'Especie',
      speciePlaceholder: 'Buscar por especie',
    },
    form: {
      title: {
        create: 'Nuevo Estadio Reproductivo',
        edit: 'Editar Estadio Reproductivo',
      },
      subtitle: {
        create: 'Registre un nuevo estadio reproductivo para uso en el registro de animales.',
        edit: 'Actualice los datos del estadio reproductivo.',
      },
      fields: {
        description: 'Descripción',
        isEnabled: 'Estado',
        specie: 'Especie',
      },
      placeholders: {
        description: 'Ej.: Novilla',
        specie: 'Buscar por especie',
      },
      validation: {
        descriptionRequired: 'La descripción es obligatoria',
        descriptionMaxLength: 'La descripción debe tener como máximo 100 caracteres',
        specieRequired: 'La especie es obligatoria',
      },
    },
  },
};
