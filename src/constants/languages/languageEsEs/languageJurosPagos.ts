// src/constants/languages/languageEsEs/languageJurosPagos.ts
// Traducción ES del módulo "Juros Pagos" (informe financiero — F-290, esteira
// 97-Esteiras/073, TASK-290-FE-02). Mirror de
// `languagePtBr/languageJurosPagos.ts`.

import { ModulePaidInterestReport } from '@/@types/language/module-paid-interest-report';

export const languageJurosPagos: ModulePaidInterestReport = {
  report: {
    pageTitle: 'Intereses Pagados',
    pageSubtitle: 'Informe de intereses pagados de la finca activa.',
    fields: {
      providers: 'Proveedor',
      proprietary: 'Propietario',
      startDate: 'Fecha Inicio',
      endDate: 'Fecha Fin',
      farm: 'Finca',
    },
    providersPlaceholder: 'Todos los proveedores',
    proprietaryPlaceholder: 'Todos los propietarios',
    farmPlaceholder: 'Todas',
    periodRequiredHint: 'Informe el período (Fecha Inicio y Fecha Fin) para generar el informe.',
    downloadPdfButton: 'Descargar PDF',
    downloadError: 'No fue posible generar el informe.',
    validation: {
      periodRequired: 'El período (Fecha Inicio y Fecha Fin) es obligatorio.',
    },
  },
};
