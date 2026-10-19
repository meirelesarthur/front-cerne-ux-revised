// src/constants/languages/languageEsEs/languageSaleEmployeeReport.ts
// Traducción ES-ES del módulo "Vendas/Funcionário" (Ventas/Empleado) — F-314,
// esteira 079. Mirror de `languagePtBr/languageSaleEmployeeReport.ts`.

import { ModuleSaleEmployeeReport } from '@/@types/language/module-sale-employee-report';

export const languageSaleEmployeeReport: ModuleSaleEmployeeReport = {
  report: {
    pageTitle: 'Ventas/Empleado',
    pageSubtitle: 'Informe de ventas agrupado por empleado.',
    fields: {
      startDate: 'Fecha Inicio',
      endDate: 'Fecha Fin',
      user: 'Empleado',
      type: 'Tipo',
    },
    userPlaceholder: 'Seleccione el empleado',
    typeOptions: {
      pdf: 'PDF',
      excel: 'Excel',
    },
    downloadButton: 'Descargar Informe',
    downloadError: 'No fue posible generar el informe.',
    downloadSuccess: 'Informe generado con éxito.',
    periodRequiredHint: 'Informe el período (Fecha Inicio y Fecha Fin) para generar el informe.',
    validation: {
      startDateRequired: 'La fecha de inicio es obligatoria.',
      endDateRequired: 'La fecha de fin es obligatoria.',
      endDateAfterStartDate: 'La fecha de fin debe ser mayor o igual a la fecha de inicio.',
    },
  },
};
