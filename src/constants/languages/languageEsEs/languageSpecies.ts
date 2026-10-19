// src/constants/languages/languageEsEs/languageSpecies.ts
// Traducción ES-ES del módulo de ESPECIES (Registros Base).

import { ModuleSpecies } from '@/@types/language/module-species';

export const languageSpecies: ModuleSpecies = {
  specie: {
    singularLabel: 'Especie',
    list: {
      pageTitle: 'Especies',
      pageSubtitle: 'Administre las especies utilizadas en el registro de animales.',
      deletedToast: 'Especie eliminada con éxito',
      table: {
        description: 'Descripción',
        status: 'Estado',
        active: 'Activo',
        inactive: 'Inactivo',
      },
      actions: {
        edit: 'Editar',
        delete: 'Eliminar',
      },
      emptyState: {
        titleEmpty: 'Ninguna especie registrada.',
        descriptionEmpty: 'Comience agregando la primera especie.',
        titleFiltered: 'Ninguna especie encontrada.',
        descriptionFiltered: 'Intente ajustar los filtros o borrar la búsqueda.',
        cta: 'Nueva Especie',
      },
    },
    filter: {
      title: 'Filtrar especies',
      search: 'Buscar',
      searchPlaceholder: 'Buscar por descripción',
      isEnabled: 'Estado',
      isEnabledAll: 'Todos',
      enabledOptions: {
        active: 'Activo',
        inactive: 'Inactivo',
      },
    },
    form: {
      title: {
        create: 'Nueva Especie',
        edit: 'Editar Especie',
      },
      subtitle: {
        create: 'Registre una nueva especie para uso en el registro de animales.',
        edit: 'Actualice los datos de la especie.',
      },
      fields: {
        description: 'Descripción',
        isEnabled: 'Estado',
        costCenter: 'Centro de Costo',
      },
      placeholders: {
        description: 'Ej.: Bovino',
        costCenter: 'Buscar por código o descripción',
      },
      hints: {
        costCenterOptional: 'Opcional — vincule un centro de costo para asignar ingresos y gastos de esta especie.',
      },
      validation: {
        descriptionRequired: 'La descripción es obligatoria',
        descriptionMaxLength: 'La descripción debe tener como máximo 100 caracteres',
      },
    },
  },
};
