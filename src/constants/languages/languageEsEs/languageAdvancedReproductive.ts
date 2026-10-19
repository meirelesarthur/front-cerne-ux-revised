// src/constants/languages/languageEsEs/languageAdvancedReproductive.ts
// Traducción ES-ES del módulo "Gestión Avanzada" (AdvancedReproductive —
// Operacional / Reproducción, F-011, 97-Esteiras/056, TASK-AR-FE-01).

import { ModuleAdvancedReproductive } from '@/@types/language/module-advanced-reproductive';

export const languageAdvancedReproductive: ModuleAdvancedReproductive = {
  advancedReproductive: {
    singularLabel: 'Gestión Avanzada',
    pluralLabel: 'Gestión Avanzada',
    titleModule: 'Gestión Avanzada',
    list: {
      pageTitle: 'Gestión Avanzada',
      pageSubtitle: 'Siga el estado reproductivo de los animales en apareamiento.',
      indicators: {
        animalsCount: 'Animales',
        pregnancyRate: 'Tasa de Preñez',
        birthAnimalsCount: 'Nacimientos',
      },
      table: {
        identification: 'Animal',
        category: 'Categoría',
        breedingMatingType: 'Tipo de Apareamiento',
        lastUpdate: 'Última Actualización',
        reproductiveStatus: 'Estado',
        actions: 'Acciones',
      },
      actions: {
        viewAnimalRecord: 'Ficha del Animal',
        viewAnimalRecordSuccessToast: 'Ficha generada con éxito.',
        viewAnimalRecordErrorToast: 'No fue posible generar la ficha del animal.',
        viewBreedingMating: 'Ver Apareamiento',
        editBreedingMating: 'Editar Apareamiento',
        advanceProtocolStep: 'Siguiente Etapa',
        finishBreedingMating: 'Finalizar',
        viewPregnancyDiagnosis: 'Diagnóstico de Gestación',
        deleteBreedingMating: 'Eliminar',
        disabledReason: 'Disponible cuando esta función sea migrada a la nueva plataforma',
        deleteDialog: {
          title: '¿Eliminar apareamiento?',
        },
      },
      filter: {
        title: 'Filtrar Gestión Avanzada',
        search: 'Buscar',
        reproductiveStatus: 'Estado Reproductivo',
        breedingBatch: 'Lote de Reproducción',
        breedingSeason: 'Estación de Monta',
        protocol: 'Protocolo',
        bullSeedSeason: 'Toro/Semen/Embrión',
      },
      emptyState: {
        titleEmpty: 'No se encontraron registros.',
        descriptionEmpty: 'No hay animales en apareamiento para mostrar.',
        titleFiltered: 'No se encontraron registros.',
        descriptionFiltered: 'Intente ajustar los filtros.',
        clearFiltersCta: 'Limpiar filtros',
      },
    },
    reproductiveStatusOptions: {
      pregnant: 'Preñada',
      empty: 'Vacía',
      calved: 'Parida',
    },
  },
};
