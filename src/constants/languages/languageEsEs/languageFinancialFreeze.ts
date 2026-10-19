// src/constants/languages/languageEsEs/languageFinancialFreeze.ts
// Traducción ES-ES de la feature "Congelamientos Financieros" (FinancialFreeze
// — F-110, esteira 97-Esteiras/008, Tarefa 31). Compuesto dentro de
// `languageFinancial.ts` (clave `financial.financialFreeze`, mirror
// `expense`/`mercadoPago`/`ofxImport`) — ver
// `@/@types/language/module-financial/financial-freeze.d.ts` para el tipo.

import type { FinancialFreezeLanguage } from '@/@types/language/module-financial/financial-freeze';

export const languageFinancialFreeze: FinancialFreezeLanguage = {
  singularLabel: 'Congelamiento Financiero',
  pluralLabel: 'Congelamientos Financieros',

  months: {
    january: 'Enero',
    february: 'Febrero',
    march: 'Marzo',
    april: 'Abril',
    may: 'Mayo',
    june: 'Junio',
    july: 'Julio',
    august: 'Agosto',
    september: 'Septiembre',
    october: 'Octubre',
    november: 'Noviembre',
    december: 'Diciembre',
  },

  list: {
    pageTitle: 'Congelamientos Financieros',
    pageSubtitle: 'Meses con movimientos financieros bloqueados.',
    table: {
      month: 'Mes',
      year: 'Año',
      responsible: 'Responsable',
      isFrozen: '¿Congelado?',
      createdAt: 'Fecha de Creación',
      updatedAt: 'Fecha de Actualización',
    },
    actions: {
      view: 'Visualizar',
      edit: 'Editar',
      delete: 'Eliminar',
    },
    emptyState: {
      titleEmpty: 'Ningún congelamiento financiero registrado.',
      descriptionEmpty: 'Registre un congelamiento para bloquear movimientos del mes.',
      titleFiltered: 'Ningún resultado para este filtro.',
      descriptionFiltered: 'Ajuste los filtros e intente nuevamente.',
      cta: 'Nuevo',
    },
    deletedToast: 'eliminado(a) con éxito',
  },

  filter: {
    title: 'Filtrar Congelamientos Financieros',
    month: 'Mes',
    monthAll: 'Todos los meses',
    year: 'Año',
    yearPlaceholder: 'Ej.: 2026',
  },

  form: {
    title: {
      create: 'Nuevo Congelamiento Financiero',
      edit: 'Editar Congelamiento Financiero',
      view: 'Visualizar Congelamiento Financiero',
    },
    fields: {
      month: 'Mes',
      year: 'Año',
      isFrozen: '¿Congelado?',
    },
    validation: {
      monthRequired: 'El mes es obligatorio.',
      yearRequired: 'El año es obligatorio.',
      yearDigits: 'El año debe contener 4 dígitos.',
      isFrozenRequired: 'El campo de congelamiento es obligatorio.',
    },
    createdToast: 'creado(a) con éxito',
    updatedToast: 'actualizado(a) con éxito',
    historySection: {
      title: 'Historial de Movimientos',
      emptyLabel: 'Ningún movimiento registrado.',
      columns: {
        isFrozen: '¿Congelado?',
        responsible: 'Responsable',
        date: 'Fecha',
      },
    },
  },
};
