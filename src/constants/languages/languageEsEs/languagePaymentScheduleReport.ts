// src/constants/languages/languageEsEs/languagePaymentScheduleReport.ts
// Traducción ES-ES del módulo "Agenda/Pagos" (informe Financiero — F-294,
// ejecución 059). Mirror estructural del bloque `report` de
// `languageReceiptScheduleReport.ts` (F-304).

import { ModulePaymentScheduleReport } from '@/@types/language/module-payment-schedule-report';

export const languagePaymentScheduleReport: ModulePaymentScheduleReport = {
  paymentScheduleReport: {
    singularLabel: 'Agenda de Pago',
    pluralLabel: 'Agenda de Pagos',
  },
  report: {
    pageTitle: 'Agenda/Pagos',
    pageSubtitle: 'Informe de agenda de pagos, por período, estado y demás filtros.',
    submitButton: 'Generar Informe',
    fields: {
      number: 'Número',
      farm: 'Finca',
      startDate: 'Fecha Inicial',
      endDate: 'Fecha Final',
      proprietary: 'Propietario',
      status: 'Estado',
      costCenter: 'Centro de Costo',
      category: 'Categoría',
      format: 'Formato',
    },
    statusOptions: {
      dueSoon: 'Por vencer',
      overdue: 'Vencido',
      partial: 'Parcial',
      settled: 'Liquidado',
    },
    downloadSuccess: 'Informe generado con éxito.',
    downloadError: 'No fue posible generar el informe.',
    validation: {
      periodOrder: 'La Fecha Final debe ser igual o posterior a la Fecha Inicial.',
    },
    empty: 'No se encontraron categorías.',
    error: 'No fue posible cargar las categorías.',
    retry: 'Intentar de nuevo',
    searchPlaceholder: 'Buscar categoría...',
    selectAll: 'Seleccionar todos',
    deselectAll: 'Quitar selección',
  },
};
