// src/constants/languages/languageEsEs/languageParameters.ts
// Traducción ES del módulo de PARÁMETROS (Parameter — Configuración, ejecución
// 031, TASK-FE-031-40).

import { ModuleParameters } from '@/@types/language/module-parameters';

export const languageParameters: ModuleParameters = {
  parameter: {
    singularLabel: 'Parámetro',
    pluralLabel: 'Parámetros',
    type: {
      alphanumeric: 'Alfanumérico',
      numeric: 'Numérico',
      logical: 'Lógico',
    },
    list: {
      pageTitle: 'Parámetros',
      pageSubtitle: 'Administre los parámetros técnicos globales del sistema.',
      deletedToast: 'Parámetro eliminado con éxito',
      table: {
        name: 'Nombre',
        value: 'Valor',
        type: 'Tipo',
        description: 'Descripción',
      },
      actions: {
        view: 'Ver',
        edit: 'Editar',
        delete: 'Eliminar',
      },
      reservedTooltip: 'Parámetro reservado por el sistema',
      emptyState: {
        titleEmpty: 'Ningún parámetro registrado.',
        descriptionEmpty: 'Comience agregando el primer parámetro.',
        titleEmptyNoCreate: 'Ningún parámetro registrado.',
        descriptionEmptyNoCreate: 'Todavía no se ha registrado ningún parámetro.',
        titleFiltered: 'Ningún parámetro encontrado.',
        descriptionFiltered: 'Intente ajustar los filtros o borrar la búsqueda.',
        cta: 'Nuevo Parámetro',
      },
      error: {
        message: 'No fue posible cargar los parámetros.',
        retry: 'Intentar de nuevo',
      },
    },
    filter: {
      title: 'Filtrar parámetros',
      search: 'Nombre',
      searchPlaceholder: 'Buscar por nombre',
    },
    form: {
      title: {
        create: 'Nuevo Parámetro',
        edit: 'Editar Parámetro',
      },
      subtitle: {
        create: 'Registre un nuevo parámetro técnico del sistema.',
        edit: 'Actualice los datos del parámetro.',
      },
      fields: {
        name: 'Nombre',
        value: 'Valor',
        type: 'Tipo',
        description: 'Descripción',
      },
      placeholders: {
        name: 'Ej.: CATEGF',
        value: 'Ej.: 1234',
        description: 'Ej.: Máscara de código de Categoría Financiera',
      },
      reservedNameHelper:
        'Nombre reservado por el sistema — utilizado por otros módulos, no se puede modificar.',
      validation: {
        nameMaxLength: 'El nombre debe tener como máximo 20 caracteres',
        valueMaxLength: 'El valor debe tener como máximo 255 caracteres',
        typeRequired: 'Seleccione el tipo',
        descriptionMaxLength: 'La descripción debe tener como máximo 40 caracteres',
      },
    },
    detail: {
      fields: {
        name: 'Nombre',
        value: 'Valor',
        description: 'Descripción',
        createdAt: 'Fecha de Creación',
        updatedAt: 'Fecha de Actualización',
      },
      actions: {
        edit: 'Editar',
      },
      notFound: {
        title: 'Parámetro no encontrado',
        description: 'El parámetro pudo haber sido eliminado o el enlace es incorrecto.',
        back: 'Volver al listado',
      },
    },
  },
};
