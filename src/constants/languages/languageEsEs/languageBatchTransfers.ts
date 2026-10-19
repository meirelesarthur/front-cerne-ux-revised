// src/constants/languages/languageEsEs/languageBatchTransfers.ts
// Traducción ES del módulo TRANSFERENCIA ANIMALES/LOTE (Operacional >
// Pecuaria > Transferencias, feature `426be835`). Namespace `batchTransfers`
// — LIBRE, sin colisión con `batches` (módulo de Lotes).

import { ModuleBatchTransfers } from '@/@types/language/module-batch-transfers';

export const languageBatchTransfers: ModuleBatchTransfers = {
  batchTransfer: {
    singularLabel: 'Transferencia de Lote',
    pluralLabel: 'Transferencias de Lote',
    list: {
      pageTitle: 'Transferencia Animales/Lote',
      pageSubtitle: 'Animales activos elegibles para transferencia entre lotes.',
      totalCountLabel: 'Cantidad',
      newTransference: 'Nueva Transferencia',
      table: {
        type: 'Tipo',
        identification: 'Identificación',
        age: 'Edad',
        category: 'Categoría',
        batch: 'Lote',
      },
      typeOptions: {
        batch: 'Lote',
        individual: 'Individual',
      },
      emptyState: {
        title: 'Ningún registro.',
        description: 'No se encontró ningún animal elegible para transferencia.',
      },
      error: {
        title: 'No fue posible cargar los datos.',
        retry: 'Intentar nuevamente',
      },
    },
    filter: {
      title: 'Filtrar animales elegibles',
      category: 'Categoría',
      batch: 'Lote',
      identification: 'Identificación',
      identificationHint:
        'La búsqueda considera el código exacto — no localiza por parte del texto.',
    },
    form: {
      title: { create: 'Nueva Transferencia' },
      subtitle: { create: 'Transfiera animales de un lote a otro.' },
      fields: {
        code: 'Código',
        date: 'Fecha',
        user: 'Responsable',
        batchFilter: 'Lote',
        category: 'Categoría',
        minWeight: 'Peso mín.',
        maxWeight: 'Peso máx.',
        newBatch: 'Nuevo Lote',
      },
      placeholders: {
        minWeight: '350,00',
        maxWeight: '520,00',
        batchFilter: 'Seleccione el lote de origen',
        category: 'Seleccione las categorías',
        newBatch: 'Seleccione el lote de destino',
      },
      validation: {
        dateRequired: 'La fecha es obligatoria.',
        newBatchRequired: 'El nuevo lote es obligatorio.',
        atLeastOneAnimal: 'Seleccione al menos un animal para realizar la transferencia.',
      },
      warnings: {
        maxWeightLessThanMin: 'El peso máximo debe ser mayor que el mínimo.',
        minWeightGreaterThanMax: 'El peso mínimo debe ser menor que el máximo.',
        weighingWarning:
          'Algunos de los animales seleccionados pueden no tener una pesaje registrado para la fecha de la transferencia — si alguno no lo tiene, la transferencia fallará al guardar.',
      },
      candidateAnimals: {
        selectAllLabel: 'Marcar todos',
        deselectAllLabel: 'Desmarcar todos',
        totalAnimalsLabel: 'Total Animales',
        emptyLabelBatch: '¡El lote seleccionado no posee animales!',
        emptyLabelCategory: '¡Las categorías seleccionadas no poseen animales!',
        errorLabel: 'Error al cargar los animales.',
        retryLabel: 'Intentar nuevamente',
        searchPlaceholder: 'Buscar por identificación',
      },
      footer: {
        total: 'Total',
        weight: 'Peso',
        averageWeight: 'Peso Promedio',
        totalUa: 'Total de UA',
        averageUa: 'UA Promedio',
      },
      toasts: {
        success: 'Transferencia realizada con éxito.',
      },
    },
  },
};
