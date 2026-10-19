// src/constants/languages/languageEsEs/languageCausaMortePerda.ts
// Traducción ES-ES del módulo de CAUSA DE MUERTE/PÉRDIDA (Registros Base / Pecuaria).

import { ModuleDeathLosses } from '@/@types/language/module-death-losses';

export const languageCausaMortePerda: ModuleDeathLosses = {
  deathLoss: {
    singularLabel: 'Causa de Muerte/Pérdida',
    list: {
      pageTitle: 'Causa Muerte/Pérdida',
      pageSubtitle:
        'Administre las causas de muerte y pérdida vinculadas a las especies registradas.',
      deletedToast: 'Causa de muerte/pérdida eliminada con éxito',
      table: {
        description: 'Descripción',
        cause: 'Causa',
        specie: 'Especie',
        active: 'Activo',
        activeLabel: 'Activo',
        inactiveLabel: 'Inactivo',
      },
      actions: {
        edit: 'Editar',
        delete: 'Eliminar',
      },
      emptyState: {
        titleEmpty: 'Ninguna causa de muerte/pérdida registrada.',
        descriptionEmpty: 'Comience agregando la primera causa de muerte/pérdida.',
        titleEmptyNoCreate: 'Ninguna causa de muerte/pérdida disponible.',
        descriptionEmptyNoCreate:
          'Todavía no hay causas de muerte/pérdida registradas. Comuníquese con el administrador de la plataforma.',
        cta: 'Nueva Causa de Muerte/Pérdida',
      },
      deleteConfirm: {
        title: 'Eliminar causa de muerte/pérdida',
        description: '¿Está seguro de que desea eliminar la causa de muerte/pérdida',
        warning:
          'Esta acción no se puede deshacer. Una causa de muerte/pérdida con registros vinculados no puede eliminarse; desactívela.',
      },
    },
    form: {
      title: {
        create: 'Nueva Causa de Muerte/Pérdida',
        edit: 'Editar Causa de Muerte/Pérdida',
      },
      subtitle: {
        create: 'Registre una nueva causa de muerte/pérdida vinculada a una especie.',
        edit: 'Actualice los datos de la causa de muerte/pérdida.',
      },
      fields: {
        description: 'Descripción',
        cause: 'Causa',
        isEnabled: 'Activo',
        specie: 'Especie',
        causeOptions: {
          death: 'Muerte',
          loss: 'Pérdida',
        },
      },
      placeholders: {
        description: 'Ej.: Rabia',
        cause: 'Seleccione la causa',
        specie: 'Buscar por descripción',
      },
      hints: {
        specieRequired: 'La especie es obligatoria.',
      },
      validation: {
        descriptionRequired: 'La descripción es obligatoria',
        descriptionMaxLength: 'La descripción debe tener como máximo 191 caracteres',
        specieRequired: 'Seleccione una especie',
        causeRequired: 'Seleccione una causa',
      },
    },
  },
};
