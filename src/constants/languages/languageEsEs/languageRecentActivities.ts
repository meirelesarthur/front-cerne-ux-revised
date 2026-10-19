// src/constants/languages/languageEsEs/languageRecentActivities.ts
// Traducción ES-ES del módulo "Actividades Recientes" (UT-000690 / F-349 — Administrativo).

import { ModuleRecentActivities } from '@/@types/language/module-recent-activities';

export const languageRecentActivities: ModuleRecentActivities = {
  recentActivity: {
    singularLabel: 'Actividad reciente',
    pluralLabel: 'Actividades recientes',
    titleModule: 'Actividades Recientes',
    list: {
      pageTitle: 'Actividades Recientes',
      pageSubtitle: 'Siga los últimos registros ingresados en las fincas de su contratante.',
      table: { type: 'Tipo', date: 'Fecha', status: 'Estado', farm: 'Finca', actions: 'Acciones' },
      actions: {
        open: 'Abrir',
        openUnavailable: 'Este tipo de registro no tiene pantalla de visualización.',
        opening: 'Abriendo...',
      },
      emptyState: {
        titleEmpty: 'Ninguna actividad reciente.',
        descriptionEmpty: 'Los registros ingresados en las fincas aparecerán aquí.',
        titleFiltered: 'Ninguna actividad encontrada.',
        descriptionFiltered: 'Intente ajustar los filtros o limpiar la búsqueda.',
      },
      filter: {
        title: 'Filtrar Actividades',
        types: 'Tipo de actividad',
        startDate: 'Fecha (desde)',
        endDate: 'Fecha (hasta)',
      },
    },
    types: {
      serviceOrder: 'Orden de servicio',
      animalBatchTransfer: 'Transferencia animal/lote',
      batchAreaTransfer: 'Transferencia lote/área',
      separation: 'Apartación',
      deathAnimal: 'Muertes',
      lossAnimal: 'Pérdidas',
      birthAnimal: 'Nacimientos',
      weaning: 'Destete',
      weighing: 'Pesajes',
      sanitary: 'Sanitario',
      pasture: 'Pasturas',
      dietBeat: 'Batida de dieta',
      feeding: 'Alimentación',
      appropriation: 'Apunte agrícola',
      marking: 'Marcación',
      breedingMating: 'Apareamiento',
      pregnancyDiagnosis: 'Diagnóstico de gestación',
      supply: 'Abastecimientos',
      maintenance: 'Mantenimiento',
    },
    status: {
      created: 'Creado el {{date}}',
      updated: 'Editado el {{date}}',
      dateFormat: 'dd/MM/yyyy HH:mm',
    },
    domainStatus: {
      service_order: {
        '1': 'Abierta',
        '2': 'En ejecución',
        '3': 'Concluida',
        '4': 'Evaluado',
        '9': 'Cancelada',
      },
      appropriation: { O: 'Abierto', F: 'Finalizado', A: 'Apropiado' },
      maintenance: { O: 'Abierto', F: 'Finalizado', A: 'Apropiado' },
      pasture: { O: 'Abierto', F: 'Finalizado', A: 'Apropiado' },
      marking: { '1': 'Marcado', '2': 'Previsto', '3': 'Realizado' },
      breeding_mating: { '1': 'En curso', '2': 'Finalizado' },
    },
    validation: {
      endBeforeStart: 'La fecha final no puede ser anterior a la fecha inicial.',
    },
  },
};
