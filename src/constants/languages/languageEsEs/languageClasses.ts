// src/constants/languages/languageEsEs/languageClasses.ts
// Traducción ES-ES del módulo de Clases de Producto (Kind — Registros Base /
// Estructura, ejecución 024).

import { ModuleKinds } from '@/@types/language/module-kinds';

export const languageClasses: ModuleKinds = {
  kind: {
    singularLabel: 'Clase',
    list: {
      pageTitle: 'Clases',
      pageSubtitle: 'Administre las clases de producto vinculadas a las categorías registradas.',
      deletedToast: 'Clase eliminada con éxito',
      table: {
        name: 'Nombre',
        category: 'Categoría',
        active: 'Activo',
        activeLabel: 'Activo',
        inactiveLabel: 'Inactivo',
      },
      actions: {
        edit: 'Editar',
        delete: 'Eliminar',
      },
      emptyState: {
        titleEmpty: 'No hay clases registradas.',
        descriptionEmpty: 'Comience agregando la primera clase.',
        titleEmptyNoCreate: 'No hay clases disponibles.',
        descriptionEmptyNoCreate:
          'Todavía no hay clases registradas. Comuníquese con el administrador de la plataforma.',
        titleFiltered: 'No se encontraron clases.',
        descriptionFiltered: 'Intente ajustar los filtros o limpiar la búsqueda.',
        cta: 'Nueva Clase',
      },
      deleteConfirm: {
        title: 'Eliminar clase',
        description: '¿Está seguro de que desea eliminar la clase',
        warning: 'Si hay productos vinculados a esta clase, el sistema bloqueará la eliminación.',
      },
    },
    filter: {
      title: 'Filtrar clases',
      search: 'Buscar',
      searchPlaceholder: 'Buscar por nombre',
      isEnabled: 'Estado',
      isEnabledAll: 'Todos',
      enabledOptions: {
        active: 'Activo',
        inactive: 'Inactivo',
      },
      category: 'Categoría',
      categoryAll: 'Todas',
      categorySearchPlaceholder: 'Buscar por descripción',
    },
    form: {
      title: {
        create: 'Nueva Clase',
        edit: 'Editar Clase',
      },
      subtitle: {
        create: 'Registre una nueva clase de producto vinculada a una categoría.',
        edit: 'Actualice los datos de la clase.',
      },
      fields: {
        name: 'Nombre',
        isEnabled: 'Activo',
        category: 'Categoría',
      },
      placeholders: {
        name: 'Ej.: Fertilizante Nitrogenado',
        category: 'Buscar por descripción',
      },
      hints: {
        categoryRequired: 'La categoría es obligatoria.',
      },
      validation: {
        nameRequired: 'El nombre es obligatorio',
        nameMaxLength: 'El nombre debe tener como máximo 100 caracteres',
        categoryRequired: 'Seleccione una categoría',
      },
    },
  },
};
