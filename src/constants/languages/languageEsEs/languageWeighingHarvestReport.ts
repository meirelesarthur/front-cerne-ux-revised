// src/constants/languages/languageEsEs/languageWeighingHarvestReport.ts
// Traducción ES del módulo "Pesajes/Cosecha" (informe de Agricultura, F-335,
// esteira 053, TASK-053-335-FE-01). Mirror de
// `languagePtBr/languageWeighingHarvestReport.ts`.

import { ModuleWeighingHarvestReport } from '@/@types/language/module-weighing-harvest-report';

export const languageWeighingHarvestReport: ModuleWeighingHarvestReport = {
  report: {
    pageTitle: 'Pesajes/Cosecha',
    pageSubtitle: 'Informe de pesajes de la cosecha de la finca activa.',
    fields: {
      startDate: 'Fecha Inicial',
      endDate: 'Fecha Final',
      product: 'Producto',
      area: 'Área',
      warehouse: 'Almacén',
      client: 'Cliente',
      type: 'Tipo de Pesaje',
      format: 'Formato',
    },
    productPlaceholder: 'Todos los productos',
    areaPlaceholder: 'Todas las áreas',
    warehousePlaceholder: 'Todos los almacenes',
    clientPlaceholder: 'Todos los clientes',
    typePlaceholder: 'Todos los tipos',
    periodRequiredHint: 'Informe el período (Fecha Inicial y Fecha Final) para generar el informe.',
    downloadButton: 'Generar informe',
    downloadSuccess: 'Informe generado con éxito.',
    downloadError: 'No fue posible generar el informe.',
    validation: {
      periodRequired: 'El período (Fecha Inicial y Fecha Final) es obligatorio.',
    },
  },
};
