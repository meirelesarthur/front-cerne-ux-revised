// src/constants/languages/languageEsEs/languageMachinesReport.ts
// Traducción ES del módulo "Máquinas" (dominio Flota, F-278, esteira
// 97-Esteiras/052, TASK-052-278-FE-01). Mirror de
// `languagePtBr/languageMachinesReport.ts`.

import { ModuleMachinesReport } from '@/@types/language/module-machines-report';

export const languageMachinesReport: ModuleMachinesReport = {
  report: {
    pageTitle: 'Máquinas',
    pageSubtitle: 'Informe de mantenimientos de máquinas de la finca activa.',
    fields: {
      equipmentIds: 'Máquinas',
      farmIds: 'Fincas',
      startDate: 'Fecha Inicio',
      endDate: 'Fecha Fin',
      maintenanceType: 'Tipo de Ejecutor',
      maintenanceExecutor: 'Ejecutor',
      format: 'Formato',
    },
    equipmentsSearchPlaceholder: 'Buscar máquina...',
    equipmentsSelectAll: 'Marcar todas',
    equipmentsDeselectAll: 'Desmarcar todas',
    equipmentsSelectedCount: 'Máquinas seleccionadas',
    equipmentsEmptyLabel: 'No se encontró ninguna máquina.',
    equipmentsErrorLabel: 'Error al cargar las máquinas.',
    equipmentsRetryLabel: 'Intentar de nuevo',
    farmsSearchPlaceholder: 'Buscar finca...',
    farmsSelectAll: 'Marcar todas',
    farmsDeselectAll: 'Desmarcar todas',
    farmsSelectedCount: 'Fincas seleccionadas',
    farmsEmptyLabel: 'No se encontró ninguna finca.',
    maintenanceExecutorPlaceholder: 'Seleccione el ejecutor',
    maintenanceTypeOptions: {
      employee: 'Empleado',
      provider: 'Proveedor',
    },
    downloadButton: 'Generar informe',
    downloadSuccess: 'Informe generado con éxito.',
    downloadError: 'No fue posible generar el informe.',
    validation: {
      equipmentsRequired: 'Seleccione al menos una máquina.',
      endDateBeforeStartDate: 'La Fecha Fin debe ser igual o posterior a la Fecha Inicio.',
    },
  },
};
