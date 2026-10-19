// src/constants/languages/languageEsEs/languageFechamentoSemana.ts
// Traducción ES-ES del módulo de FECHAMENTO SEMANA (Operacional). Namespace
// `fechamentoSemana` — LIBRE.

import { ModuleFechamentoSemana } from '@/@types/language/module-fechamento-semana';

export const languageFechamentoSemana: ModuleFechamentoSemana = {
  closingWeek: {
    singularLabel: 'Cierre Semanal',
    pluralLabel: 'Cierres Semanales',
    titleModule: 'Cierres Semanales',
    list: {
      pageTitle: 'Cierres Semanales',
      pageSubtitle: 'Gestione los cierres semanales de la finca.',
      deletedToast: 'Cierre semanal eliminado con éxito.',
      table: {
        code: 'Nº',
        week: 'Semana',
        startDate: 'Fecha Inicio',
        endDate: 'Fecha Fin',
      },
      actions: {
        view: 'Ver',
        delete: 'Eliminar',
      },
      emptyState: {
        titleEmpty: 'Ningún cierre semanal registrado.',
        descriptionEmpty: 'Comience agregando el primer cierre.',
        cta: 'Agregar',
      },
      error: {
        message: 'No se pudieron cargar los datos.',
        retry: 'Intentar de nuevo',
      },
    },
    deleteDialog: {
      title: 'Confirmar eliminación',
      descriptionTemplate:
        'El Cierre Semanal Nº {code} será eliminado permanentemente. Esta acción no se puede deshacer.',
    },
    search: {
      pageTitle: 'Nuevo cierre semanal',
      pageSubtitle: 'Seleccione el período para generar el informe.',
      fields: {
        startDate: 'Fecha de inicio',
        endDate: 'Fecha de fin',
      },
      validation: {
        startDateRequired: 'La fecha de inicio es obligatoria.',
        endDateRequired: 'La fecha de fin es obligatoria.',
        endDateBeforeStartDate: 'La fecha de fin no puede ser anterior a la fecha de inicio.',
      },
      generateButton: 'Generar',
      emptyReport: 'No se encontraron cargamentos en este período.',
      businessErrorFallback: 'No se pudo cerrar la semana. Inténtelo de nuevo.',
    },
    report: {
      reportTitle: 'Demostrativo de Formación del Precio Promedio',
      table: {
        cultivation: 'Cultivo',
        quality: 'Calidad',
        quantityFinal: 'Cant. Final',
        expenses: 'Gastos prorrateados',
        amount: 'Precio promedio',
        items: {
          date: 'Fecha',
          dueDate: 'Vencimiento',
          provider: 'Proveedor',
          client: 'Cliente',
          quantityFinal: 'Cant. Kg',
          price: 'Precio',
          totalAmount: 'Valor Operación',
        },
      },
      code: 'Nº',
      week: 'Semana',
      saveButton: 'Guardar',
      backButton: 'Volver',
      savedToast: 'Semana cerrada con éxito.',
    },
    detail: {
      fields: {
        code: 'Nº',
        date: 'Fecha',
        startDate: 'Fecha Inicio',
        endDate: 'Fecha Fin',
        week: 'Semana',
        responsible: 'Responsable',
      },
      itemsSectionTitle: 'Ítems del cierre',
      itemsTable: {
        cultivation: 'Cultivo',
        quality: 'Calidad',
        amount: 'Valor',
      },
      itemsEmptyState: 'Ningún ítem guardado en este cierre.',
      backButton: 'Volver',
      notFound: 'Cierre semanal no encontrado.',
    },
  },
};
