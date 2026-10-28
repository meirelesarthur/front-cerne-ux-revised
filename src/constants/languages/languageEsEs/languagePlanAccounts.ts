// src/constants/languages/languageEsEs/languagePlanAccounts.ts
// Traducción ES-ES del módulo de PLAN DE CUENTAS (Registros Base).

import { ModulePlanAccounts } from '@/@types/language/module-plan-accounts';

export const languagePlanAccounts: ModulePlanAccounts = {
  planAccount: {
    singularLabel: 'Cuenta Contable',
    list: {
      pageTitle: 'Plan de Cuentas',
      pageSubtitle:
        'Administre el árbol de cuentas contables utilizado en los asientos financieros.',
      deletedToast: 'Cuenta contable eliminada con éxito',
      statusUpdatedToast: 'Estado actualizado con éxito',
      table: {
        code: 'Código',
        class: 'Clase',
        condition: 'Condición',
        description: 'Descripción',
        type: 'Tipo',
        active: 'Activo',
        activeLabel: 'Activo',
        inactiveLabel: 'Inactivo',
      },
      actions: {
        edit: 'Editar',
        viewSubaccounts: 'Ver subcuentas',
        createDescendant: 'Crear descendiente',
        deactivate: 'Inactivar',
        activate: 'Activar',
        delete: 'Eliminar',
      },
      emptyState: {
        titleEmpty: 'Su granja todavía no tiene un plan de cuentas propio.',
        descriptionEmpty:
          'Todavía no se registró ninguna cuenta contable para este tenant. Comience agregando la primera.',
        titleEmptyNoCreate: 'Ninguna cuenta contable disponible.',
        descriptionEmptyNoCreate:
          'Todavía no hay cuentas contables vinculadas a su granja. Comuníquese con el administrador de la plataforma.',
        titleFiltered: 'Ninguna cuenta encontrada.',
        descriptionFiltered: 'Intente ajustar los filtros o borrar la búsqueda.',
        cta: 'Nueva Cuenta',
      },
      helpButton: 'Saber más',
      helpTitle: 'Plan de Cuentas',
      helpIntro:
        'El plan de cuentas organiza los asientos financieros de la granja en una estructura jerárquica. Conozca los conceptos principales de esta pantalla:',
      helpItems: {
        synthetic: {
          term: 'Cuenta Sintética:',
          description:
            'agrupa otras cuentas (tiene subcuentas) y sirve para totalizar valores — no recibe asientos directamente.',
        },
        analytical: {
          term: 'Cuenta Analítica:',
          description:
            'es la cuenta final de la jerarquía (sin subcuentas) — es en ella donde se registran los asientos financieros.',
        },
        condition: {
          term: 'Condición:',
          description:
            'define la naturaleza contable de la cuenta — Deudora, Acreedora o Ambos, utilizada en los informes financieros.',
        },
        deactivate: {
          term: 'Inactivar:',
          description:
            'oculta la cuenta de nuevos asientos sin eliminarla — el historial ya registrado permanece intacto y la cuenta puede reactivarse en cualquier momento.',
        },
      },
      helpUnderstood: 'Entendido',
    },
    filter: {
      title: 'Filtrar plan de cuentas',
      search: 'Buscar',
      searchPlaceholder: 'Buscar por código o descripción',
      condition: 'Condición',
      conditionAll: 'Todas',
      conditionOptions: {
        debtor: 'Deudor',
        creditor: 'Acreedor',
        both: 'Ambos',
      },
      class: 'Clase',
      classAll: 'Todas',
      classOptions: {
        synthetic: 'Sintético',
        analytical: 'Analítico',
      },
      type: 'Tipo',
      typeAll: 'Todos',
      typeOptions: {
        capex: 'CAPEX',
        opex: 'OPEX',
      },
      isEnabled: 'Estado',
      isEnabledAll: 'Todos',
      enabledOptions: {
        active: 'Activo',
        inactive: 'Inactivo',
      },
      parentUuid: 'Cuenta padre',
      parentUuidPlaceholder: 'Buscar por código o descripción',
    },
    form: {
      title: {
        create: 'Nueva Cuenta Contable',
        edit: 'Editar Cuenta Contable',
        createDescendant: 'Nueva Subcuenta',
      },
      subtitle: {
        create: 'Registre una nueva cuenta en el plan de cuentas.',
        edit: 'Actualice los datos de la cuenta contable.',
        createDescendant: 'La nueva cuenta se vinculará como subcuenta de la cuenta seleccionada.',
      },
      sectionAccount: 'Datos de la cuenta',
      fields: {
        description: 'Descripción',
        condition: 'Condición',
        isEnabled: 'Activo',
        type: 'Tipo',
        parentUuid: 'Cuenta padre',
        code: 'Código',
        class: 'Clase',
        categories: 'Categorías Financieras',
      },
      placeholders: {
        description: 'Ingrese la descripción de la cuenta',
        parentUuid: 'Buscar por código o descripción',
        categoriesSearch: 'Buscar categoría financiera por código o descripción',
      },
      hints: {
        parentUuidImmutable: 'La cuenta padre no se puede cambiar después de la creación.',
        parentUuidCreate:
          'Esta cuenta se creará como raíz. Para crear subcuentas, use "Crear descendiente" en el listado.',
        parentUuidFixedDescendant: 'Cuenta padre fijada — esta cuenta se creará como su subcuenta.',
        codeGenerated: 'Generado automáticamente',
        classPreviewBadge: 'vista previa',
      },
      classLabels: {
        synthetic: 'Sintético',
        analytical: 'Analítico',
      },
      categories: {
        empty: 'Ninguna categoría financiera vinculada.',
        removeLabel: 'Eliminar categoría',
      },
      categoriesTree: {
        expandAll: 'Expandir Todo',
        collapseAll: 'Contraer Todo',
        selectAll: 'Marcar Todos',
        deselectAll: 'Desmarcar Todos',
        emptyGroup: 'Ninguna categoría en este grupo',
        noCategories: 'No hay categorías financieras disponibles.',
      },
      parentPreview: {
        loading: 'Cargando cuenta padre...',
        errorTitle: 'No se pudo cargar la cuenta padre.',
        errorDescription: 'Verifique si el registro todavía existe e intente nuevamente.',
      },
      validation: {
        descriptionRequired: 'La descripción es obligatoria.',
        descriptionMaxLength: 'La descripción debe tener como máximo 150 caracteres.',
        conditionRequired: 'La condición es obligatoria.',
      },
    },
    excel: {
      downloadTemplate: 'Descargar modelo',
      export: 'Exportar',
      downloadTemplateError: 'No se pudo descargar el modelo. Intente nuevamente.',
      exportError: 'No se pudieron exportar los datos. Intente nuevamente.',
      import: {
        menuLabel: 'Importar',
        title: 'Importar Plan de Cuentas',
        subtitle:
          'Descargue el modelo, complételo y envíe la planilla para sincronizar el plan de cuentas.',
        instructions:
          'Las columnas Código, Descripción, Condición y Clase son obligatorias en cada fila. La jerarquía se define por los segmentos del propio Código (ej.: 1.1 es subcuenta de 1) — la cuenta padre ya debe existir o estar en una fila anterior de la misma planilla.',
        warning: {
          title: 'Eliminación segura de las cuentas ausentes',
          description:
            'Las cuentas ausentes de esta planilla serán eliminadas — excepto las que ya tienen movimientos, categorías o subcuentas vinculadas, que serán preservadas y listadas al final de la importación.',
        },
        downloadShortcut: 'Descargar modelo',
        fileUpload: {
          label: 'Planilla completada',
          hint: 'Envíe el archivo .xlsx completado a partir del modelo descargado.',
          dropzoneTitle: 'Arrastre la planilla o haga clic para seleccionar',
          dropzoneDraggingTitle: 'Suelte la planilla aquí',
          changeLabel: 'Cambiar archivo',
          removeLabel: 'Eliminar archivo',
          errorTypeMessage: 'Formato no aceptado. Envíe un archivo .xlsx.',
          errorSizeMessage: 'El archivo excede el tamaño máximo de 10MB.',
        },
        cancelButton: 'Cancelar',
        submitButton: 'Importar',
        importSuccessToast: 'Importación del plan de cuentas completada con éxito.',
        result: {
          created: 'Creadas',
          updated: 'Actualizadas',
          deleted: 'Eliminadas',
          preservedTitle: '{count} cuenta(s) preservada(s) — ya están en uso',
        },
        rowErrors: {
          title: 'No se pudo importar — corrija las filas a continuación y envíe nuevamente',
        },
        closeButton: 'Cerrar',
      },
    },
    report: {
      tooltip: 'Imprimir informe',
      documentTitle: 'Plan de Cuentas',
      metaCountSingular: 'cuenta contable',
      metaCountPlural: 'cuentas contables',
      errorToast: 'No se pudo generar el informe. Intente nuevamente.',
      popupBlockedToast:
        'El navegador bloqueó la ventana de impresión. Habilite las ventanas emergentes para este sitio e intente nuevamente.',
    },
  },
};
