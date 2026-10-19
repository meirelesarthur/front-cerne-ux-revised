// src/constants/languages/languageEsEs/languageFeedlotYards.ts
// Traducción ES-ES del módulo OPERACIONAL — Pátio (FeedlotYard) — dominio
// propio, TASK-PT-FE-01/02 (ejecución 046). Mirror `languageFeedlotYards`
// (pt-BR).

import { ModuleFeedlotYards } from '@/@types/language/module-feedlot-yards';

export const languageFeedlotYards: ModuleFeedlotYards = {
  feedlotYard: {
    singularLabel: 'Corral',
    pluralLabel: 'Corrales',
    list: {
      pageTitle: 'Corrales',
      pageSubtitle: 'Registro de los corrales de confinamiento.',
      deletedToast: 'Corral eliminado con éxito',
      table: {
        code: 'Código',
        name: 'Nombre',
        area: 'Área (m²)',
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
        titleEmpty: 'Ningún corral registrado.',
        descriptionEmpty: 'Comience agregando su primer corral.',
        titleEmptyNoCreate: 'Ningún corral registrado.',
        descriptionEmptyNoCreate: 'No tiene permiso para registrar un nuevo corral.',
        titleFiltered: 'Ningún corral encontrado.',
        descriptionFiltered: 'Intente ajustar los filtros o borrar la búsqueda.',
        cta: 'Nuevo Corral',
      },
    },
    filter: {
      title: 'Filtrar corrales',
      code: 'Código',
      codePlaceholder: 'Buscar por código',
      name: 'Nombre',
      namePlaceholder: 'Buscar por nombre',
      isActive: 'Estado',
      isActiveAll: 'Todos',
    },
    detail: {
      generalData: { title: 'Datos Generales' },
      fields: {
        code: 'Código',
        name: 'Nombre',
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
        title: 'Corral no encontrado.',
        description: 'Verifique el enlace o vuelva al listado.',
        back: 'Volver al listado',
      },
    },
    form: {
      title: { create: 'Nuevo Corral', edit: 'Editar Corral' },
      fields: {
        code: 'Código',
        name: 'Nombre',
        width: 'Ancho',
        length: 'Largo',
        area: 'Área (m²)',
        isActive: 'Activo',
        observation: 'Observación',
      },
      placeholders: {
        name: 'Ingrese el nombre del corral',
        width: 'Ancho en metros',
        length: 'Largo en metros',
      },
      hints: {
        codeGenerated: 'Generado automáticamente',
      },
      validation: {
        nameRequired: 'El nombre es obligatorio.',
        nameMaxLength: 'El nombre debe tener como máximo 120 caracteres.',
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
        message: 'No fue posible cargar los datos de este patio.',
        retry: 'Intentar de nuevo',
      },
    },
  },
};
