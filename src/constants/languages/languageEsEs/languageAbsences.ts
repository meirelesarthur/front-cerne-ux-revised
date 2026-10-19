// src/constants/languages/languageEsEs/languageAbsences.ts
// Traducción ES-ES del módulo "Registro de Faltas" (Absence — Administrativo
// / Gestión de Personal, 97-Esteiras/003, Tareas 12/13).

import { ModuleAbsences } from '@/@types/language/module-absences';

export const languageAbsences: ModuleAbsences = {
  absence: {
    singularLabel: 'Falta',
    pluralLabel: 'Faltas',
    titleModule: 'Registro de Faltas',
    list: {
      pageTitle: 'Registro de Faltas',
      pageSubtitle: 'Administre las faltas registradas para los empleados.',
      deletedToast: 'Falta eliminada con éxito',
      table: {
        date: 'Fecha',
        employee: 'Empleado',
        event: 'Evento',
        amount: 'Valor',
        period: 'Período',
        actions: 'Acciones',
      },
      actions: {
        view: 'Visualizar',
        edit: 'Editar',
        delete: 'Eliminar',
      },
      emptyState: {
        titleEmpty: 'Ninguna falta registrada.',
        descriptionEmpty: 'Comience registrando la falta de un empleado.',
        titleFiltered: 'Ninguna falta encontrada.',
        descriptionFiltered: 'Intente ajustar los filtros o borrar la búsqueda.',
        cta: 'Nueva Falta',
      },
      filter: {
        title: 'Filtrar Faltas',
        employee: 'Empleado',
        event: 'Evento',
        startDate: 'Fecha (desde)',
        endDate: 'Fecha (hasta)',
        dateRangeInvalid: 'La fecha final no puede ser anterior a la fecha inicial.',
      },
    },
    periodOptions: {
      morning: 'Matutino',
      afternoon: 'Vespertino',
      fullDay: 'Integral',
    },
    form: {
      title: {
        create: 'Nueva Falta',
        edit: 'Editar Falta',
        view: 'Visualizar Falta',
      },
      fields: {
        date: 'Fecha',
        employee: 'Empleado',
        event: 'Evento',
        period: 'Período',
        amount: 'Valor',
      },
      validation: {
        dateRequired: 'Ingrese la fecha',
        employeeRequired: 'Seleccione el empleado',
        eventRequired: 'Seleccione el evento',
        amountRequired: 'Ingrese un valor válido',
      },
    },
  },
};
