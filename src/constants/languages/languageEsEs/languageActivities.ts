// src/constants/languages/languageEsEs/languageActivities.ts
// Traducción ES-ES del módulo de ACTIVIDADES (Activity — Registros Base / Agrícola).

import { ModuleActivities } from '@/@types/language/module-activities';

export const languageActivities: ModuleActivities = {
  activity: {
    singularLabel: 'Actividad',
    list: {
      pageTitle: 'Actividades',
      pageSubtitle:
        'Administre las actividades utilizadas en la apropiación de costos por hectárea.',
      deletedToast: 'Actividad eliminada con éxito',
      table: {
        name: 'Nombre',
        description: 'Descripción',
        vlHectare: 'Valor/Hectárea',
        type: 'Tipo',
        use: 'Uso',
        operations: 'Operaciones',
        status: 'Estado',
        active: 'Activo',
        inactive: 'Inactivo',
      },
      actions: {
        edit: 'Editar',
        delete: 'Eliminar',
      },
      emptyState: {
        titleEmpty: 'Ninguna actividad registrada.',
        descriptionEmpty: 'Comience agregando la primera actividad.',
        titleFiltered: 'Ninguna actividad encontrada.',
        descriptionFiltered: 'Intente ajustar los filtros o borrar la búsqueda.',
        cta: 'Nueva Actividad',
      },
    },
    filter: {
      title: 'Filtrar actividades',
      search: 'Buscar',
      searchPlaceholder: 'Buscar por nombre',
      isEnabled: 'Estado',
      isEnabledAll: 'Todos',
      enabledOptions: {
        active: 'Activo',
        inactive: 'Inactivo',
      },
      type: 'Tipo',
      typeAll: 'Todos',
      typeOptions: {
        costing: 'Costeo',
        investment: 'Inversión',
        undefined: 'Por Definir',
      },
      use: 'Uso',
      useAll: 'Todos',
      useOptions: {
        both: 'Ambas',
        agriculture: 'Agricultura',
        fruitculture: 'Fruticultura',
        beefCattle: 'Ganadería de Corte',
      },
    },
    form: {
      title: {
        create: 'Nueva Actividad',
        edit: 'Editar Actividad',
      },
      subtitle: {
        create: 'Registre una nueva actividad para uso en la apropiación de costos.',
        edit: 'Actualice los datos de la actividad.',
      },
      fields: {
        name: 'Nombre',
        description: 'Descripción',
        vlHectare: 'Valor/Hectárea',
        type: 'Tipo',
        use: 'Uso',
        isEnabled: 'Estado',
        operations: 'Operaciones',
      },
      operationsField: {
        searchPlaceholder: 'Buscar operación por nombre',
        selectAllLabel: 'Marcar todos',
        deselectAllLabel: 'Desmarcar todos',
        selectedCountLabel: 'N.º de registros seleccionados',
        emptyLabel: 'Ninguna operación encontrada.',
        errorLabel: 'Error al cargar las operaciones.',
        retryLabel: 'Intentar de nuevo',
      },
      placeholders: {
        name: 'Ej.: Cosecha de Soja, Mantenimiento de Cerca',
        description: 'Descripción opcional de la actividad',
        vlHectare: '0,00',
      },
      typeOptions: {
        costing: 'Costeo',
        investment: 'Inversión',
        undefined: 'Por Definir',
      },
      useOptions: {
        both: 'Ambas',
        agriculture: 'Agricultura',
        fruitculture: 'Fruticultura',
        beefCattle: 'Ganadería de Corte',
      },
      validation: {
        nameRequired: 'El nombre es obligatorio',
        nameMaxLength: 'El nombre debe tener como máximo 30 caracteres',
        descriptionMaxLength: 'La descripción debe tener como máximo 50 caracteres',
        isEnabledRequired: 'El estado es obligatorio',
        vlHectareRequired: 'El valor por hectárea es obligatorio',
        vlHectareMin: 'El valor por hectárea no puede ser negativo',
        typeRequired: 'El tipo es obligatorio',
        useRequired: 'El uso es obligatorio',
      },
    },
  },
};
