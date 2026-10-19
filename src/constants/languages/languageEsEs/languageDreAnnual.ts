// src/constants/languages/languageEsEs/languageDreAnnual.ts
// Traducción ES del módulo "DRE Anual" (dominio Financiero, F-258, esteira
// 97-Esteiras/049, TASK-DRE-FE-03). Mirror de `languageDre.ts` (pantalla
// hermana) — solo cambia la forma del filtro de período (año).

import { ModuleDreAnnual } from '@/@types/language/module-dre-annual';

export const languageDreAnnual: ModuleDreAnnual = {
  report: {
    pageTitle: 'DRE Anual',
    pageSubtitle: 'Estado de Resultados anual de la finca activa.',
    fields: {
      typeReport: 'Visión',
      startYear: 'Año Inicio',
      endYear: 'Año Fin',
      centerId: 'Centro de Costo',
    },
    typeReportOptions: {
      synthetic: 'Sintético',
      analytical: 'Analítico',
    },
    centerIdPlaceholder: 'Todos los centros de costo',
    yearRangeRequiredHint: 'Informe el período (Año Inicio y Año Fin) para generar el informe.',
    downloadPdfButton: 'Descargar PDF',
    downloadError: 'No fue posible generar el informe.',
    validation: {
      typeReportRequired: 'La visión (Sintético/Analítico) es obligatoria.',
      yearRangeRequired: 'El período (Año Inicio y Año Fin) es obligatorio.',
    },
  },
};
