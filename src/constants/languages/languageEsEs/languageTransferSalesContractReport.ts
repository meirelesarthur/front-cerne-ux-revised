// src/constants/languages/languageEsEs/languageTransferSalesContractReport.ts
// Traducción ES del módulo "Romaneo/Ventas/Contrato" (informe de Agricultura,
// F-331, 97-Esteiras/008, TASK-RVC-FE-01). Mirror de
// `languagePtBr/languageTransferSalesContractReport.ts`.

import { ModuleTransferSalesContractReport } from '@/@types/language/module-transfer-sales-contract-report';

export const languageTransferSalesContractReport: ModuleTransferSalesContractReport = {
  report: {
    pageTitle: 'Romaneo/Ventas/Contrato',
    pageSubtitle: 'Informe de ítems de romaneo por venta/contrato en el período.',
    fields: {
      startDate: 'Fecha Inicial',
      endDate: 'Fecha Final',
      client: 'Cliente',
      type: 'Tipo',
      product: 'Producto',
      contract: 'Número de Contrato',
      format: 'Formato',
    },
    clientPlaceholder: 'Todos los clientes',
    typePlaceholder: 'Todos los tipos',
    productPlaceholder: 'Todos los productos',
    contractPlaceholder: 'Todos los contratos',
    periodRequiredHint: 'Informe el período (Fecha Inicial y Fecha Final) para generar el informe.',
    submitButton: 'Generar informe',
    downloadSuccess: 'Informe generado con éxito.',
    downloadError: 'No fue posible generar el informe.',
    validation: {
      startDateRequired: 'La Fecha Inicial es obligatoria.',
      endDateRequired: 'La Fecha Final es obligatoria.',
      endDateAfterStartDate: 'La Fecha Final debe ser igual o posterior a la Fecha Inicial.',
    },
  },
};
