// src/constants/languages/languageEsEs/languageCategoriaAnimal.ts
// Traducción ES-ES del módulo "Categorías Animales" (CategoryAnimal —
// Registros Base / Pecuaria, ejecución 025). TASK-FE-540 (infraestructura +
// validación) + TASK-FE-541 (listado/filtro).

import { ModuleCategoryAnimals } from '@/@types/language/module-category-animals';

export const languageCategoriaAnimal: ModuleCategoryAnimals = {
  categoryAnimal: {
    singularLabel: 'Categoría Animal',
    pluralLabel: 'Categorías Animales',

    genderOptions: {
      male: 'Macho',
      female: 'Hembra',
      both: 'Ambos',
    },

    list: {
      pageTitle: 'Categorías Animales',
      pageSubtitle: 'Administre las categorías de animales utilizadas en la ganadería.',
      deletedToast: 'Categoría animal eliminada con éxito',
      table: {
        description: 'Descripción',
        specie: 'Especie',
        specieEmpty: '—',
        gender: 'Sexo',
        ageRange: 'Rango de edad',
        ageRangeEmpty: '—',
        ageRangeFrom: 'a partir de {months} meses',
        ageRangeTo: 'hasta {months} meses',
        ageRangeBetween: 'de {start} a {end} meses',
        active: 'Estado',
        activeLabel: 'Activo',
        inactiveLabel: 'Inactivo',
      },
      actions: {
        edit: 'Editar',
        delete: 'Eliminar',
      },
      emptyState: {
        titleEmpty: 'Ninguna categoría animal registrada.',
        descriptionEmpty: 'Comience agregando la primera categoría.',
        titleEmptyNoCreate: 'Ninguna categoría animal disponible.',
        descriptionEmptyNoCreate:
          'Aún no hay categorías registradas. Póngase en contacto con el administrador de la plataforma.',
        titleFiltered: 'Ninguna categoría encontrada.',
        descriptionFiltered: 'Intente ajustar los filtros o borrar la búsqueda.',
        cta: 'Nueva Categoría',
      },
      deleteConfirm: {
        title: 'Eliminar categoría animal',
        description: '¿Está seguro de que desea eliminar la categoría',
        warning:
          'Esta acción es definitiva y no se puede deshacer. Si existen vínculos dependientes, la eliminación puede ser bloqueada por el sistema.',
      },
    },

    filter: {
      title: 'Filtrar categorías animales',
      search: 'Buscar',
      searchPlaceholder: 'Buscar por descripción',
      specie: 'Especie',
      specieAll: 'Todas',
      gender: 'Sexo',
      genderAll: 'Todos',
      isEnabled: 'Estado',
      isEnabledAll: 'Todos',
      enabledOptions: {
        active: 'Activo',
        inactive: 'Inactivo',
      },
    },

    form: {
      title: {
        create: 'Nueva Categoría Animal',
        edit: 'Editar Categoría Animal',
      },
      subtitle: {
        create: 'Registre una nueva categoría animal vinculada a una especie.',
        edit: 'Actualice los datos de la categoría animal.',
      },
      fields: {
        description: 'Descripción',
        isEnabled: 'Activo',
        specie: 'Especie',
        gender: 'Sexo',
        startMonth: 'Mes inicial',
        endMonth: 'Mes final',
        nextCategory: 'Próxima Categoría (Evolución)',
      },
      placeholders: {
        description: 'Ej.: Ternero',
        specie: 'Buscar por descripción',
        nextCategory: 'Buscar por descripción',
      },
      hints: {
        specieRequired: 'La especie es obligatoria.',
      },
      validation: {
        descriptionRequired: 'La descripción es obligatoria',
        descriptionMaxLength: 'La descripción debe tener como máximo 100 caracteres',
        specieRequired: 'Seleccione una especie',
        genderRequired: 'Seleccione el sexo',
        startMonthMin: 'El mes inicial no puede ser negativo',
        endMonthMin: 'El mes final no puede ser negativo',
      },
    },
  },
};
