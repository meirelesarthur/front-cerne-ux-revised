// src/constants/languages/languageEsEs/languageMarkers.ts
// Traducción ES-ES del módulo de MARCADORES (Marker — Registros Base).

import { ModuleMarkers } from '@/@types/language/module-markers';

export const languageMarkers: ModuleMarkers = {
  marker: {
    singularLabel: 'Marcador',
    pluralLabel: 'Marcadores',
    type: {
      activity: 'Actividad',
      infrastructure: 'Infraestructura',
    },
    list: {
      pageTitle: 'Marcadores',
      pageSubtitle:
        'Administre el catálogo de marcadores utilizado en el mapa de la propiedad (Actividades e Infraestructuras).',
      deletedToast: 'Marcador eliminado con éxito',
      table: {
        icon: 'Ícono',
        description: 'Descripción',
        type: 'Tipo',
        active: 'Activo',
        activeLabel: 'Activo',
        inactiveLabel: 'Inactivo',
      },
      actions: {
        edit: 'Editar',
        delete: 'Eliminar',
      },
      emptyState: {
        titleEmpty: 'Ningún marcador registrado.',
        descriptionEmpty: 'Comience agregando el primer marcador.',
        titleFiltered: 'Ningún marcador encontrado.',
        descriptionFiltered: 'Intente ajustar los filtros o borrar la búsqueda.',
        cta: 'Nuevo Marcador',
      },
      error: {
        message: 'No fue posible cargar los marcadores.',
        retry: 'Intentar de nuevo',
      },
    },
    filter: {
      title: 'Filtrar marcadores',
      search: 'Buscar',
      searchPlaceholder: 'Buscar por descripción',
      type: 'Tipo',
      typeAll: 'Todos',
      isEnabled: 'Estado',
      isEnabledAll: 'Todos',
      enabledOptions: {
        active: 'Activo',
        inactive: 'Inactivo',
      },
    },
    deleteBlocked: {
      title: 'No es posible eliminar',
      description:
        'Hay registros vinculados a este marcador. Elimine o reasigne los vínculos siguientes antes de eliminar',
      resourceLabel: '{resource} ({count})',
      tableLabels: {
        areas: 'Área(s) vinculada(s)',
        sectors: 'Sector(es) vinculado(s)',
        places: 'Local(es) vinculado(s)',
        subPlaces: 'Sub-local(es) vinculado(s)',
        areaInfrastructure: 'Infraestructura de Área vinculada',
        sectorInfrastructure: 'Infraestructura de Sector vinculada',
        placeInfrastructure: 'Infraestructura de Local vinculada',
        subPlaceInfrastructure: 'Infraestructura de Sub-local vinculada',
        activityCostCenters: 'Centro(s) de Costo de Actividad vinculado(s)',
        apportionmentItems: 'Reparto(s) de Actividad vinculado(s)',
      },
    },
    form: {
      title: {
        create: 'Nuevo Marcador',
        edit: 'Editar Marcador',
      },
      subtitle: {
        create: 'Registre un nuevo marcador para usar en el mapa de la propiedad.',
        edit: 'Actualice los datos del marcador.',
      },
      fields: {
        description: 'Descripción',
        type: 'Tipo',
        isEnabled: 'Activo',
        icon: 'Ícono',
        iconNew: 'Nuevo ícono',
      },
      placeholders: {
        description: 'Ej.: Corral',
      },
      hints: {
        iconAccepted: 'Formatos aceptados: PNG.',
        iconMaxSize: 'Tamaño máximo: 2 MB.',
      },
      image: {
        dropzoneTitle: 'Arrastre una imagen o haga clic para seleccionar',
        dropzoneDragging: 'Suelte la imagen aquí',
        changeLabel: 'Cambiar ícono',
        removeLabel: 'Eliminar ícono',
        errorType: 'Formato no aceptado. Envíe un archivo PNG.',
        errorSize: 'El archivo excede el tamaño máximo de 2 MB.',
      },
      validation: {
        descriptionMaxLength: 'La descripción debe tener como máximo 40 caracteres',
        typeRequired: 'Seleccione el tipo',
        iconRequired: 'El ícono es obligatorio',
      },
    },
  },
};
