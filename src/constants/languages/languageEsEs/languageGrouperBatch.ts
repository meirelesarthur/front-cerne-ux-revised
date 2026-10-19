// src/constants/languages/languageEsEs/languageGrouperBatch.ts
// Traducción ES-ES del módulo Agrupar/Lotes (GrouperBatch, ejecución 042,
// TASK-FE-042-301). Mismo conjunto de claves que PT-BR/EN-US.

import { ModuleGrouperBatch } from '@/@types/language/module-grouper-batch';

export const languageGrouperBatch: ModuleGrouperBatch = {
  grouperBatch: {
    singularLabel: 'Lote',
    pluralLabel: 'Lotes',
    list: {
      pageTitle: 'Agrupar Lotes',
      pageSubtitle: 'Seleccione 2 o más lotes activos para agrupar en un lote principal.',
      table: {
        code: 'Código',
        description: 'Descripción',
        totalAnimals: 'Total de Animales',
      },
      emptyState: {
        titleEmpty: 'Ningún lote activo registrado.',
        titleFiltered: 'Ningún resultado encontrado.',
        descriptionEmpty: 'Empiece agregando el primer lote.',
        descriptionFiltered: 'Intente ajustar o quitar los filtros actuales.',
        cta: 'Nuevo Lote',
      },
      filter: {
        title: 'Filtrar Lotes',
        search: 'Buscar por descripción',
      },
    },
    group: {
      buttonLabel: 'Agrupar',
      selectAtLeastTwoAlert: 'Seleccione al menos 2 lotes para agrupar.',
      alertTitle: 'Agrupar Lotes',
      modalTitle: 'Agrupar Lotes',
      modalPrimaryLabel: 'Seleccione el lote que será el principal.',
      columns: {
        code: 'Código',
        description: 'Descripción',
        totalAnimals: 'Total de Animales',
      },
      cancelButton: 'Cancelar',
      confirmButton: 'Agrupar',
      successToast: 'Lotes agrupados con éxito',
      previewErrorTitle: 'Agrupar Lotes',
      previewErrorToast: 'No fue posible cargar los lotes seleccionados.',
    },
    newBatch: {
      title: 'Nuevo Lote',
      fields: {
        date: 'Fecha',
        parameterWeight: 'Peso',
        specie: 'Especie',
        categories: 'Categorías',
        description: 'Descripción',
      },
      cancelButton: 'Cancelar',
      submitButton: 'Guardar',
      createdToast: 'Lote creado con éxito',
    },
  },
};
