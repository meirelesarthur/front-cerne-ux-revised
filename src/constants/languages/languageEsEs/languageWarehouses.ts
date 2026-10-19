// src/constants/languages/languageEsEs/languageWarehouses.ts
// Traducción ES-ES del módulo de ALMACENES (Registros Base).

import { ModuleWarehouses } from '@/@types/language/module-warehouses';

export const languageWarehouses: ModuleWarehouses = {
  warehouse: {
    singularLabel: 'Almacén',
    list: {
      pageTitle: 'Almacenes',
      pageSubtitle: 'Administre los almacenes utilizados para el control de existencias.',
      deletedToast: 'Almacén eliminado con éxito',
      table: {
        initials: 'Sigla',
        description: 'Descripción',
        type: 'Tipo',
        active: 'Estado',
        activeLabel: 'Activo',
        inactiveLabel: 'Inactivo',
      },
      actions: {
        edit: 'Editar',
        delete: 'Eliminar',
      },
      emptyState: {
        titleEmpty: 'Ningún almacén registrado.',
        descriptionEmpty: 'Comience agregando el primer almacén.',
        titleFiltered: 'Ningún almacén encontrado.',
        descriptionFiltered: 'Intente ajustar los filtros o borrar la búsqueda.',
        cta: 'Agregar Almacén',
      },
    },
    filter: {
      title: 'Filtrar almacenes',
      search: 'Buscar',
      searchPlaceholder: 'Buscar por sigla o descripción',
      type: 'Tipo',
      typeAll: 'Todos',
      typeOptions: {
        insumos: 'Insumos',
        producao: 'Producción',
        formulacao: 'Formulación',
      },
      isActive: 'Estado',
      isActiveAll: 'Todos',
      activeOptions: {
        active: 'Activo',
        inactive: 'Inactivo',
      },
    },
    form: {
      title: {
        create: 'Nuevo Almacén',
        edit: 'Editar Almacén',
      },
      subtitle: {
        create: 'Registre un nuevo almacén para el control de existencias.',
        edit: 'Actualice los datos del almacén.',
      },
      fields: {
        initials: 'Sigla',
        type: 'Tipo',
        description: 'Descripción',
        isActive: 'Activo',
      },
      placeholders: {
        initials: 'Ej.: ALG',
        description: 'Ej.: Almacén de Insumos - Sede',
      },
      hints: {
        isActiveHelp:
          'Los almacenes inactivos dejan de aparecer como opción en otras pantallas del sistema.',
      },
      validation: {
        initialsRequired: 'La sigla es obligatoria',
        initialsMinLength: 'La sigla debe tener al menos 2 caracteres',
        initialsMaxLength: 'La sigla debe tener como máximo 6 caracteres',
        typeRequired: 'Seleccione un tipo',
        descriptionRequired: 'La descripción es obligatoria',
        descriptionMinLength: 'La descripción debe tener al menos 2 caracteres',
        descriptionMaxLength: 'La descripción debe tener como máximo 80 caracteres',
      },
    },
  },
};
