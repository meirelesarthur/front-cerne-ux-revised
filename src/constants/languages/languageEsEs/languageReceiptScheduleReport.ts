// src/constants/languages/languageEsEs/languageReceiptScheduleReport.ts
// Traducción ES del módulo "Agenda de Cobros" (informe Financiero — F-304,
// esteira 97-Esteiras/055, TASK-055-F304-FE-01). Mirror de
// `languagePtBr/languageReceiptScheduleReport.ts`.

import { ModuleReceiptScheduleReport } from '@/@types/language/module-receipt-schedule-report';

export const languageReceiptScheduleReport: ModuleReceiptScheduleReport = {
  receiptScheduleReport: {
    singularLabel: 'Agenda de Cobros',
    pluralLabel: 'Agendas de Cobros',
  },
  report: {
    pageTitle: 'Agenda de Cobros',
    pageSubtitle: 'Informe de cuentas por cobrar por vencimiento.',
    submitButton: 'Generar informe',
    fields: {
      client: 'Cliente',
      farm: 'Finca',
      startDate: 'Fecha Inicio Venc.',
      endDate: 'Fecha Fin Venc.',
      proprietary: 'Propietario Gestor',
      costCenter: 'Centro de Costo',
      category: 'Categoría Financiera',
      format: 'Formato',
    },
    downloadSuccess: 'Informe generado con éxito.',
    downloadError: 'No fue posible generar el informe.',
    validation: {
      periodOrder: 'La fecha fin debe ser mayor o igual a la fecha inicio.',
    },
    empty: 'No se encontró ningún elemento.',
    error: 'Error al cargar la lista.',
    retry: 'Intentar de nuevo',
    searchPlaceholder: 'Buscar...',
    selectAll: 'Seleccionar todos',
    deselectAll: 'Deseleccionar todos',
  },
};
