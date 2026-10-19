// src/constants/languages/languageEsEs/languageCostCenterReport.ts
// Traducción ES-ES del módulo "Centro de Costo" — F-247, esteira
// 97-Esteiras/052, TASK-052-247-FE-02. Mirror de
// `languagePtBr/languageCostCenterReport.ts`.

import { ModuleCostCenterReport } from '@/@types/language/module-cost-center-report';

export const languageCostCenterReport: ModuleCostCenterReport = {
  report: {
    pageTitle: 'Centro de Costo',
    pageSubtitle: 'Informe de resultado agrupado por Centro de Costo.',
    fields: {
      regime: 'Régimen',
      startDate: 'Fecha Inicio',
      endDate: 'Fecha Fin',
      accounts: 'Cuentas',
      proprietary: 'Propietario',
      costCenter: 'Centro de Costo',
      farm: 'Finca',
    },
    regimePlaceholder: 'Seleccione el régimen',
    proprietaryPlaceholder: 'Todos los propietarios',
    costCenterPlaceholder: 'Todos los centros de costo',
    farmPlaceholder: 'Todas',
    regimeOptions: {
      cash: 'Caja',
      accrual: 'Devengo',
    },
    downloadPdfButton: 'Descargar PDF',
    downloadExcelButton: 'Descargar Excel',
    downloadSuccess: 'Informe generado con éxito.',
    downloadError: 'No fue posible generar el informe.',
    previewError: 'No fue posible cargar la vista previa del informe.',
    retryButton: 'Intentar de nuevo',
    emptyBeforeFilter:
      'Informe el régimen y el período (Fecha Inicio y Fecha Fin) para ver la vista previa.',
    emptyReport: 'No se encontró información.',
    validation: {
      periodRequired: 'El período (Fecha Inicio y Fecha Fin) es obligatorio.',
    },
  },
};
