// src/constants/languages/languageEsEs/languageGruposProduto.ts
// Traducción ES-ES del módulo de GRUPOS DE PRODUCTO (Registros Base).

import { ModuleProductGroups } from '@/@types/language/module-product-groups';

export const languageGruposProduto: ModuleProductGroups = {
  productGroup: {
    singularLabel: 'Grupo de Producto',
    list: {
      pageTitle: 'Grupos de Producto',
      pageSubtitle:
        'Administre los grupos utilizados para clasificar los productos del inventario.',
      deletedToast: 'Grupo de producto eliminado con éxito',
      table: {
        description: 'Descripción',
        active: 'Activo',
        activeLabel: 'Activo',
        inactiveLabel: 'Inactivo',
      },
      actions: {
        edit: 'Editar',
        delete: 'Eliminar',
      },
      emptyState: {
        titleEmpty: 'Ningún grupo de producto registrado.',
        descriptionEmpty: 'Comience agregando el primer grupo de producto.',
        titleEmptyNoCreate: 'Ningún grupo de producto disponible.',
        descriptionEmptyNoCreate:
          'Todavía no hay grupos de producto registrados. Comuníquese con el administrador de la plataforma.',
        titleFiltered: 'Ningún grupo de producto encontrado.',
        descriptionFiltered: 'Intente ajustar los filtros o borrar la búsqueda.',
        cta: 'Nuevo Grupo de Producto',
      },
      deleteConfirm: {
        title: 'Eliminar grupo de producto',
        description: '¿Está seguro de que desea eliminar el grupo de producto',
        warning:
          'Esta eliminación es definitiva y no se puede deshacer — el grupo de producto no utiliza eliminación reversible (sin papelera).',
      },
    },
    filter: {
      title: 'Filtrar grupos de producto',
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
        create: 'Nuevo Grupo de Producto',
        edit: 'Editar Grupo de Producto',
      },
      subtitle: {
        create: 'Registre un nuevo grupo para clasificar productos del inventario.',
        edit: 'Actualice los datos del grupo de producto.',
      },
      fields: {
        description: 'Descripción',
        isEnabled: 'Estado',
      },
      placeholders: {
        description: 'Ej.: Insumos Agrícolas',
      },
      isEnabledOptions: {
        active: 'Activo',
        inactive: 'Inactivo',
      },
      validation: {
        descriptionRequired: 'La descripción es obligatoria',
        descriptionMaxLength: 'La descripción debe tener como máximo 100 caracteres',
        isEnabledRequired: 'Seleccione el estado',
      },
    },
  },
};
