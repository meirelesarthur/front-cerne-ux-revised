// src/constants/languages/languageEsEs/languageLoggedHoursReport.ts
// Traducción ES-ES del módulo "Horas Registradas" (informe de Gestión de
// Personal — F-275, 97-Esteiras/012, Tarea 47 + corrección post-QA-manual).
// Espejo estructural del bloque `report` de `languageCustoProducao.ts`, sin
// drill-down y sin vista previa/grilla en pantalla.

import { ModuleLoggedHoursReport } from '@/@types/language/module-logged-hours-report';

export const languageLoggedHoursReport: ModuleLoggedHoursReport = {
  report: {
    pageTitle: 'Horas Registradas',
    pageSubtitle: 'Tiempo de sesión de los usuarios, agrupado por contratante y finca.',
    fields: {
      startDate: 'Fecha Inicio',
      endDate: 'Fecha Fin',
      tenant: 'Contratante',
      farm: 'Finca',
    },
    tenantPlaceholder: 'Seleccione el contratante',
    farmPlaceholder: 'Todas',
    filtersSectionTitle: 'Filtros',
    downloadPdfButton: 'Generar PDF',
    downloadError: 'No fue posible generar el informe.',
    popupBlocked:
      'El navegador bloqueó la nueva pestaña. Permita las ventanas emergentes para este sitio e intente de nuevo.',
    validation: {
      periodRequired: 'El período (Fecha Inicio y Fecha Fin) es obligatorio.',
      endDateBeforeStartDate: 'La Fecha Fin debe ser igual o posterior a la Fecha Inicio.',
    },
  },
};
