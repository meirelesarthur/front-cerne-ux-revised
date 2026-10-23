// src/constants/languages/languageEsEs/languageMovements.ts
// Traducción ES-ES del módulo "Mov. Caja/Bancario" (Movement — Financiero,
// TASK-MV-FE-01). Mirror de languagePtBr/languageMovements.ts. Título de
// pantalla replica el rótulo ya fijado en `languageSidebar.ts` (ítem
// `fin-cai`, "Mov. Caja / Bancario").

import { ModuleMovements } from '@/@types/language/module-movements';

export const languageMovements: ModuleMovements = {
  movement: {
    singularLabel: 'Movimiento',
    pluralLabel: 'Movimientos',
    list: {
      pageTitle: 'Mov. Caja/Bancario',
      pageSubtitle: 'Administre los movimientos de caja y bancarios.',
      deletedToast: 'Movimiento eliminado con éxito',
      table: {
        code: 'Código',
        date: 'Fecha',
        type: 'Tipo',
        typeCategory: 'Tp. Categoría',
        account: 'Cuenta',
        proprietary: 'Propietario',
        value: 'Valor',
        totalAllocated: 'Total Prorrateado',
        interest: 'Intereses',
      },
      actions: {
        edit: 'Editar',
        allocation: 'Editar Prorrateo',
        delete: 'Eliminar',
        viewOpeningBalance: 'Ver en Saldo Inicial',
      },
      footer: {
        pageTotal: 'Total de la página',
      },
      emptyState: {
        titleEmpty: 'Ningún movimiento registrado.',
        descriptionEmpty: 'Comience agregando el primer movimiento.',
        titleFiltered: 'Ningún movimiento encontrado.',
        descriptionFiltered: 'Intente ajustar los filtros o borrar la búsqueda.',
        cta: 'Nuevo Movimiento',
      },
      deleteConfirm: {
        title: 'Eliminar movimiento',
        description: '¿Está seguro de que desea eliminar este movimiento',
        cascadeTitle: 'Eliminar movimiento con obligaciones generadas',
        cascadeDescription:
          'Este movimiento generó {count} obligación(es) de Cuentas por Pagar/Cobrar. Si continúa, esas obligaciones y sus bajas también serán eliminadas.',
        cascadeConfirm: 'Eliminar de todos modos',
      },
    },
    filter: {
      title: 'Filtrar Movimientos',
      startDate: 'Fecha Inicio',
      endDate: 'Fecha Fin',
      account: 'Cuenta',
      accountPlaceholder: 'Buscar cuenta',
      proprietary: 'Propietario',
      proprietaryPlaceholder: 'Buscar propietario',
      type: 'Tipo',
      category: 'Categoría',
      categoryPlaceholder: 'Buscar categoría',
      harvest: 'Cosecha',
      harvestPlaceholder: 'Buscar cosecha',
      categoryType: 'Filtro Tipo Cat.',
      categoryTypePlaceholder: 'Seleccione el tipo de categoría',
      categoryDisabledHint: 'Seleccione primero el tipo de categoría',
      valueMin: 'Valor mín.',
      valueMax: 'Valor máx.',
    },
    form: {
      title: { create: 'Nuevo Movimiento', edit: 'Editar Movimiento' },
      subtitle: {
        create: 'Registre un nuevo movimiento de caja/bancario.',
        edit: 'Modifique los datos del movimiento de caja/bancario.',
      },
      fields: {
        date: 'Fecha Movimiento',
        type: 'Tipo',
        typeCategory: 'Tp. Categoría',
        account: 'Cuenta',
        destinationAccount: 'Cuenta Destino',
        originAccount: 'Cuenta Origen',
        farm: 'Finca',
        proprietary: 'Propietario',
        client: 'Cliente',
        provider: 'Proveedor',
        value: 'Valor R$',
        interest: 'Interés R$',
        document: 'Documento',
        note: 'Historial',
        // TASK-MV-FE-09 (Ajuste 6) — traducción mecánica de los rótulos
        // exigidos por el task-packet (texto exacto del legado: "Dedutível"
        // / "Gera Obrigação").
        fiscalDocument: 'Deducible',
        generatesObligation: 'Genera Obligación',
      },
      placeholders: {
        account: 'Buscar cuenta',
        destinationAccount: 'Buscar cuenta destino',
        originAccount: 'Buscar cuenta origen',
        farm: 'Buscar finca',
        proprietary: 'Buscar propietario',
        client: 'Buscar cliente',
        provider: 'Buscar proveedor',
        document: 'Número del documento',
        note: 'Observación sobre el movimiento',
      },
      // TASK-MV-FE-11 — botón crear/editar Cliente al lado del Select.
      // TASK-MV-FE-13 — botón crear/editar Fornecedor al lado del Select.
      actions: {
        addClientAria: 'Registrar nuevo cliente',
        editClientAria: 'Editar cliente seleccionado',
        addProviderAria: 'Registrar nuevo proveedor',
        editProviderAria: 'Editar proveedor seleccionado',
      },
      // TASK-MV-FE-09 (Ajustes 4/7) — tooltips de ayuda al lado del label.
      hints: {
        documentTooltip:
          'Identificación del documento que se está registrando\nEjemplo: Recibo, Factura, etc...',
        fiscalDocumentTooltip:
          'Indica si este documento fiscal puede utilizarse para deducción de tributos.',
      },
      typeOptions: {
        income: 'Entrada',
        expense: 'Salida',
      },
      typeCategoryOptions: {
        income: 'Entrada',
        expense: 'Salida',
        transfer: 'Transf. Interna',
        financing: 'Financiamiento/Préstamo',
        initialBalance: 'Saldo Inicial',
      },
      allocations: {
        sectionTitle: 'Prorrateo',
        sectionHint: 'Distribuya el valor del movimiento entre categoría y centro de costo.',
        sumLabel: 'Total prorrateado',
        remainingLabel: 'Faltan',
        overLabel: 'Excede',
        balancedLabel: 'Cuadrado',
        sumHint: 'la suma difiere del valor informado',
        emptyTitle: 'Ningún ítem de prorrateo agregado. Agregue al menos un ítem.',
        addRowLabel: 'Agregar Prorrateo',
        removeRowLabel: 'Eliminar prorrateo',
        fields: {
          category: 'Categoría',
          center: 'Centro de Costo',
          planAccount: 'Cuenta Contable',
          harvest: 'Cosecha',
          value: 'Valor',
          percent: 'Porcentaje',
        },
        placeholders: {
          category: 'Buscar categoría',
          center: 'Buscar centro de costo',
          planAccount: 'Buscar cuenta contable',
          harvest: 'Buscar cosecha',
        },
        reports: {
          categoryTooltip: 'Imprimir informe de Categorías Financieras',
          planAccountTooltip: 'Imprimir informe de Plan de Cuentas',
          allocationTooltip: 'Imprimir prorrateo actual',
          allocationDocumentTitle: 'Prorrateo del Movimiento',
          allocationColumnCategory: 'Categoría',
          allocationColumnPlanAccount: 'Cuenta Contable',
          allocationColumnCenter: 'Centro de Costo',
          allocationColumnValue: 'Valor',
          allocationColumnPercent: 'Porcentaje',
          allocationTotalLabel: 'Total',
          allocationPlanAccountEmpty: '—',
          errorToast: 'No fue posible generar el informe. Intente de nuevo.',
          popupBlockedToast:
            'El navegador bloqueó la ventana de impresión. Permita ventanas emergentes para este sitio e intente de nuevo.',
        },
      },
      validation: {
        dateRequired: 'Informe la fecha del movimiento.',
        typeRequired: 'Seleccione el tipo.',
        typeCategoryRequired: 'Seleccione la categoría del tipo.',
        accountRequired: 'Seleccione la cuenta.',
        destinationAccountRequired: 'Seleccione la cuenta destino.',
        proprietaryRequired: 'Seleccione el propietario.',
        valueRequired: 'Informe el valor.',
        valueNotZero: 'El valor del movimiento no puede ser 0.',
        documentMaxLength: 'Máximo 100 caracteres.',
        noteMaxLength: 'Máximo 600 caracteres.',
        allocationsMinLength: 'Agregue al menos un ítem de prorrateo.',
        allocationCategoryRequired: 'Seleccione la categoría.',
        allocationCenterRequired: 'Seleccione el centro de costo.',
        allocationValueRequired: 'Informe el valor del ítem.',
        allocationValueMin: 'El valor del ítem debe ser mayor que cero.',
        // TASK-MV-FE-08 (Ajuste 2) — traducción mecánica del texto pt-BR
        // exigido por el task-packet (clave legado 'total_rateio').
        allocationsSumMismatch: 'El total del prorrateo difiere del valor total del título.',
      },
      openingBalanceNotice:
        'Movimiento de Saldo Inicial: edítelo en Cadastros Base > Saldo Inicial.',
      cascadeSave: {
        title: 'Guardar movimiento con obligaciones generadas',
        description:
          'Este movimiento generó {count} obligación(es) de Cuentas por Pagar/Cobrar. Si guarda, esas obligaciones y sus bajas serán eliminadas y, si corresponde, se generará un nuevo borrador.',
        confirm: 'Guardar de todos modos',
      },
      obligationDraftGenerated: {
        title: 'Obligación financiera generada',
        ofxNotice:
          'Este movimiento generó un borrador de obligación financiera. Para generar la obligación en Cuentas por Pagar/Cobrar, edite el movimiento en Mov. Caja/Bancario y guárdelo de nuevo.',
        navigating: 'Movimiento guardado. Complete la obligación para vincular el financiamiento.',
        noPermission:
          'Movimiento guardado. No tiene permiso para crear la obligación; pida a alguien con acceso a Cuentas por Pagar/Cobrar.',
      },
    },
    allocation: {
      title: 'Editar Prorrateo',
      subtitle: 'Ajuste la distribución del prorrateo de este movimiento.',
      headerValueLabel: 'Valor neto del movimiento',
      toastSuccess: 'Prorrateo actualizado con éxito',
    },
  },
};
