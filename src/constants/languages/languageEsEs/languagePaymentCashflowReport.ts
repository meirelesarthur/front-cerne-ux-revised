// src/constants/languages/languageEsEs/languagePaymentCashflowReport.ts
// Traducción ES-ES del módulo "Flujo Mensual de Pago"
// (`payment-cashflow.report`, informe de Financiero — F-293, esteira
// 97-Esteiras/078, TASK-F293-F01). Mirror de
// `languagePtBr/languagePaymentCashflowReport.ts`.

import { ModulePaymentCashflowReport } from '@/@types/language/module-payment-cashflow-report';

export const languagePaymentCashflowReport: ModulePaymentCashflowReport = {
  report: {
    pageTitle: 'Flujo Mensual de Pago',
    pageSubtitle: 'Informe de flujo de pagos por cuenta, categoría y centro de costo.',
    fields: {
      accounts: 'Cuentas',
      categories: 'Categorías',
      proprietary: 'Propietarios',
      costCenter: 'Centro de Costo',
      farm: 'Finca',
      startDate: 'Fecha Inicio',
      endDate: 'Fecha Fin',
    },
    proprietaryPlaceholder: 'Todos',
    costCenterPlaceholder: 'Todos',
    farmPlaceholder: 'Todas',
    downloadPdfButton: 'Descargar PDF',
    downloadExcelButton: 'Descargar Excel',
    exportFileName: 'fluxo-mensal-pagamento',
    popupBlocked: 'No fue posible abrir la nueva pestaña. Verifique el bloqueador de pop-ups.',
    toasts: {
      success: 'Informe generado con éxito.',
      genericError: 'No fue posible generar el informe.',
    },
    validation: {
      periodRequired: 'El período (Fecha Inicio y Fecha Fin) es obligatorio.',
      endDateAfterStartDate: 'La Fecha Fin debe ser igual o posterior a la Fecha Inicio.',
    },
    checkbox: {
      selectAll: 'Marcar todos',
      deselectAll: 'Desmarcar todos',
      selectedCount: 'seleccionados',
      empty: 'Ningún registro encontrado.',
      error: 'Error al cargar los registros.',
      retry: 'Intentar de nuevo',
      searchPlaceholder: 'Buscar...',
    },
  },
};
