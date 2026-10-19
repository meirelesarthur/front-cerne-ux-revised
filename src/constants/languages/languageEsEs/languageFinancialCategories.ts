// src/constants/languages/languageEsEs/languageFinancialCategories.ts
// Traducción ES-ES del módulo de CATEGORÍAS FINANCIERAS (FinancialCategory —
// Registros Base / Financiero), ejecución 023.

import { ModuleFinancialCategories } from '@/@types/language/module-financial-categories';

export const languageFinancialCategories: ModuleFinancialCategories = {
  financialCategory: {
    singularLabel: 'Categoría Financiera',
    list: {
      pageTitle: 'Categorías Financieras',
      pageSubtitle: 'Administre el árbol de categorías financieras del plan de cuentas.',
      deletedToast: 'Categoría financiera eliminada con éxito',
      table: {
        code: 'Código',
        description: 'Descripción',
        typeGrouper: 'Tipo / Agrupador',
        classification: 'Clasificación',
        operations: 'Operaciones',
        status: 'Estado',
        active: 'Activo',
        inactive: 'Inactivo',
      },
      actions: {
        edit: 'Editar',
        delete: 'Eliminar',
        addChild: 'Agregar categoría hija',
        expand: 'Expandir',
        collapse: 'Contraer',
      },
      emptyState: {
        titleEmpty: 'Ninguna categoría financiera registrada.',
        descriptionEmpty: 'Comience agregando la primera categoría.',
        titleFiltered: 'Ninguna categoría financiera encontrada.',
        descriptionFiltered: 'Intente ajustar los filtros o borrar la búsqueda.',
        cta: 'Nueva categoría',
      },
      deleteConfirm: {
        title: 'Eliminar categoría financiera',
        description: '¿Está seguro de que desea eliminar la categoría',
        warning:
          'Esta acción también eliminará todas las categorías descendientes, si las hay, y no se puede deshacer.',
      },
      error: {
        message: 'No fue posible cargar las categorías financieras.',
        retry: 'Intentar de nuevo',
      },
    },
    filter: {
      title: 'Filtrar categorías financieras',
      search: 'Buscar',
      searchPlaceholder: 'Buscar por descripción o código',
      isEnabled: 'Estado',
      isEnabledAll: 'Todos',
      enabledOptions: {
        active: 'Activo',
        inactive: 'Inactivo',
      },
      classification: 'Clasificación',
      classificationAll: 'Todas',
      classificationOptions: {
        unclassified: 'No Clasificado',
        capex: 'CAPEX',
        opex: 'OPEX',
      },
    },
    form: {
      title: {
        create: 'Nueva Categoría Financiera',
        edit: 'Editar Categoría Financiera',
        createChild: 'Nueva Categoría Financiera Hija',
      },
      subtitle: {
        create: 'Registre una nueva categoría financiera en el plan de cuentas.',
        edit: 'Actualice los datos de la categoría financiera.',
        createChild: 'La nueva categoría hereda Tipo y Agrupador del grupo seleccionado.',
      },
      fields: {
        description: 'Descripción',
        isEnabled: 'Estado',
        type: 'Tipo',
        grouper: 'Agrupador',
        generatesObligationOrRight: 'Genera obligación o derecho',
        classification: 'Clasificación',
        accountingGrouper: 'Agrupador contable',
        centers: 'Centros de Costo vinculados',
        parent: 'Grupo padre',
        code: 'Código',
        class: 'Clase',
      },
      placeholders: {
        description: 'Ej.: Combustibles, Mano de obra directa',
      },
      classificationOptions: {
        unclassified: 'No Clasificado',
        capex: 'CAPEX',
        opex: 'OPEX',
      },
      classLabels: {
        synthetic: 'Sintético',
        analytical: 'Analítico',
      },
      hints: {
        codeGenerated: 'Generado automáticamente al guardar',
        classPreviewBadge: 'Vista previa',
        typeGrouperInherited: 'Heredado del grupo padre — no editable en esta categoría',
        classificationLockedSynthetic: 'Las categorías sintéticas (grupo) no tienen clasificación',
        lockedByTenantContext:
          'Bloqueado — no editable para usuarios vinculados a una granja/tenant',
      },
      parentPreview: {
        loading: 'Cargando grupo padre...',
        errorTitle: 'No fue posible cargar el grupo padre',
        errorDescription: 'Vuelva al listado e intente de nuevo desde el grupo deseado.',
      },
      centersTree: {
        expandAll: 'Expandir Todo',
        collapseAll: 'Colapsar Todo',
        selectAll: 'Marcar Todos',
        deselectAll: 'Desmarcar Todos',
        emptyGroup: 'Ningún centro de costo en este grupo',
        noCategories: 'Ningún centro de costo disponible.',
        searchPlaceholder: 'Buscar centro de costo por código o descripción',
        noResults: 'Ningún centro de costo encontrado para esta búsqueda.',
        errorLabel: 'Error al cargar centros de costo.',
        retryLabel: 'Intentar de nuevo',
      },
      validation: {
        descriptionRequired: 'La descripción es obligatoria',
        descriptionMaxLength: 'La descripción debe tener como máximo 120 caracteres',
        typeRequired: 'El tipo es obligatorio',
        grouperRequired: 'El agrupador es obligatorio',
        classificationRequired: 'La clasificación es obligatoria',
      },
    },
    report: {
      tooltip: 'Imprimir informe',
      documentTitle: 'Categorías Financieras',
      columnCode: 'Código',
      columnClass: 'Clase',
      columnType: 'Tipo',
      columnDescription: 'Descripción',
      metaCountSingular: 'categoría financiera',
      metaCountPlural: 'categorías financieras',
      errorToast: 'No fue posible generar el informe. Intente de nuevo.',
      popupBlockedToast:
        'El navegador bloqueó la ventana de impresión. Permita ventanas emergentes para este sitio e intente de nuevo.',
    },
  },
};
