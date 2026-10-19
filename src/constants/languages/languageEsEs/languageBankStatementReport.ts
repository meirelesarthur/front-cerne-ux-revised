// src/constants/languages/languageEsEs/languageBankStatementReport.ts
// Traducción ES-ES del módulo "Extracto Financiero" (`bankEstatement.report`,
// informe de Financiero — F-233, esteira 97-Esteiras/079, TASK-F233-FE-01).
// Mirror de `languagePtBr/languageBankStatementReport.ts`.

import { ModuleBankStatementReport } from '@/@types/language/module-bank-statement-report';

export const languageBankStatementReport: ModuleBankStatementReport = {
  report: {
    pageTitle: 'Extracto Financiero',
    pageSubtitle: 'Informe de extracto de movimientos por cuenta, categoría y centro de costo.',
    fields: {
      account: 'Cuenta Bancaria',
      proprietary: 'Propietarios',
      costCenter: 'Centro de Costo',
      categories: 'Categorías',
      farm: 'Finca',
      condition: 'Tipo',
      startDate: 'Fecha Inicio',
      endDate: 'Fecha Fin',
    },
    accountPlaceholder: 'Seleccione la cuenta',
    proprietaryPlaceholder: 'Todos',
    costCenterPlaceholder: 'Todos',
    farmPlaceholder: 'Todas',
    condition: {
      semCategoria: 'Sin Categoría',
      comCategoria: 'Con Categoría',
    },
    downloadPdfButton: 'Descargar PDF',
    downloadExcelButton: 'Descargar Excel',
    exportFileName: 'extrato-financeiro',
    popupBlocked: 'No fue posible abrir la nueva pestaña. Verifique el bloqueador de pop-ups.',
    toasts: {
      success: 'Informe generado con éxito.',
      genericError: 'No fue posible generar el informe.',
    },
    validation: {
      accountRequired: 'La Cuenta Bancaria es obligatoria.',
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
