// src/constants/languages/languageEsEs/languageOperations.ts
// Traducción ES-ES del módulo de OPERACIONES (Operation — Registros Base / Agrícola).

import { ModuleOperations } from '@/@types/language/module-operations';

export const languageOperations: ModuleOperations = {
  operation: {
    singularLabel: 'Operación',
    list: {
      pageTitle: 'Operaciones',
      pageSubtitle:
        'Administre las operaciones vinculadas a las actividades agrícolas y ganaderas.',
      deletedToast: 'Operación eliminada con éxito',
      table: {
        name: 'Nombre',
        grouper: 'Agrupador',
        order: 'Orden',
        status: 'Estado',
        active: 'Activo',
        inactive: 'Inactivo',
        noGrouper: 'Ninguno',
      },
      actions: {
        edit: 'Editar',
        delete: 'Eliminar',
      },
      emptyState: {
        titleEmpty: 'Ninguna operación registrada.',
        descriptionEmpty: 'Comience agregando la primera operación.',
        titleFiltered: 'Ninguna operación encontrada.',
        descriptionFiltered: 'Intente ajustar los filtros o borrar la búsqueda.',
        cta: 'Nueva Operación',
      },
    },
    filter: {
      title: 'Filtrar operaciones',
      search: 'Buscar',
      searchPlaceholder: 'Buscar por nombre',
      isEnabled: 'Estado',
      isEnabledAll: 'Todos',
      enabledOptions: {
        active: 'Activo',
        inactive: 'Inactivo',
      },
      use: 'Uso',
      useAll: 'Todos',
      useOptions: {
        both: 'Ambas',
        agriculture: 'Agricultura',
        livestock: 'Ganadería',
      },
      grouper: 'Agrupador',
      grouperAll: 'Todos',
    },
    form: {
      title: {
        create: 'Nueva Operación',
        edit: 'Editar Operación',
      },
      subtitle: {
        create: 'Registre una nueva operación para uso en las actividades agrícolas y ganaderas.',
        edit: 'Actualice los datos de la operación.',
      },
      fields: {
        name: 'Nombre',
        description: 'Descripción',
        grouper: 'Agrupador',
        order: 'Orden',
        use: 'Uso',
        isEnabled: 'Estado',
      },
      placeholders: {
        name: 'Ej.: Siembra, Cosecha, Pulverización',
        description: 'Descripción opcional de la operación',
        grouper: 'Buscar agrupador por código o nombre',
        order: '0',
      },
      useOptions: {
        both: 'Ambas',
        agriculture: 'Agricultura',
        livestock: 'Ganadería',
      },
      validation: {
        nameRequired: 'El nombre es obligatorio',
        nameMaxLength: 'El nombre debe tener como máximo 30 caracteres',
        descriptionMaxLength: 'La descripción debe tener como máximo 50 caracteres',
        orderRequired: 'El orden es obligatorio',
        useRequired: 'El uso es obligatorio',
        isEnabledRequired: 'El estado es obligatorio',
      },
    },
  },
};
