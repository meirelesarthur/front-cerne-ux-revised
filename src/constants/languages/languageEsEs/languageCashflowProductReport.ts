// src/constants/languages/languageEsEs/languageCashflowProductReport.ts
// Traducción ES-ES del módulo "Estoque Financeiro" — F-241, esteira
// 97-Esteiras/013, TASK-013-241-FE-01. Mirror de
// `languagePtBr/languageCashflowProductReport.ts`.

import { ModuleCashflowProductReport } from '@/@types/language/module-cashflow-product-report';

export const languageCashflowProductReport: ModuleCashflowProductReport = {
  report: {
    pageTitle: 'Inventario Financiero',
    pageSubtitle: 'Informe de inventario financiero por producto y categoría financiera.',
    fields: {
      startDate: 'Fecha Inicio',
      endDate: 'Fecha Fin',
      format: 'Formato',
    },
    generateButton: 'Generar informe',
    downloadSuccess: 'Informe generado con éxito.',
    downloadError: 'No fue posible generar el informe.',
    validation: {
      periodRequired: 'El período (Fecha Inicio y Fecha Fin) es obligatorio.',
    },
  },
};
