// src/constants/languages/languageEsEs/languageHerdCompositionReport.ts
// Traducción ES-ES del módulo "Composição Rebanho" (Composición del Rebaño) —
// F-269, lote 079. Mirror de
// `languagePtBr/languageHerdCompositionReport.ts`.

import { ModuleHerdCompositionReport } from '@/@types/language/module-herd-composition-report';

export const languageHerdCompositionReport: ModuleHerdCompositionReport = {
  report: {
    pageTitle: 'Composición del Rebaño',
    pageSubtitle:
      'Informe de composición del rebaño de la finca activa, con filtros, columnas y ordenación configurables.',
    fields: {
      batch: 'Lote',
      gender: 'Sexo',
      breed: 'Raza',
      category: 'Categoría',
      startDate: 'Fecha Inicio Entrada',
      endDate: 'Fecha Fin Entrada',
      weightMin: 'Peso Actual Mínimo (kg)',
      weightMax: 'Peso Actual Máximo (kg)',
      status: 'Estado',
      order: 'Ordenar por',
      orderDirection: 'Dirección',
      format: 'Formato',
    },
    batchPlaceholder: 'Seleccione el lote',
    breedPlaceholder: 'Seleccione la raza',
    categoryPlaceholder: 'Seleccione la categoría',
    genderPlaceholder: 'Seleccione el sexo',
    statusPlaceholder: 'Seleccione el estado',
    columnsFieldLabel: 'Columnas del Informe',
    columnsSearchPlaceholder: 'Buscar columna...',
    columnsEmptyMessage: 'Ninguna columna encontrada.',
    selectAll: 'Marcar todos',
    deselectAll: 'Desmarcar todos',
    downloadButton: 'Descargar informe',
    downloadSuccess: 'Informe generado con éxito.',
    downloadError: 'No fue posible generar el informe.',
    columns: {
      identification: 'Identificación',
      father: 'Reproductor',
      category_description: 'Categoría',
      breed_description: 'Raza',
      batch: 'Lote',
      farm: 'Finca',
      gender: 'Sexo',
      birth_date: 'Fecha de Nacimiento',
      age: 'Edad (años)',
      weight: 'Peso Actual (kg)',
      start_weight: 'Peso Inicial (kg)',
      last_weighing: 'Fecha Última Pesaje',
      gmd: 'GMD (kg/día)',
      nutrition: 'Nutricional',
      sanitary_total: 'Sanitario (R$)',
      status: 'Estado',
      entry_date: 'Fecha de Entrada',
      note: 'Observación',
    },
    orderOptions: {
      identification: 'Identificación',
      category_description: 'Categoría',
      breed_description: 'Raza',
      gender: 'Sexo',
      birth_date: 'Fecha de Nacimiento',
      weight: 'Peso Actual (kg)',
      last_weighing: 'Fecha Última Pesaje',
      gmd: 'GMD (kg/día)',
      status: 'Estado',
      entry_date: 'Fecha de Entrada',
    },
    orderDirectionOptions: {
      asc: 'Ascendente',
      desc: 'Descendente',
    },
    formatOptions: {
      pdf: 'PDF',
      excel: 'Excel',
    },
    validation: {
      invalidDateRange: 'La Fecha Fin debe ser igual o posterior a la Fecha Inicio.',
      invalidValue: 'Valor inválido.',
      columnsRequired: 'Seleccione al menos una columna.',
    },
  },
};
