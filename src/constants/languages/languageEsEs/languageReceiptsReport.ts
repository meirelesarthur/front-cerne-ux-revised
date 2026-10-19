// src/constants/languages/languageEsEs/languageReceiptsReport.ts
// Traducción ES del módulo "Recebimentos" (informe de Estoque — F-305,
// esteira 97-Esteiras/074, TASK-RCB-FE-01). Mirror de
// `languagePtBr/languageReceiptsReport.ts`.

import { ModuleReceiptsReport } from '@/@types/language/module-receipts-report';

export const languageReceiptsReport: ModuleReceiptsReport = {
  report: {
    pageTitle: 'Recibos',
    pageSubtitle: 'Informe de recibos por período.',
    fields: {
      product: 'Producto',
      center: 'Centro de Costo',
      category: 'Categoría',
      startDate: 'Fecha Inicio',
      endDate: 'Fecha Fin',
      reportType: 'Tipo de Informe',
    },
    productPlaceholder: 'Todos los productos',
    centerPlaceholder: 'Todos los centros de costo',
    categoryPlaceholder: 'Todas las categorías',
    reportTypeOptions: { pdf: 'PDF', excel: 'Excel' },
    periodRequiredHint: 'Informe el período (Fecha Inicio y Fecha Fin) para generar el informe.',
    submitButton: 'Generar',
    successToast: 'Informe generado con éxito.',
    downloadError: 'No fue posible generar el informe.',
    validation: {
      periodRequired: 'El período (Fecha Inicio y Fecha Fin) es obligatorio.',
      periodOrder: 'La Fecha Fin no puede ser anterior a la Fecha Inicio.',
    },
  },
};
