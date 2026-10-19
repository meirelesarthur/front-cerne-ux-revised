// src/constants/languages/languageEsEs/languageAccountingEntries.ts
// Traducción ES del módulo "Partida Doble" (AccountingEntry — dominio
// Fiscal, F-128, 97-Esteiras/068, TASK-PD-FE-02). Espejo estructural de
// `languageDfes.ts` (mismo dominio Fiscal, módulo top-level propio). Forma
// COMPLETA requerida por `ModuleAccountingEntries` (BR/US/ES comparten la
// misma interfaz `LanguageDate`).

import { ModuleAccountingEntries } from '@/@types/language/module-accounting-entries';

export const languageAccountingEntries: ModuleAccountingEntries = {
  accountingEntry: {
    singularLabel: 'Asiento Contable',
    pluralLabel: 'Asientos Contables',

    titleModule: 'Partida Doble',
    createTitle: 'Nuevo Asiento Contable',
    editTitle: 'Editar Asiento Contable',
    viewTitle: 'Ver Asiento Contable',

    list: {
      pageTitle: 'Partida Doble',
      pageSubtitle: 'Asientos contables de la finca activa.',
      table: {
        code: 'Código',
        origin: 'Origen',
        description: 'Descripción',
        totalAmount: 'Monto Total',
        responsible: 'Responsable',
        date: 'Fecha',
      },
      emptyState: {
        titleEmpty: 'Ningún asiento contable',
        descriptionEmpty: 'Aún no has creado ningún Asiento Contable.',
        cta: 'Nuevo Asiento',
        titleFiltered: 'Ningún resultado encontrado',
        descriptionFiltered: 'Ajusta los filtros aplicados e intenta de nuevo.',
      },
      error: {
        message: 'No se pudieron cargar los asientos contables.',
        retry: 'Intentar de nuevo',
      },
      actions: {
        view: 'Ver',
        edit: 'Editar',
        delete: 'Eliminar',
      },
      deletedToast: 'Asiento Contable eliminado con éxito.',
    },

    origin: {
      administrative: 'Administrativo',
      agriculture: 'Agricultura',
      livestock: 'Ganadería',
    },

    condition: {
      debit: 'Débito',
      credit: 'Crédito',
    },

    form: {
      fields: {
        date: 'Fecha',
        description: 'Descripción',
        origin: 'Origen',
        code: 'Código',
        codePlaceholder: 'Generado automáticamente',
        author: 'Responsable',
        totalAmount: 'Monto Total',
      },
      items: {
        sectionTitle: 'Ítems del Asiento (Débito y Crédito)',
        sectionHint:
          'Cada asiento necesita al menos 1 ítem de débito y 1 de crédito, con la misma suma.',
        fields: {
          planAccount: 'Cuenta Contable',
          condition: 'Tipo',
          value: 'Monto',
        },
        addRowLabel: 'Agregar ítem',
        removeRowLabel: 'Quitar ítem',
        totalDebitLabel: 'Total Débito',
        totalCreditLabel: 'Total Crédito',
        differenceHint: 'La diferencia entre débito y crédito debe ser cero para guardar.',
      },
    },

    validation: {
      itemsMinDebit: 'Es necesario informar al menos 1 ítem de débito.',
      itemsMinCredit: 'Es necesario informar al menos 1 ítem de crédito.',
      itemsSumMismatch: 'La suma de débito debe ser igual a la suma de crédito.',
      dateRequired: 'La fecha es obligatoria.',
      descriptionRequired: 'La descripción es obligatoria.',
      originRequired: 'El origen es obligatorio.',
      planAccountRequired: 'La cuenta contable es obligatoria.',
      conditionRequired: 'El tipo (Débito/Crédito) es obligatorio.',
      valueRequired: 'El monto es obligatorio.',
      valueMin: 'El monto debe ser mayor o igual a $0.01.',
    },

    filter: {
      title: 'Filtrar Asientos Contables',
      fields: {
        code: 'Código',
        origin: 'Origen',
        description: 'Descripción',
        startDate: 'Fecha inicial',
        endDate: 'Fecha final',
        user: 'Responsable',
      },
    },

    // Informe de Partida Doble (F-257, 069, TASK-PDR-FE-03).
    report: {
      pageTitle: 'Partida Doble',
      pageSubtitle: 'Informes de la Partida Doble de la finca activa.',
      reportTypeLabel: 'Tipo de Informe',
      reportTypeOptions: {
        journal: 'Diario Contable',
        generalLedger: 'Libro Mayor',
        trialBalance: 'Balance de Comprobación',
        balanceSheet: 'Balance General (Simplificado)',
      },
      planAccountLabel: 'Cuenta Contable',
      planAccountPlaceholder: 'Todas las cuentas',
      startDate: 'Fecha Inicio',
      endDate: 'Fecha Fin',
      periodRequiredHint: 'Informe el período (Fecha Inicio y Fecha Fin) para generar el informe.',
      orderByLabel: 'Ordenar por',
      orderByOptions: {
        recent: '+ Reciente',
        oldest: '+ Antiguo',
      },
      downloadPdfButton: 'Descargar PDF',
      downloadError: 'No fue posible generar el informe.',
      validation: {
        reportTypeRequired: 'El tipo de informe es obligatorio.',
        planAccountProhibited: 'La cuenta contable no aplica al Balance General Simplificado.',
        periodRequired: 'El período (Fecha Inicio y Fecha Fin) es obligatorio.',
      },
    },
  },
};
