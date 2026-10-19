// src/constants/languages/languageEsEs/languageCostingLivestockAreaReport.ts
// Traducción ES-ES del módulo "Custeio/Área Pecuária" (Costeo de Área
// Ganadera) — F-251, CusteioAreaPecuaria-contrato-api.md, lote 076. Mirror
// de `languagePtBr/languageCostingLivestockAreaReport.ts`.

import { ModuleCostingLivestockAreaReport } from '@/@types/language/module-costing-livestock-area-report';

export const languageCostingLivestockAreaReport: ModuleCostingLivestockAreaReport = {
  report: {
    pageTitle: 'Costeo/Área Ganadera',
    pageSubtitle: 'Informe de costeo agrupado por área de pastoreo.',
    fields: {
      productionCycle: 'Ciclo de Producción',
      areas: 'Área',
      grazings: 'Módulo de Pastoreo',
      startDate: 'Fecha Inicio',
      endDate: 'Fecha Fin',
    },
    productionCyclePlaceholder: 'Seleccione el ciclo de producción',
    areasPlaceholder: 'Seleccione las áreas',
    grazingsPlaceholder: 'Seleccione los módulos de pastoreo',
    downloadPdfButton: 'Descargar PDF',
    downloadError: 'No fue posible generar el informe.',
    periodRequiredHint: 'Informe el período (Fecha Inicio y Fecha Fin) para generar el informe.',
    validation: {
      periodRequired: 'El período (Fecha Inicio y Fecha Fin) es obligatorio.',
    },
  },
};
