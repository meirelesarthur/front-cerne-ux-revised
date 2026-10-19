// src/constants/languages/languageEsEs/languageAnimalsSaleReport.ts
// Traducción ES del módulo "Ventas/Animales" (dominio Pecuária, F-227,
// esteira 97-Esteiras/077). Mirror de
// `languagePtBr/languageAnimalsSaleReport.ts`.

import { ModuleAnimalsSaleReport } from '@/@types/language/module-animals-sale-report';

export const languageAnimalsSaleReport: ModuleAnimalsSaleReport = {
  report: {
    pageTitle: 'Ventas/Animales',
    pageSubtitle: 'Informe de ventas de animales de la finca activa, agrupado por venta.',
    fields: {
      sale: 'Venta',
      batch: 'Lote',
      client: 'Cliente',
      startDate: 'Fecha Inicio',
      endDate: 'Fecha Fin',
      format: 'Formato',
    },
    salePlaceholder: 'Todas las ventas',
    batchPlaceholder: 'Todos los lotes',
    clientPlaceholder: 'Todos los clientes',
    formatOptions: {
      pdf: 'PDF',
      excel: 'Excel',
    },
    downloadButton: 'Generar informe',
    downloadSuccess: 'Informe generado con éxito.',
    downloadError: 'No fue posible generar el informe.',
    validation: {
      endDateBeforeStartDate: 'La Fecha Fin debe ser igual o posterior a la Fecha Inicio.',
    },
  },
};
