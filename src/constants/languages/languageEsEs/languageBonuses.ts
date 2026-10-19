// src/constants/languages/languageEsEs/languageBonuses.ts
// Traducción ES del módulo de REGISTRO DE EVENTOS (Bonus — Administrativo).
// Esteira 037 — CRUD núcleo (sin cuotas/dimensión financiera, fuera del
// contrato real de Bonus).

import { ModuleBonuses } from '@/@types/language/module-bonuses';

export const languageBonuses: ModuleBonuses = {
  bonus: {
    singularLabel: 'Registro de Evento',
    pluralLabel: 'Registros de Eventos',
    list: {
      pageTitle: 'Registros de Eventos',
      pageSubtitle: 'Administre los eventos de bono registrados para los empleados.',
      deletedToast: 'Registro de evento eliminado con éxito',
      table: {
        employee: 'Empleado',
        event: 'Evento',
        date: 'Fecha',
        amount: 'Valor',
        actions: 'Acciones',
      },
      actions: {
        view: 'Ver registro de evento',
        edit: 'Editar',
        delete: 'Eliminar',
      },
      emptyState: {
        titleEmpty: 'Ningún registro de evento registrado.',
        descriptionEmpty: 'Comience agregando el primer registro de evento.',
        cta: 'Nuevo Registro de Evento',
      },
    },
    detail: {
      generalData: {
        title: 'Datos Generales',
      },
      fields: {
        employee: 'Empleado',
        event: 'Evento',
        date: 'Fecha',
        amount: 'Valor',
      },
      actions: {
        edit: 'Editar',
      },
      notFound: {
        title: 'Registro de evento no encontrado',
        description:
          'El registro de evento solicitado no existe, fue eliminado o pertenece a otra finca.',
        back: 'Volver a Registros de Eventos',
      },
    },
    form: {
      title: {
        create: 'Nuevo Registro de Evento',
        edit: 'Editar Registro de Evento',
      },
      fields: {
        employee: 'Empleado',
        event: 'Evento',
        date: 'Fecha',
        amount: 'Valor',
      },
      validation: {
        employeeRequired: 'Seleccione el empleado',
        eventRequired: 'Seleccione el evento',
        dateRequired: 'La fecha es obligatoria',
        amountRequired: 'Ingrese un valor válido',
      },
    },
  },
};
