// src/constants/languages/languageEsEs/languageMachinesMaintenanceReport.ts
// Traducción ES-ES del módulo "Mantenimientos" (informe de Flota — F-276,
// esteira 97-Esteiras/078, TASK-F276-F01). Mirror de
// `languagePtBr/languageMachinesMaintenanceReport.ts`.

import { ModuleMachinesMaintenanceReport } from '@/@types/language/module-machines-maintenance-report';

export const languageMachinesMaintenanceReport: ModuleMachinesMaintenanceReport = {
  report: {
    pageTitle: 'Mantenimientos',
    pageSubtitle: 'Informe de mantenimientos de máquinas de la finca activa.',
    fields: {
      equipmentIds: 'Máquinas',
      farmIds: 'Fincas',
      warehouse: 'Almacén',
      product: 'Producto',
      startDate: 'Fecha Inicio',
      endDate: 'Fecha Fin',
    },
    equipmentsSearchPlaceholder: 'Buscar máquina...',
    equipmentsSelectAll: 'Marcar todos',
    equipmentsDeselectAll: 'Desmarcar todos',
    equipmentsSelectedCount: 'Máquinas seleccionadas',
    equipmentsEmptyLabel: 'Ninguna máquina encontrada.',
    equipmentsErrorLabel: 'Error al cargar las máquinas.',
    equipmentsRetryLabel: 'Intentar de nuevo',
    farmsSearchPlaceholder: 'Buscar finca...',
    farmsSelectAll: 'Marcar todas',
    farmsDeselectAll: 'Desmarcar todas',
    farmsSelectedCount: 'Fincas seleccionadas',
    farmsEmptyLabel: 'Ninguna finca encontrada.',
    farmsErrorLabel: 'Error al cargar las fincas.',
    farmsRetryLabel: 'Intentar de nuevo',
    warehousePlaceholder: 'Todos',
    productPlaceholder: 'Seleccione',
    downloadPdfButton: 'Descargar PDF',
    downloadExcelButton: 'Descargar Excel',
    exportFileName: 'relatorio_manutencoes',
    popupBlocked: 'No fue posible abrir la nueva pestaña. Verifique el bloqueador de pop-ups.',
    toasts: {
      success: 'Informe generado con éxito.',
      genericError: 'No fue posible generar el informe.',
    },
    validation: {
      periodRequired: 'El período (Fecha Inicio y Fecha Fin) es obligatorio.',
      endDateAfterStartDate: 'La Fecha Fin debe ser igual o posterior a la Fecha Inicio.',
      equipmentRequired: 'Seleccione al menos una máquina.',
    },
  },
};
