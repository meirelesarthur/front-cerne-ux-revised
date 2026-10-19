// src/constants/languages/languageEsEs/languageCategoriasProduto.ts
// Traducción ES-ES del módulo de CATEGORÍAS DE PRODUCTO (Registros Base).

import { ModuleCategoryProducts } from '@/@types/language/module-category-products';

export const languageCategoriasProduto: ModuleCategoryProducts = {
  categoryProduct: {
    singularLabel: 'Categoría de Producto',
    list: {
      pageTitle: 'Categorías de Producto',
      pageSubtitle:
        'Administre las categorías utilizadas para clasificar los productos del inventario.',
      deletedToast: 'Categoría de producto eliminada con éxito',
      table: {
        description: 'Descripción',
        type: 'Tipo',
        group: 'Grupo',
        financialCategory: 'Categoría Financiera',
        active: 'Activo',
        activeLabel: 'Activo',
        inactiveLabel: 'Inactivo',
      },
      actions: {
        edit: 'Editar',
        delete: 'Eliminar',
      },
      emptyState: {
        titleEmpty: 'Ninguna categoría de producto registrada.',
        descriptionEmpty: 'Comience agregando la primera categoría de producto.',
        titleEmptyNoCreate: 'Ninguna categoría de producto disponible.',
        descriptionEmptyNoCreate:
          'Todavía no hay categorías de producto registradas. Comuníquese con el administrador de la plataforma.',
        titleFiltered: 'Ninguna categoría de producto encontrada.',
        descriptionFiltered: 'Intente ajustar los filtros o borrar la búsqueda.',
        cta: 'Nueva Categoría de Producto',
      },
      deleteConfirm: {
        title: 'Eliminar categoría de producto',
        description: '¿Está seguro de que desea eliminar la categoría de producto',
        warning:
          'Esta eliminación puede ser bloqueada si la categoría está en uso por Tipos (Kind) o Productos vinculados.',
      },
    },
    filter: {
      title: 'Filtrar categorías de producto',
      search: 'Buscar',
      searchPlaceholder: 'Buscar por descripción',
      group: 'Grupo de Producto',
      groupAll: 'Todos',
      type: 'Tipo',
      typeAll: 'Todos',
      typeOptions: {
        input: 'Insumos',
        equipment: 'Máquinas',
        production: 'Producción',
      },
      isEnabled: 'Estado',
      isEnabledAll: 'Todos',
      enabledOptions: {
        active: 'Activo',
        inactive: 'Inactivo',
      },
    },
    form: {
      title: {
        create: 'Nueva Categoría de Producto',
        edit: 'Editar Categoría de Producto',
      },
      subtitle: {
        create: 'Registre una nueva categoría para clasificar productos del inventario.',
        edit: 'Actualice los datos de la categoría de producto.',
      },
      fields: {
        description: 'Descripción',
        isEnabled: 'Estado',
        type: 'Tipo',
        group: 'Grupo de Producto',
        financialCategory: 'Categoría Financiera',
        typeOptions: {
          input: 'Insumos',
          equipment: 'Máquinas',
          production: 'Producción',
        },
      },
      placeholders: {
        description: 'Ej.: Fertilizantes Nitrogenados',
        group: 'Seleccione el grupo de producto',
        financialCategory: 'Seleccione la categoría financiera',
      },
      isEnabledOptions: {
        active: 'Activo',
        inactive: 'Inactivo',
      },
      hints: {
        groupRequired: 'Seleccione el grupo de producto al que pertenece esta categoría.',
      },
      validation: {
        descriptionRequired: 'La descripción es obligatoria',
        descriptionMaxLength: 'La descripción debe tener como máximo 100 caracteres',
        isEnabledRequired: 'Seleccione el estado',
        typeRequired: 'Seleccione el tipo',
        groupRequired: 'Seleccione el grupo de producto',
        financialCategoryRequired: 'Seleccione la categoría financiera',
      },
    },
  },
};
