// src/constants/languages/languageEsEs/languageEventos.ts
// Traducción ES-ES del módulo de EVENTOS (Administrativo / Gestión de Personal).

import { ModuleEvents } from '@/@types/language/module-events';

export const languageEventos: ModuleEvents = {
  event: {
    singularLabel: 'Evento',
    pluralLabel: 'Eventos',
    list: {
      pageTitle: 'Eventos',
      pageSubtitle: 'Administre el catálogo de eventos (rubros de nómina).',
      deletedToast: 'Evento eliminado con éxito',
      table: {
        name: 'Nombre',
        type: 'Periodicidad',
        method: 'Método',
        condition: 'Condición',
        active: 'Activo',
        activeLabel: 'Activo',
        inactiveLabel: 'Inactivo',
      },
      actions: {
        edit: 'Editar',
        delete: 'Eliminar',
      },
      emptyState: {
        titleEmpty: 'Ningún evento registrado.',
        descriptionEmpty: 'Comience agregando el primer evento.',
        titleFiltered: 'Ningún evento encontrado.',
        descriptionFiltered: 'Intente ajustar los filtros o borrar la búsqueda.',
        cta: 'Nuevo Evento',
      },
      error: {
        message: 'No se pudieron cargar los eventos.',
        retry: 'Intentar de nuevo',
      },
    },
    filter: {
      title: 'Filtrar eventos',
      search: 'Buscar',
      searchPlaceholder: 'Buscar por nombre',
      isEnabled: 'Estado',
      isEnabledAll: 'Todos',
      enabledOptions: {
        active: 'Activo',
        inactive: 'Inactivo',
      },
      dateFrom: 'Fecha de registro (desde)',
      dateTo: 'Fecha de registro (hasta)',
      dateRangeInvalid: 'La fecha final no puede ser anterior a la fecha inicial.',
    },
    deleteBlocked: {
      title: 'No se puede eliminar',
      description:
        'Existen registros vinculados a este evento. Elimine o reasigne los vínculos siguientes antes de eliminar',
      resourceLabel: '{resource} ({count})',
      tableLabels: {
        earning_event: 'Percepción(es) vinculada(s)',
        employee_events: 'Empleado(s) vinculado(s)',
        absences: 'Falta(s) vinculada(s)',
        bonuses: 'Bono(s) vinculado(s)',
        advances: 'Anticipo(s) vinculado(s)',
      },
    },
    typeOptions: {
      weekly: 'Semanal',
      biweekly: 'Quincenal',
      monthly: 'Mensual',
      quarterly: 'Trimestral',
      semiannual: 'Semestral',
      annual: 'Anual',
    },
    methodOptions: {
      informed: 'Informado',
      fixed: 'Fijo',
    },
    conditionOptions: {
      sum: 'Suma',
      decrease: 'Disminuye',
    },
    form: {
      title: { create: 'Nuevo Evento', edit: 'Editar Evento' },
      subtitle: {
        create: 'Registre un nuevo evento (rubro de nómina).',
        edit: 'Actualice los datos del evento.',
      },
      fields: {
        name: 'Nombre',
        type: 'Periodicidad',
        method: 'Método',
        condition: 'Condición',
        isEnabled: 'Activo',
      },
      placeholders: {
        name: 'Ej.: Salario Familiar',
      },
      validation: {
        nameMaxLength: 'El nombre debe tener como máximo 30 caracteres',
      },
    },
  },
};
