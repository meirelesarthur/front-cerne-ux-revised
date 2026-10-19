// src/constants/languages/languageEsEs/languageFinancialBudgetPlanning.ts
// Traducción ES-ES de la feature "Prev. Orçamentária" (Previsión
// Presupuestaria Anual, BudgetPlanning — F-106, esteira 97-Esteiras/067,
// TASK-PO-FE-02). Compuesto dentro de `languageFinancial.ts` (clave
// `financial.budgetPlanning`, mirror `expense`/`mercadoPago`/`ofxImport`/
// `financialFreeze`) — ver
// `@/@types/language/module-financial/budget-planning.d.ts` para el tipo.

import type { BudgetPlanningLanguage } from '@/@types/language/module-financial/budget-planning';

export const languageFinancialBudgetPlanning: BudgetPlanningLanguage = {
  singularLabel: 'Previsión Presupuestaria',
  pluralLabel: 'Previsiones Presupuestarias',
  titleModule: 'Prev. Presupuestaria',
  createTitle: 'Nueva Previsión Presupuestaria',
  editTitle: 'Editar Previsión Presupuestaria',
  viewTitle: 'Visualizar Previsión Presupuestaria',

  list: {
    table: {
      code: 'Código',
      date: 'Fecha',
      year: 'Año',
      responsavel: 'Responsable',
      actions: 'Acciones',
    },
    emptyState: {
      title: 'No se encontró ninguna previsión presupuestaria.',
    },
    error: {
      message: 'No fue posible cargar las previsiones presupuestarias.',
      retry: 'Intentar nuevamente',
    },
    filter: {
      yearLabel: 'Año',
      filterButton: 'Filtrar',
      clearButton: 'Limpiar',
    },
  },

  form: {
    fields: {
      dateLabel: 'Fecha',
      yearLabel: 'Año',
      codePlaceholder: 'Generado automáticamente',
      authorLabel: 'Responsable',
    },
    grid: {
      categoryColumn: 'Categoría',
      lastYearValueColumn: 'Valor Año Anterior',
      totalYearColumn: 'Total Año',
      totalMonthRow: 'Total',
      totalGeneral: 'Total General',
      emptyEligible: 'No se encontró ninguna categoría elegible para la grilla.',
      error: {
        message: 'No fue posible cargar las categorías elegibles para la grilla.',
        retry: 'Intentar nuevamente',
      },
    },
    validation: {
      dateRequired: 'La fecha es obligatoria.',
      yearRequired: 'El año es obligatorio.',
      categoriesRequired: 'Informe al menos 1 valor en la grilla.',
    },
  },

  import: {
    menuLabel: 'Importar',
    title: 'Importar Previsión Presupuestaria',
    subtitle: 'Envíe una planilla (.xlsx) con la grilla mensual de categorías ya completada.',
    yearLabel: 'Año',
    yearRequired: 'El año es obligatorio.',
    fileRequired: 'Seleccione un archivo .xlsx.',
    downloadShortcut: 'Descargar modelo',
    downloadTemplateError: 'No fue posible descargar el modelo.',
    fileUpload: {
      label: 'Archivo (.xlsx)',
      hint: 'Envíe la planilla completada (.xlsx, hasta 10MB).',
      dropzoneTitle: 'Arrastre un archivo o haga clic para seleccionar',
      dropzoneDraggingTitle: 'Suelte el archivo aquí',
      changeLabel: 'Cambiar archivo',
      removeLabel: 'Eliminar archivo',
      errorTypeMessage: 'Tipo de archivo no aceptado (use .xlsx).',
      errorSizeMessage: 'El archivo excede el tamaño máximo (10MB).',
    },
    rowErrors: {
      title: 'Corrija las líneas abajo e intente nuevamente:',
    },
    cancelButton: 'Cancelar',
    submitButton: 'Importar',
    success: 'Previsión presupuestaria importada con éxito.',
  },

  predictedReport: {
    title: 'Previsto × Realizado Anual',
    subtitle:
      'Genere el informe comparando los valores previstos y los realizados en el año seleccionado.',
    menuLabel: 'Informe Previsto × Realizado',
    yearLabel: 'Año',
    yearRequired: 'El año es obligatorio.',
    typeLabel: 'Formato',
    typeRequired: 'El formato es obligatorio.',
    typePdf: 'PDF',
    typeXlsx: 'Excel',
    farmLabel: 'Finca',
    submitButton: 'Generar informe',
    success: 'Informe generado con éxito.',
    genericError: 'No fue posible generar el informe.',
  },

  actions: {
    view: 'Visualizar',
    edit: 'Editar',
    delete: 'Eliminar',
    export: 'Exportar',
  },

  toasts: {
    createSuccess: 'Previsión presupuestaria creada con éxito.',
    updateSuccess: 'Previsión presupuestaria actualizada con éxito.',
    deleteSuccess: 'Previsión presupuestaria eliminada con éxito.',
  },
};
