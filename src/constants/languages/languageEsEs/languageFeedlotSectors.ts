// src/constants/languages/languageEsEs/languageFeedlotSectors.ts
// Traducción ES-ES del módulo OPERACIONAL — Setor (FeedlotSector) — dominio
// propio, TASK-FS-FE-01/02. Mirror `languageFeedlotYards`.

import { ModuleFeedlotSectors } from '@/@types/language/module-feedlot-sectors';

export const languageFeedlotSectors: ModuleFeedlotSectors = {
  feedlotSector: {
    singularLabel: 'Sector',
    pluralLabel: 'Sectores',
    list: {
      pageTitle: 'Sectores',
      pageSubtitle: 'Registro de los sectores de confinamiento.',
      deletedToast: 'Sector eliminado con éxito',
      table: {
        code: 'Código',
        name: 'Nombre',
        feedlotYard: 'Corral',
        area: 'Área (m²)',
        createdAt: 'Creado el',
        active: 'Estado',
        activeLabel: 'Activo',
        inactiveLabel: 'Inactivo',
      },
      actions: {
        view: 'Visualizar',
        edit: 'Editar',
        delete: 'Eliminar',
      },
      emptyState: {
        titleEmpty: 'Ningún sector registrado.',
        descriptionEmpty: 'Comience agregando su primer sector.',
        titleEmptyNoCreate: 'Ningún sector registrado.',
        descriptionEmptyNoCreate: 'No tiene permiso para registrar un nuevo sector.',
        titleFiltered: 'Ningún sector encontrado.',
        descriptionFiltered: 'Intente ajustar los filtros o borrar la búsqueda.',
        cta: 'Nuevo Sector',
      },
    },
    filter: {
      title: 'Filtrar sectores',
      code: 'Código',
      codePlaceholder: 'Buscar por código',
      name: 'Nombre',
      namePlaceholder: 'Buscar por nombre',
      feedlotYard: 'Corral',
      feedlotYardPlaceholder: 'Buscar por corral',
      isActive: 'Estado',
      isActiveAll: 'Todos',
    },
    detail: {
      generalData: { title: 'Datos Generales' },
      fields: {
        code: 'Código',
        name: 'Nombre',
        feedlotYard: 'Corral',
        priority: 'Orden',
        width: 'Ancho',
        length: 'Largo',
        area: 'Área (m²)',
        observation: 'Observación',
        active: 'Estado',
        createdAt: 'Creado el',
        updatedAt: 'Actualizado el',
      },
      actions: { edit: 'Editar', back: 'Volver' },
      notFound: {
        title: 'Sector no encontrado.',
        description: 'Verifique el enlace o vuelva al listado.',
        back: 'Volver al listado',
      },
    },
    form: {
      title: { create: 'Nuevo Sector', edit: 'Editar Sector' },
      fields: {
        code: 'Código',
        name: 'Nombre',
        feedlotYard: 'Corral',
        width: 'Ancho (m)',
        length: 'Largo (m)',
        area: 'Área Total (m²)',
        isActive: 'Estado',
        observation: 'Observación',
      },
      placeholders: {
        feedlotYard: 'Seleccione el corral',
        width: 'Ancho en metros',
        length: 'Largo en metros',
      },
      hints: {
        codeGenerated: 'Generado automáticamente',
      },
      validation: {
        nameRequired: 'El nombre es obligatorio.',
        nameMaxLength: 'El nombre debe tener como máximo 120 caracteres.',
        feedlotYardRequired: 'El corral es obligatorio.',
        widthRequired: 'El ancho es obligatorio.',
        widthMin: 'El ancho no puede ser negativo.',
        lengthRequired: 'El largo es obligatorio.',
        lengthMin: 'El largo no puede ser negativo.',
        isActiveRequired: 'El estado es obligatorio.',
        observationMaxLength: 'La observación debe tener como máximo 600 caracteres.',
      },
    },
    status: {
      active: 'Activo',
      inactive: 'Inactivo',
    },
    dialog: {
      noChangesToast: 'Nada para guardar — no se realizó ningún cambio.',
      loadError: {
        message: 'No fue posible cargar los datos de este sector.',
        retry: 'Intentar de nuevo',
      },
    },
  },
};
