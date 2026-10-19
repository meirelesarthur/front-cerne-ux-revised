// src/constants/languages/languageEsEs/languageMachinesSupplyReport.ts
// Traducción ES del módulo "Abastecimientos" (dominio Flota, F-277, esteira
// 97-Esteiras/054, TASK-054-277-FE-01). Mirror de
// `languagePtBr/languageMachinesSupplyReport.ts`.

import { ModuleMachinesSupplyReport } from '@/@types/language/module-machines-supply-report';

export const languageMachinesSupplyReport: ModuleMachinesSupplyReport = {
  report: {
    pageTitle: 'Abastecimientos',
    pageSubtitle: 'Informe de abastecimientos de máquinas de la finca activa.',
    fields: {
      equipmentIds: 'Máquinas',
      farmIds: 'Fincas',
      productIds: 'Productos',
      warehouseId: 'Almacén',
      startDate: 'Fecha Inicio',
      endDate: 'Fecha Fin',
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
    farmsErrorLabel: 'Error al cargar las fincas.',
    farmsRetryLabel: 'Intentar de nuevo',
    warehousePlaceholder: 'Seleccione el almacén',
    productsSearchPlaceholder: 'Buscar producto...',
    productsSelectAll: 'Marcar todos',
    productsDeselectAll: 'Desmarcar todos',
    productsSelectedCount: 'Productos seleccionados',
    productsEmptyLabel: 'No se encontró ningún producto.',
    downloadButton: 'Generar informe',
    downloadSuccess: 'Informe generado con éxito.',
    downloadError: 'No fue posible generar el informe.',
    validation: {
      equipmentsRequired: 'Seleccione al menos una máquina.',
      endDateBeforeStartDate: 'La Fecha Fin debe ser igual o posterior a la Fecha Inicio.',
    },
  },
};
