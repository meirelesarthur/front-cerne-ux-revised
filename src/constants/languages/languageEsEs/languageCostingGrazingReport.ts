// src/constants/languages/languageEsEs/languageCostingGrazingReport.ts
// Traducción ES del módulo "Custeio/Módulo" (informe de costeo de Módulo de
// Pastoreo — F-250, esteira 97-Esteiras/080, TASK-CM-FE-01). Mirror de
// `languagePtBr/languageCostingGrazingReport.ts`.

import { ModuleCostingGrazingReport } from '@/@types/language/module-costing-grazing-report';

export const languageCostingGrazingReport: ModuleCostingGrazingReport = {
  report: {
    pageTitle: 'Costeo/Módulo',
    pageSubtitle: 'Informe de costeo de un módulo de pastoreo por período.',
    fields: {
      grazings: 'Módulo',
      startDate: 'Fecha Inicial',
      endDate: 'Fecha Final',
    },
    grazingsPlaceholder: 'Seleccione el/los módulo(s) (opcional)',
    periodRequiredHint: 'Informe el período (Fecha Inicial y Fecha Final) para generar el informe.',
    exportPdfButton: 'Descargar PDF',
    exportXlsxButton: 'Descargar Excel',
    successToast: 'Informe generado con éxito.',
    downloadError: 'No fue posible generar el informe.',
    validation: {
      periodRequired: 'El período (Fecha Inicial y Fecha Final) es obligatorio.',
      formInvalid: 'Corrija los campos destacados antes de continuar.',
    },
  },
};
