// src/constants/languages/languageEsEs/languageApplicationManagementReport.ts
// Traducción ES-ES del módulo "Aplicação/Manejo" (Aplicación/Manejo) — F-230,
// esteira 97-Esteiras/077, F-230-plano-front.md §5. Mirror de
// `languagePtBr/languageApplicationManagementReport.ts`.

import { ModuleApplicationManagementReport } from '@/@types/language/module-application-management-report';

export const languageApplicationManagementReport: ModuleApplicationManagementReport = {
  report: {
    pageTitle: 'Aplicación/Manejo',
    pageSubtitle: 'Insumos aplicados y mano de obra/servicios por área de la finca activa, en el período.',
    fields: {
      productionCycle: 'Ciclo de Producción',
      areas: 'Áreas',
      startDate: 'Fecha Inicio',
      endDate: 'Fecha Fin',
    },
    productionCyclePlaceholder: 'Todos los ciclos',
    areasPlaceholder: 'Todas las áreas',
    downloadPdfButton: 'Descargar PDF',
    downloadError: 'No fue posible generar el informe.',
    periodRequiredHint: 'Seleccione el período (Fecha Inicio y Fecha Fin) para generar el informe.',
    validation: {
      periodRequired: 'Informe la Fecha Inicio y la Fecha Fin.',
    },
  },
};
