// src/constants/languages/languageEsEs/languageIntegrations.ts
// Traducción ES del módulo compartido "Integraciones" — pantallas de export
// del área Integraciones (F-119 "Exportación NFS-e → Domínio", canario de
// la esteira 071; reutilizable por las hermanas F-116/117/118/120, Decisión
// E de `ExportNfseDominio-contrato-tela.md`). Mirror estructural de
// languagePtBr/languageIntegrations.ts.
//
// NOTA: TASK-NFSE-FE-01 especificó apenas EN+PT; este arquivo ES foi
// adicionado para satisfazer `LanguageDate`/`LanguagesDate` (3 idiomas
// já existentes no repo, `languageContextTypes = { US, BR, ES }`) e manter
// `tsc` verde — ver `src/constants/languages/languageEsEs/index.ts`.

import { ModuleIntegrations } from '@/@types/language/module-integrations';

export const languageIntegrations: ModuleIntegrations['integrations'] = {
  singularLabel: 'Integración',
  pluralLabel: 'Integraciones',
  exportNfseDominio: {
    titleModule: 'Exportación NFS-e (Domínio)',
    form: {
      startDateLabel: 'Fecha de inicio',
      endDateLabel: 'Fecha de fin',
      exportButton: 'Exportar datos',
      validation: {
        endBeforeStart: 'La fecha de fin debe ser mayor o igual a la fecha de inicio.',
      },
    },
    toasts: {
      successTitle: 'Exportación generada',
      successDescription: 'El archivo fue descargado con éxito.',
      errorTitle: 'Error en la exportación',
    },
  },
  exportMovementsDominio: {
    titleModule: 'Exportación Mov. Bancario (Domínio)',
    form: {
      startDateLabel: 'Fecha de inicio',
      endDateLabel: 'Fecha de fin',
      typeLabel: 'Tipo de Datos',
      exportButton: 'Exportar datos',
      typeOptions: {
        income: 'Entrada',
        expense: 'Salida',
      },
      validation: {
        endBeforeStart: 'La fecha de fin debe ser mayor o igual a la fecha de inicio.',
      },
    },
    toasts: {
      successTitle: 'Exportación generada',
      successDescription: 'El archivo fue descargado con éxito.',
      errorTitle: 'Error en la exportación',
    },
  },
  exportEarningsDominio: {
    titleModule: 'Exportación Nómina Salarial (Domínio)',
    form: {
      yearLabel: 'Año',
      monthLabel: 'Mes',
      exportButton: 'Exportar datos',
      months: {
        jan: 'Enero',
        feb: 'Febrero',
        mar: 'Marzo',
        apr: 'Abril',
        may: 'Mayo',
        jun: 'Junio',
        jul: 'Julio',
        aug: 'Agosto',
        sep: 'Septiembre',
        oct: 'Octubre',
        nov: 'Noviembre',
        dec: 'Diciembre',
      },
      validation: {
        yearRequired: 'Seleccione el año.',
        monthRequired: 'Seleccione el mes.',
      },
    },
    toasts: {
      successTitle: 'Exportación generada',
      successDescription: 'El archivo fue descargado con éxito.',
      errorTitle: 'Error en la exportación',
    },
  },
  exportFinancialCsv: {
    titleModule: 'Exportación CSV (C. Pagadas/Recibidas)',
    form: {
      startDateLabel: 'Fecha de inicio',
      endDateLabel: 'Fecha de fin',
      exportButton: 'Exportar datos',
      validation: {
        endBeforeStart: 'La fecha de fin debe ser mayor o igual a la fecha de inicio.',
      },
    },
    toasts: {
      successTitle: 'Exportación generada',
      successDescription: 'El archivo fue descargado con éxito.',
      errorTitle: 'Error en la exportación',
    },
  },
  exportExpensesIncomesDominio: {
    titleModule: 'Exportar Datos Domínio — Cuentas por Pagar/Cobrar',
    form: {
      farmLabel: 'Finca',
      startDateLabel: 'Fecha emisión inicio',
      endDateLabel: 'Fecha emisión fin',
      startDueDateLabel: 'Fecha venc. inicio',
      endDueDateLabel: 'Fecha venc. fin',
      proprietaryLabel: 'Propietario gestor',
      statusLabel: 'Estado',
      centerLabel: 'Centro de costo',
      typeLabel: 'Tipo de datos',
      categoriesLabel: 'Categorías',
      exportButton: 'Exportar datos',
      validation: {
        endBeforeStart: 'La fecha de fin debe ser mayor o igual a la fecha de inicio.',
        endDueBeforeStartDue:
          'La fecha de fin de vencimiento debe ser mayor o igual a la fecha de inicio de vencimiento.',
      },
      status: {
        aVencer: 'Por vencer',
        vencido: 'Vencido',
        baixaParcial: 'Baja parcial',
        baixado: 'Dado de baja',
        adiantPendente: 'Anticipo pendiente',
        adiantBaixado: 'Anticipo dado de baja',
        faturaPendente: 'Factura/Pendiente',
        faturaBaixado: 'Factura/Dada de baja',
      },
      type: {
        expense: 'Cuentas por Pagar',
        income: 'Cuentas por Cobrar',
      },
    },
    toasts: {
      successTitle: 'Exportación generada',
      successDescription: 'El archivo fue descargado con éxito.',
      errorTitle: 'Error en la exportación',
    },
  },
};
