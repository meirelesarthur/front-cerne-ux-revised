// src/constants/languages/languageEsEs/languageLedgerReport.ts
// Traducción ES-ES del módulo "Libro Mayor" — F-274, 97-Esteiras/008,
// TASK-FE-LR-01. Mirror de `languagePtBr/languageLedgerReport.ts`. Corrección
// posterior a la entrega (2026-09-09): SIN vista previa en pantalla —
// solo descarga (PDF+Excel), fiel a la pantalla legada.

import { ModuleLedgerReport } from '@/@types/language/module-ledger-report';

export const languageLedgerReport: ModuleLedgerReport = {
  report: {
    pageTitle: 'Libro Mayor',
    pageSubtitle:
      'Extracto contable de una cuenta bancaria en el período, con saldo anterior, saldo actual y totales por mes.',
    fields: {
      account: 'Cuenta',
      startDate: 'Fecha Inicio',
      endDate: 'Fecha Fin',
      condition: 'Condición',
      proprietary: 'Propietario Gestor',
      costCenter: 'Centro de Costo',
      planAccount: 'Plan de Cuentas',
      categories: 'Categorías Financieras',
    },
    accountPlaceholder: 'Seleccione la cuenta',
    conditionPlaceholder: 'Seleccione la condición',
    proprietaryPlaceholder: 'Todos los propietarios',
    costCenterPlaceholder: 'Todos los centros de costo',
    planAccountPlaceholder: 'Todos los planes de cuentas',
    conditionOptions: {
      withoutCategory: 'Sin Categoría',
      withCategory: 'Con Categoría',
    },
    downloadPdfButton: 'Descargar PDF',
    downloadExcelButton: 'Descargar Excel',
    downloadSuccess: 'Informe generado con éxito.',
    downloadError: 'No fue posible generar el informe.',
    emptyBeforeFilter:
      'Informe la cuenta y el período (Fecha Inicio y Fecha Fin) para generar el informe.',
    validation: {
      accountRequired: 'La cuenta es obligatoria.',
      periodRequired: 'El período (Fecha Inicio y Fecha Fin) es obligatorio.',
      conditionRequired: 'La condición es obligatoria.',
    },
  },
};
