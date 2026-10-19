// src/constants/languages/languageEsEs/languageCostCenters.ts
// Traducción ES-ES del módulo de CENTROS DE COSTO (Registros Base).

import { ModuleCostCenters } from '@/@types/language/module-cost-centers';

export const languageCostCenters: ModuleCostCenters = {
  costCenter: {
    singularLabel: 'Centro de Costo',
    list: {
      pageTitle: 'Centros de Costo',
      pageSubtitle: 'Administre los centros de costo utilizados para imputar ingresos y gastos.',
      deletedToast: 'Centro de costo eliminado con éxito',
      table: {
        code: 'Código',
        class: 'Clase',
        condition: 'Condición',
        description: 'Descripción',
        active: 'Activo',
        activeLabel: 'Activo',
        inactiveLabel: 'Inactivo',
      },
      actions: {
        view: 'Visualizar',
        createDescendant: 'Registrar descendiente',
        edit: 'Editar',
        delete: 'Eliminar',
      },
      emptyState: {
        titleEmpty: 'Ningún centro de costo registrado.',
        descriptionEmpty: 'Comience agregando el primer centro de costo.',
        titleEmptyNoCreate: 'Ningún centro de costo disponible.',
        descriptionEmptyNoCreate:
          'Todavía no hay centros de costo vinculados a su cuenta. Comuníquese con el administrador de la plataforma.',
        titleFiltered: 'Ningún centro de costo encontrado.',
        descriptionFiltered: 'Intente ajustar los filtros o borrar la búsqueda.',
        cta: 'Agregar Centro',
      },
    },
    filter: {
      title: 'Filtrar centros de costo',
      search: 'Buscar',
      searchPlaceholder: 'Buscar por código o descripción',
      type: 'Tipo',
      typeAll: 'Todos',
      typeOptions: {
        productive: 'Productivo',
        apportioned: 'Prorrateado',
      },
      isEnabled: 'Estado',
      isEnabledAll: 'Todos',
      enabledOptions: {
        active: 'Activo',
        inactive: 'Inactivo',
      },
    },
    form: {
      title: {
        create: 'Nuevo Centro de Costo',
        edit: 'Editar Centro de Costo',
        createDescendant: 'Nuevo Centro de Costo (Descendiente)',
      },
      subtitle: {
        create: 'Registre un nuevo centro de costo para imputar ingresos y gastos.',
        edit: 'Actualice los datos del centro de costo.',
        createDescendant:
          'Registre un centro de costo analítico vinculado al antecesor seleccionado.',
      },
      fields: {
        description: 'Descripción',
        condition: 'Condición',
        isEnabled: 'Activo',
        allowPointing: 'Apunte',
        type: 'Tipo',
        parentUuid: 'Antecesor',
        code: 'Código',
        class: 'Clase',
        categories: 'Categorías Financieras',
      },
      placeholders: {
        description: 'Ej.: Administración de la Sede',
        parentUuid: 'Buscar por código o descripción',
      },
      hints: {
        parentUuidImmutable: 'El antecesor no se puede cambiar después de la creación.',
        parentUuidCreate:
          'Seleccionar un antecesor convierte este centro en Analítico; déjelo en blanco para un centro raíz (Sintético).',
        parentUuidFixedDescendant:
          'Este centro será un descendiente directo del antecesor seleccionado — el vínculo no se puede modificar.',
        codeGenerated: 'Generado automáticamente al guardar',
        classPreviewBadge: 'Vista previa',
      },
      conditionOptions: {
        expense: 'Gasto',
        revenue: 'Ingreso',
        both: 'Ambos',
      },
      classLabels: {
        synthetic: 'Sintético',
        analytical: 'Analítico',
      },
      categoriesTree: {
        expandAll: 'Expandir Todo',
        collapseAll: 'Colapsar Todo',
        selectAll: 'Marcar Todos',
        deselectAll: 'Desmarcar Todos',
        emptyGroup: 'Ninguna categoría en este grupo',
        noCategories: 'Ninguna categoría financiera disponible.',
        searchPlaceholder: 'Buscar categoría por código o descripción',
        noResults: 'Ninguna categoría encontrada para esta búsqueda.',
      },
      apportionments: {
        sectionTitle: 'Prorrateo',
        sectionHint:
          'Distribuya el porcentaje entre los centros de costo. La suma no necesita llegar a 100% para guardar, pero recomendamos ajustarla a 100%.',
        addRowLabel: 'Agregar línea',
        removeRowLabel: 'Eliminar línea',
        emptyTitle: 'Ningún prorrateo agregado.',
        fields: {
          costCenter: 'Centro de costo',
          percentage: 'Porcentaje (%)',
        },
        placeholders: {
          costCenter: 'Buscar por código o descripción',
        },
        sumLabel: 'Suma actual',
        sumHint: 'se recomienda 100%',
      },
      parentPreview: {
        loading: 'Cargando antecesor…',
        errorTitle: 'No fue posible cargar el centro de costo antecesor.',
        errorDescription: 'Verifique si todavía existe y está vinculado a su tenant.',
      },
      validation: {
        descriptionRequired: 'La descripción es obligatoria',
        descriptionMaxLength: 'La descripción debe tener como máximo 40 caracteres',
        conditionRequired: 'Seleccione una condición',
        apportionmentsRequired: 'Agregue al menos un prorrateo para el tipo Prorrateado',
        apportionmentCostCenterRequired: 'Seleccione el centro de costo del prorrateo',
        apportionmentPercentageRequired: 'Indique el porcentaje del prorrateo',
        apportionmentPercentageRange: 'El porcentaje debe estar entre 0 y 100',
      },
    },
    detail: {
      actions: {
        edit: 'Editar',
      },
      generalData: {
        title: 'Datos Generales',
      },
      categories: {
        title: 'Categorías Financieras vinculadas',
        empty: 'Ninguna categoría financiera vinculada.',
      },
      apportionments: {
        title: 'Prorrateo',
      },
      notFound: {
        title: 'Centro de costo no encontrado.',
        description: 'Verifique si todavía existe y está vinculado a su cuenta.',
        back: 'Volver al listado',
      },
    },
  },
};
