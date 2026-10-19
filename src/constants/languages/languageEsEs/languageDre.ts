// src/constants/languages/languageEsEs/languageDre.ts
// Traducción ES del módulo "DRE" (dominio Financiero, F-259, esteira
// 97-Esteiras/049, TASK-DRE-FE-01). Mirror de `languagePtBr/languageDre.ts`.

import { ModuleDre } from '@/@types/language/module-dre';

export const languageDre: ModuleDre = {
  report: {
    pageTitle: 'DRE',
    pageSubtitle: 'Estado de Resultados de la finca activa.',
    fields: {
      typeReport: 'Visión',
      startDate: 'Fecha Inicio',
      endDate: 'Fecha Fin',
      centerId: 'Centro de Costo',
    },
    typeReportOptions: {
      synthetic: 'Sintético',
      analytical: 'Analítico',
    },
    centerIdPlaceholder: 'Todos los centros de costo',
    periodRequiredHint: 'Informe el período (Fecha Inicio y Fecha Fin) para generar el informe.',
    downloadPdfButton: 'Descargar PDF',
    downloadError: 'No fue posible generar el informe.',
    validation: {
      typeReportRequired: 'La visión (Sintético/Analítico) es obligatoria.',
      periodRequired: 'El período (Fecha Inicio y Fecha Fin) es obligatorio.',
    },
  },
};
