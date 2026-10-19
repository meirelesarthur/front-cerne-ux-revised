// src/constants/languages/languageEsEs/languageMaintenancePreventives.ts
// Traducción ES-ES del módulo Gestión de Flota — Mantenimientos Preventivos
// (MaintenancePreventive) — dominio propio, Tareas 43/44 (esteira 010).

import { ModuleMaintenancePreventives } from '@/@types/language/module-maintenance-preventives';

export const languageMaintenancePreventives: ModuleMaintenancePreventives = {
  maintenancePreventive: {
    singularLabel: 'Mantenimiento Preventivo',
    pluralLabel: 'Mantenimientos Preventivos',
    list: {
      pageTitle: 'Mantenimientos Preventivos',
      pageSubtitle: 'Mantenimientos preventivos de flota por equipo.',
      deletedToast: 'Mantenimiento preventivo eliminado con éxito',
      table: {
        code: 'Código',
        date: 'Fecha',
        requester: 'Solicitante',
        actions: 'Acciones',
      },
      itemsTable: {
        equipment: 'Equipo',
        date: 'Fecha Revisión',
        message: 'Servicio',
        hourMeterKm: 'Horómetro/Km',
        note: 'Observación',
      },
      actions: {
        view: 'Ver',
        edit: 'Editar',
        delete: 'Eliminar',
      },
      filter: {
        title: 'Filtrar mantenimientos preventivos',
        equipment: 'Equipo',
        equipmentPlaceholder: 'Buscar equipo',
        startDate: 'Fecha inicio',
        endDate: 'Fecha fin',
      },
      emptyState: {
        title: 'Ningún mantenimiento preventivo registrado.',
        description: 'Comience agregando su primer mantenimiento preventivo.',
        titleFiltered: 'Ningún mantenimiento preventivo encontrado.',
        descriptionFiltered: 'Intente ajustar los filtros o limpiar la búsqueda.',
        cta: 'Agregar Nuevo',
      },
      errorState: {
        title: 'No fue posible cargar los mantenimientos preventivos.',
        description: 'Verifique su conexión e intente nuevamente.',
        retry: 'Intentar nuevamente',
      },
    },
    form: {
      title: {
        create: 'Nuevo Mantenimiento Preventivo',
        edit: 'Editar Mantenimiento Preventivo',
      },
      fields: {
        code: 'Código',
        date: 'Fecha',
        requester: 'Solicitante',
        user: 'Usuario',
      },
      items: {
        title: 'Ítems',
        addItem: 'Agregar Ítem',
        removeItem: 'Eliminar',
        emptyRow: 'Ningún ítem agregado.',
        fields: {
          equipment: 'Equipo',
          message: 'Servicio',
          date: 'Fecha Revisión',
          hourMeterKm: 'Horómetro/Km',
          note: 'Observación',
        },
        placeholders: {
          equipment: 'Buscar equipo',
          message: 'Describa el servicio',
        },
      },
      errors: {
        invalidFields: 'Revise los campos destacados.',
        equipmentRequired: 'Seleccione el equipo.',
        messageRequired: 'Informe el servicio.',
      },
    },
    detail: {
      sections: {
        header: 'Identificación',
        items: 'Ítems',
      },
      fields: {
        code: 'Código',
        date: 'Fecha',
        requester: 'Solicitante',
        user: 'Usuario',
      },
      actions: {
        edit: 'Editar',
        delete: 'Eliminar',
        back: 'Volver',
      },
      notFound: {
        title: 'Mantenimiento preventivo no encontrado.',
        description: 'Verifique si todavía existe.',
        back: 'Volver al listado',
      },
    },
  },
};
