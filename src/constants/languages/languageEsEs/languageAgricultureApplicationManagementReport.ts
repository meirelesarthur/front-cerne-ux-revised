// src/constants/languages/languageEsEs/languageAgricultureApplicationManagementReport.ts
// Traducción ES-ES del módulo "Aplicación/Manejo de Parcelas" (informe de
// Agricultura — F-220, ejecución 059). Mirror estructural del bloque
// `report` de
// `languageProductionCostingAreaReport.ts`/`languageStockAbcReport.ts`.

import { ModuleAgricultureApplicationManagementReport } from '@/@types/language/module-agriculture-application-management-report';

export const languageAgricultureApplicationManagementReport: ModuleAgricultureApplicationManagementReport =
  {
    report: {
      pageTitle: 'Aplicación/Manejo de Parcelas',
      pageSubtitle: 'Informe de aplicaciones y manejos por parcela, en el período seleccionado.',
      fields: {
        productionCycle: 'Ciclo de Producción',
        areas: 'Áreas',
        startDate: 'Fecha Inicial',
        endDate: 'Fecha Final',
        reportType: 'Tipo de Informe',
        group: 'Grupo',
        category: 'Categoría',
        kind: 'Clase',
        format: 'Formato',
      },
      productionCyclePlaceholder: 'Seleccione el ciclo de producción',
      areasPlaceholder: 'Seleccione las áreas',
      reportTypeOptions: {
        inputs: 'Insumos',
        services: 'Servicios',
        occurrences: 'Ocurrencias',
      },
      reportTypePlaceholder: 'Seleccione el tipo de informe',
      groupPlaceholder: 'Seleccione el grupo',
      categoryPlaceholder: 'Seleccione la categoría',
      categoryDisabledHint: 'Seleccione primero un grupo',
      kindPlaceholder: 'Seleccione la clase',
      kindDisabledHint: 'Seleccione primero una categoría',
      formatOptions: {
        pdf: 'PDF',
        xlsx: 'Excel',
      },
      downloadButton: 'Descargar Informe',
      downloadSuccess: 'Informe generado con éxito.',
      downloadError: 'No fue posible generar el informe.',
      periodRequiredHint: 'Seleccione la Fecha Inicial y la Fecha Final para generar el informe.',
      validation: {
        periodRequired: 'La fecha es obligatoria.',
      },
    },
  };
