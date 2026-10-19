// src/constants/languages/languageEsEs/languagePackages.ts
// Traducción ES-ES del módulo de EMBALAJES (Package — Registros Base /
// Estructura, ejecución 025).

import { ModulePackages } from '@/@types/language/module-packages';

export const languagePackages: ModulePackages = {
  package: {
    singularLabel: 'Embalaje',
    form: {
      title: {
        create: 'Nuevo Embalaje',
        edit: 'Editar Embalaje',
      },
      subtitle: {
        create: 'Registre un nuevo embalaje vinculado a una unidad de medida.',
        edit: 'Actualice los datos del embalaje.',
      },
      fields: {
        description: 'Descripción',
        size: 'Cantidad',
        measurement: 'Unidad de Medida',
      },
      placeholders: {
        description: 'Ej: SC 60KG',
        measurement: 'Seleccione...',
      },
      hints: {
        measurementRequired: 'La unidad de medida es obligatoria.',
      },
      validation: {
        descriptionRequired: 'La descripción es obligatoria',
        descriptionMaxLength: 'La descripción debe tener como máximo 255 caracteres',
        sizeRequired: 'La cantidad es obligatoria',
        sizeMin: 'La cantidad debe ser mayor que cero',
        measurementRequired: 'Seleccione una unidad de medida',
      },
      noFarmSelected: {
        title: 'Seleccione una finca',
        description:
          'El catálogo de Embalajes es compartido por todas las fincas del tenant, pero el acceso exige una finca activa seleccionada.',
      },
    },
    list: {
      pageTitle: 'Embalajes',
      pageSubtitle: 'Administre los embalajes vinculados a las unidades de medida registradas.',
      columns: {
        description: 'Descripción',
        size: 'Cantidad',
        measurement: 'Un. de Medida',
        actions: 'Acciones',
      },
      actions: {
        edit: 'Editar',
        delete: 'Eliminar',
      },
      deletedToast: 'Embalaje eliminado con éxito',
      empty: {
        title: 'Ningún embalaje registrado',
        description: 'Comience agregando el primer embalaje.',
      },
      emptyState: {
        titleEmpty: 'No hay embalajes registrados.',
        descriptionEmpty: 'Comience agregando el primer embalaje.',
        titleEmptyNoCreate: 'No hay embalajes disponibles.',
        descriptionEmptyNoCreate:
          'Todavía no hay embalajes registrados. Comuníquese con el administrador de la plataforma.',
        titleFiltered: 'No se encontraron embalajes.',
        descriptionFiltered: 'Intente ajustar los filtros o limpiar la búsqueda.',
        cta: 'Nuevo Embalaje',
      },
      deleteConfirm: {
        title: 'Eliminar embalaje',
        description: '¿Está seguro de que desea eliminar el embalaje',
        warning:
          'Si hay productos vinculados a este embalaje, el sistema bloqueará la eliminación.',
      },
      noFarmSelected: {
        title: 'Seleccione una finca',
        description:
          'El catálogo de Embalajes es compartido por todas las fincas del tenant, pero el acceso exige una finca activa seleccionada.',
      },
    },
    filter: {
      title: 'Filtrar embalajes',
      search: 'Buscar',
      searchPlaceholder: 'Buscar por descripción',
      measurement: 'Unidad de Medida',
      measurementAll: 'Todas',
    },
  },
};
