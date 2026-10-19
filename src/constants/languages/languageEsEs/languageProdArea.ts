// src/constants/languages/languageEsEs/languageProdArea.ts
// Traducción ES del módulo "Prod./Área" (Producción por Área) — F-299,
// 97-Esteiras/012, Tarefa 47/48. Mirror de
// `languagePtBr/languageProdArea.ts`.

import { ModuleProductionAreaReport } from '@/@types/language/module-production-area-report';

export const languageProdArea: ModuleProductionAreaReport = {
  report: {
    pageTitle: 'Producción por Área',
    pageSubtitle: 'Informe de producción por área de la finca activa.',
    fields: {
      productionCycle: 'Ciclo de Producción',
      areas: 'Áreas',
      startDate: 'Fecha Inicio',
      endDate: 'Fecha Fin',
    },
    cyclePlaceholder: 'Seleccione',
    areasSearchPlaceholder: 'Buscar área',
    areasSelectAll: 'Marcar Todos',
    areasDeselectAll: 'Desmarcar Todos',
    areasSelectedCount: 'Áreas seleccionadas',
    areasHint: 'Sin selección, el informe considera todas las áreas.',
    printButton: 'Imprimir',
    downloadError: 'No fue posible generar el informe.',
    popupBlocked:
      'El navegador bloqueó la nueva pestaña. Permita las ventanas emergentes para este sitio e intente de nuevo.',
    validation: {
      periodRequired: 'El período (Fecha Inicio y Fecha Fin) es obligatorio.',
      endDateBeforeStart: 'La Fecha Fin debe ser igual o posterior a la Fecha Inicio.',
    },
  },
};
