// src/constants/languages/languageEsEs/languageParameterAnimal.ts
// Traducción ES-ES del módulo de PARÁMETROS ANIMALES (Cadastros Base / Pecuaria).
// Fundación de la regeneración de las pantallas (TASK-FE-1074) — mirror
// `languageCausaMortePerda`. Rótulos de campo fieles al contrato v1.1 §2
// ("Área de Alimentación (cm³)", "Consumo de Agua (L)", "Consumo de MS (Kg)",
// "Peso Medio (Kg)").

import { ModuleParameterAnimals } from '@/@types/language/module-parameter-animals';

export const languageParameterAnimal: ModuleParameterAnimals = {
  parameterAnimal: {
    singularLabel: 'Parámetro Animal',
    pluralLabel: 'Parámetros Animales',
    list: {
      pageTitle: 'Parámetros Animales',
      pageSubtitle:
        'Administre los parámetros nutricionales de referencia por categoría de animal.',
      deletedToast: 'Parámetro animal eliminado con éxito',
      table: {
        code: 'Código',
        description: 'Descripción',
        category: 'Categoría',
        employee: 'Encargado',
        averageWeight: 'Peso Medio',
      },
      actions: {
        edit: 'Editar parámetro animal',
        delete: 'Eliminar parámetro animal',
      },
      emptyState: {
        titleEmpty: 'Ningún parámetro animal registrado.',
        titleFiltered: 'Ningún resultado encontrado.',
        titleEmptyNoCreate: 'Ningún parámetro animal disponible.',
        descriptionEmpty: 'Comience agregando el primer parámetro animal.',
        descriptionFiltered: 'Intente ajustar o quitar los filtros actuales.',
        descriptionEmptyNoCreate:
          'Aún no hay parámetros animales registrados. Póngase en contacto con el administrador de la plataforma.',
        cta: 'Nuevo Parámetro Animal',
      },
      deleteConfirm: {
        title: 'Eliminar parámetro animal',
        description: '¿Está seguro de que desea eliminar el parámetro animal',
        warning: 'Esta eliminación es definitiva y no se puede deshacer.',
      },
    },
    filter: {
      title: 'Filtrar Parámetros Animales',
      description: 'Buscar por descripción',
    },
    form: {
      title: {
        create: 'Nuevo Parámetro Animal',
        edit: 'Editar Parámetro Animal',
      },
      subtitle: {
        create: 'Registre un nuevo parámetro nutricional de referencia.',
        edit: 'Actualice los datos del parámetro animal.',
      },
      fields: {
        code: 'Código',
        description: 'Descripción',
        employee: 'Responsable',
        specie: 'Especie',
        category: 'Categoría',
        feedingArea: 'Área de Alimentación (cm³)',
        waterConsumption: 'Consumo de Agua (L)',
        msConsumption: 'Consumo de MS (Kg)',
        averageWeight: 'Peso Medio (Kg)',
      },
      placeholders: {
        description: 'Ej.: Terneros de recría',
        employee: 'Buscar por nombre',
        specie: 'Seleccione la especie',
        category: 'Buscar por descripción',
        feedingArea: '0,00',
        waterConsumption: '0,00',
        msConsumption: '0,00',
        averageWeight: '0,00',
      },
      hints: {
        specieRequired: 'Seleccione la especie para habilitar la Categoría.',
      },
      warnings: {
        categoryClearedBySpecieChange:
          'La categoría seleccionada fue eliminada porque no pertenece a la nueva especie.',
      },
      validation: {
        descriptionRequired: 'La descripción es obligatoria',
        descriptionMaxLength: 'La descripción debe tener como máximo 255 caracteres',
        employeeRequired: 'Seleccione un responsable',
        specieRequired: 'Seleccione una especie',
        categoryRequired: 'Seleccione una categoría',
        feedingAreaRequired: 'El área de alimentación es obligatoria',
        waterConsumptionRequired: 'El consumo de agua es obligatorio',
        msConsumptionRequired: 'El consumo de MS es obligatorio',
        averageWeightRequired: 'El peso medio es obligatorio',
      },
    },
  },
};
