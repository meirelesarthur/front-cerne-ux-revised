// src/constants/languages/languageEsEs/languageCategoryAnimalReport.ts
// Traducción ES del módulo "Estq. Animais/Categoria" (dominio Pecuária,
// F-242, esteira 97-Esteiras/077). Mirror de
// `languagePtBr/languageCategoryAnimalReport.ts`.

import { ModuleCategoryAnimalReport } from '@/@types/language/module-category-animal-report';

export const languageCategoryAnimalReport: ModuleCategoryAnimalReport = {
  report: {
    pageTitle: 'Estoque Animales/Categoría',
    pageSubtitle: 'Estoque de animales activos de la finca activa agrupado por categoría.',
    fields: {
      category: 'Categoría',
      batch: 'Lote',
      harvest: 'Zafra',
      format: 'Formato',
    },
    categoryPlaceholder: 'Todas las categorías',
    batchPlaceholder: 'Todos los lotes',
    harvestPlaceholder: 'Todas las zafras',
    formatOptions: {
      pdf: 'PDF',
      excel: 'Excel',
    },
    downloadButton: 'Generar informe',
    downloadSuccess: 'Informe generado con éxito.',
    downloadError: 'No fue posible generar el informe.',
  },
};
