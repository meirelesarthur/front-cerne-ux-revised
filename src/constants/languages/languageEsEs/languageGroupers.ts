// src/constants/languages/languageEsEs/languageGroupers.ts
// Traducción ES-ES del módulo de AGRUPADORES (Grouper — Registros Base / Financiero).

import { ModuleGroupers } from '@/@types/language/module-groupers';

export const languageGroupers: ModuleGroupers = {
  grouper: {
    singularLabel: 'Agrupador',
    list: {
      pageTitle: 'Agrupadores',
      pageSubtitle:
        'Administre el árbol de agrupadores utilizado en el plan de cuentas financiero.',
      deletedToast: 'Agrupador eliminado con éxito',
      table: {
        code: 'Código',
        name: 'Nombre',
        description: 'Descripción',
        type: 'Tipo',
        condition: 'Condición',
        order: 'Orden',
        operations: 'Operaciones',
        status: 'Estado',
        active: 'Activo',
        inactive: 'Inactivo',
      },
      actions: {
        edit: 'Editar',
        delete: 'Eliminar',
        addChild: 'Agregar agrupador hijo',
        expand: 'Expandir',
        collapse: 'Contraer',
      },
      emptyState: {
        titleEmpty: 'Ningún agrupador registrado.',
        descriptionEmpty: 'Comience agregando el primer agrupador.',
        titleFiltered: 'Ningún agrupador encontrado.',
        descriptionFiltered: 'Intente ajustar los filtros o borrar la búsqueda.',
        cta: 'Nuevo Agrupador',
      },
      deleteConfirm: {
        title: 'Eliminar agrupador',
        description: '¿Está seguro de que desea eliminar el agrupador',
        warning:
          'Esta acción también eliminará todos los agrupadores descendientes, si los hay, y no se puede deshacer.',
      },
      loadingChildren: 'Cargando descendientes...',
      error: {
        message: 'No fue posible cargar los descendientes de este agrupador.',
        retry: 'Intentar de nuevo',
      },
    },
    filter: {
      title: 'Filtrar agrupadores',
      search: 'Buscar',
      searchPlaceholder: 'Buscar por nombre o código',
      isEnabled: 'Estado',
      isEnabledAll: 'Todos',
      enabledOptions: {
        active: 'Activo',
        inactive: 'Inactivo',
      },
      type: 'Tipo',
      typeAll: 'Todos',
      typeOptions: {
        cost: 'Costo',
        revenue: 'Ingreso',
        depreciation: 'Depreciación',
        financial: 'Financiero',
      },
      condition: 'Condición',
      conditionAll: 'Todas',
      conditionOptions: {
        category: 'Categoría',
        calculation: 'Cálculo',
      },
    },
    form: {
      title: {
        create: 'Nuevo Agrupador',
        edit: 'Editar Agrupador',
        createChild: 'Nuevo Agrupador Hijo',
      },
      subtitle: {
        create: 'Registre un nuevo agrupador en el plan de cuentas financiero.',
        edit: 'Actualice los datos del agrupador.',
      },
      fields: {
        name: 'Nombre',
        description: 'Descripción',
        type: 'Tipo',
        condition: 'Condición',
        isEnabled: 'Estado',
        order: 'Orden',
        formula: 'Fórmula',
        parent: 'Agrupador padre',
      },
      placeholders: {
        name: 'Ej.: Costos Fijos, Ingresos Operativos',
        description: 'Descripción opcional del agrupador',
        formula: 'Fórmula de cálculo opcional',
      },
      parentPlaceholder: {
        root: 'Ninguno (agrupador raíz)',
      },
      typeOptions: {
        cost: 'Costo',
        revenue: 'Ingreso',
        depreciation: 'Depreciación',
        financial: 'Financiero',
      },
      conditionOptions: {
        category: 'Categoría',
        calculation: 'Cálculo',
      },
      validation: {
        nameRequired: 'El nombre es obligatorio',
        nameMaxLength: 'El nombre debe tener como máximo 60 caracteres',
        descriptionMaxLength: 'La descripción debe tener como máximo 50 caracteres',
        typeRequired: 'El tipo es obligatorio',
        conditionRequired: 'La condición es obligatoria',
        isEnabledRequired: 'El estado es obligatorio',
        orderRequired: 'El orden es obligatorio',
        orderMin: 'El orden debe ser como mínimo 1',
        formulaMaxLength: 'La fórmula debe tener como máximo 191 caracteres',
      },
    },
  },
};
