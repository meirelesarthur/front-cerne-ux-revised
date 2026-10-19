// src/constants/languages/languageEsEs/languageSupplyStatusSlaReport.ts
// Traducción al español del módulo "Informe SLA" (SupplyStatusSlaReport —
// Administrativo / Suministros, TASK-SLA-FE-01, esteira 97-Esteiras/037). Ver
// `@/@types/language/module-supply-status-sla-report` para el contrato completo.

import { ModuleSupplyStatusSlaReport } from '@/@types/language/module-supply-status-sla-report';

export const languageSupplyStatusSlaReport: ModuleSupplyStatusSlaReport = {
  titleModule: 'Informe SLA',
  pageTitle: 'Informe SLA',
  pageSubtitle:
    'Filtre por una solicitud de compra o por un intervalo de fechas y genere el informe SLA (.xlsx).',
  filter: {
    uuid: 'Solicitud de compra',
    uuidPlaceholder: 'Buscar por código...',
    startDate: 'Desde',
    endDate: 'Hasta',
    status: 'Estado',
    statusPlaceholder: 'Todos los estados',
    generateButton: 'Generar',
    noTriggerHint:
      'Seleccione una solicitud de compra o complete las dos fechas para generar el informe.',
  },
  validation: {
    dateRangeRequired: 'Complete las dos fechas — desde y hasta.',
  },
  toasts: {
    generating: 'Generando informe...',
    success: 'Informe generado con éxito.',
    noDataError: 'Ninguna solicitud de compra encontrada con los filtros informados.',
    slaConfigMissingError:
      'Configure el parámetro de SLA para todos los estados antes de generar el informe.',
    noActiveFarmError: 'Ninguna finca activa en el contexto de la solicitud.',
  },
};
