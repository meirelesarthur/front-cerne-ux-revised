// src/constants/languages/languageEsEs/languageCashBooks.ts
// Traducción ES-ES del módulo CashBook (LCDPR — Livro Caixa Digital do
// Produtor Rural, dominio Fiscal, ejecución 045, TASK-LCDPR-FE-01). Espejo
// estructural de `languageDfes` (mismo dominio Fiscal).

import { ModuleCashBooks } from '@/@types/language/module-cash-books';

export const languageCashBooks: ModuleCashBooks = {
  cashBook: {
    singularLabel: 'Libro Caja (LCDPR)',
    pluralLabel: 'Libros Caja (LCDPR)',

    list: {
      pageTitle: 'Libro Caja (LCDPR)',
      pageSubtitle: 'Gestione los registros del Libro Caja Digital del Productor Rural.',
      table: {
        year: 'Año',
        proprietary: 'Propietario',
        contador: 'Contador',
      },
      actions: {
        view: 'Visualizar',
        downloadTxt: 'Descargar TXT',
        printReport: 'Imprimir Informe',
        delete: 'Eliminar',
      },
      downloadTxtError: 'No se pudo descargar el TXT de este registro.',
      downloadReportError: 'No se pudo generar el informe de este registro.',
      deleteConfirm: {
        title: 'Eliminar registro del Libro Caja',
        description: 'Está seguro que desea eliminar el registro del año',
        warning: 'Esta acción no se puede deshacer.',
      },
      deleteSuccess: 'Registro eliminado con éxito.',
      deleteError: 'No se pudo eliminar este registro.',
      emptyState: {
        titleEmpty: 'Ningún registro generado todavía.',
        descriptionEmpty: 'Cree el primer registro de Libro Caja (LCDPR) de esta finca.',
        titleFiltered: 'Ningún registro encontrado.',
        descriptionFiltered: 'Intente ajustar los filtros aplicados.',
        cta: 'Nuevo Registro',
      },
      error: {
        message: 'No se pudieron cargar los registros del Libro Caja (LCDPR).',
        retry: 'Intentar de nuevo',
      },
    },

    filter: {
      title: 'Filtrar Libro Caja (LCDPR)',
      year: 'Año',
      yearPlaceholder: 'ej.: 2026',
      proprietary: 'Propietario',
      proprietaryPlaceholder: 'Buscar propietario...',
      proprietaryAll: 'Todos',
    },

    form: {
      pageTitle: 'Nuevo Registro de Libro Caja (LCDPR)',
      pageSubtitle: 'Genere un nuevo registro del Libro Caja Digital del Productor Rural.',
      fields: {
        startDate: 'Fecha Inicial',
        endDate: 'Fecha Final',
        proprietary: 'Propietario',
        proprietaryPlaceholder: 'Seleccione el propietario',
        period: 'Período de Registro',
        periodPlaceholder: 'Seleccione el período',
        special: 'Situación Especial',
        specialPlaceholder: 'Seleccione la situación especial',
        dtSpecial: 'Fecha de la Situación Especial',
        verification: 'Forma de Evaluación',
        verificationPlaceholder: 'Seleccione la forma de evaluación',
        contador: 'Contador',
        contadorPlaceholder: 'Seleccione el contador',
      },
      validation: {
        startDateRequired: 'La fecha inicial es obligatoria.',
        endDateRequired: 'La fecha final es obligatoria.',
        endDateNotBeforeStart: 'La fecha final no puede ser anterior a la fecha inicial.',
        endDateNotTodayOrFuture: 'La fecha final no puede ser igual o posterior a hoy.',
        endDateSameYearAsStart: 'Las fechas deben estar en el mismo año.',
        dateInvalid: 'La fecha ingresada no es válida.',
        dateMinYear: 'El año de la fecha no puede ser anterior a 2000.',
        dtSpecialAfterEnd:
          'La fecha de la situación especial no puede ser posterior a la fecha final.',
        proprietaryRequired: 'Seleccione un propietario.',
        proprietaryCpfRequired: 'Requiere CPF válido — corrija el registro del propietario',
        periodRequired: 'Seleccione el período de registro.',
        specialRequired: 'Seleccione la situación especial.',
        dtSpecialRequired: 'La fecha de la situación especial es obligatoria.',
        verificationRequired: 'Seleccione la forma de evaluación.',
        contadorRequired: 'Seleccione un contador.',
      },
      createSuccess: 'Registro creado con éxito.',
      createGenericError: 'No se pudo crear el registro.',
      cancelButton: 'Cancelar',
      submitButton: 'Guardar',
    },

    detail: {
      pageTitle: 'Registro de Libro Caja (LCDPR)',
      metadata: {
        year: 'Año',
        proprietary: 'Propietario',
        period: 'Período de Registro',
        special: 'Situación Especial',
        dtSpecial: 'Fecha de la Situación Especial',
        dtSpecialEmpty: '—',
        verification: 'Forma de Evaluación',
        contador: 'Contador',
      },
      monthly: {
        title: 'Resumen Mensual',
        table: {
          month: 'Mes/Año',
          entrance: 'Ingresos (R$)',
          exit: 'Egresos (R$)',
          balance: 'Saldo Acumulado',
        },
        totalsLabel: 'Totales anuales',
      },
      actions: {
        downloadTxt: 'Descargar TXT',
        printReport: 'Imprimir Informe',
        delete: 'Eliminar',
      },
      downloadTxtError: 'No se pudo descargar el archivo TXT.',
      downloadReportError: 'No se pudo generar el informe.',
      deleteConfirm: {
        title: 'Eliminar registro del Libro Caja',
        description: 'Está seguro que desea eliminar este registro',
        warning: 'Esta acción no se puede deshacer.',
      },
      deleteSuccess: 'Registro eliminado con éxito.',
      deleteError: 'No se pudo eliminar este registro.',
      loadError: {
        message: 'No se pudo cargar este registro.',
        retry: 'Intentar de nuevo',
      },
    },
  },
};
