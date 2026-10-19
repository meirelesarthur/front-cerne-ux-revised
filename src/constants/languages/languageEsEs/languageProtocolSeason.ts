// src/constants/languages/languageEsEs/languageProtocolSeason.ts
// Traducción ES-ES del módulo "Protocolos/Estación" (ProtocolSeason —
// Operacional / Reproducción, F-057, ejecución 040, TASK-FE-1050..1059).

import { ModuleProtocolSeason } from '@/@types/language/module-protocol-season';

export const languageProtocolSeason: ModuleProtocolSeason = {
  protocolSeason: {
    singularLabel: 'Protocolo/Estación',
    pluralLabel: 'Protocolos/Estación',
    titleModule: 'Protocolos/Estación',
    list: {
      pageTitle: 'Protocolos/Estación',
      pageSubtitle: 'Administre los protocolos de estación registrados.',
      deletedToast: 'Protocolo/Estación eliminado con éxito',
      newButton: 'Nuevo Protocolo',
      table: {
        code: 'Código',
        name: 'Nombre',
        date: 'Fecha',
        responsible: 'Responsable',
        breedingSeason: 'Estación de Monta',
        actions: 'Acciones',
      },
      actions: {
        view: 'Ver',
        edit: 'Editar',
        delete: 'Eliminar',
      },
      emptyState: {
        titleEmpty: 'Ningún protocolo/estación registrado.',
        descriptionEmpty: 'Comience registrando un nuevo protocolo de estación.',
        titleFiltered: 'Ningún registro encontrado.',
        descriptionFiltered: 'Intente ajustar los filtros.',
        cta: 'Nuevo Protocolo',
      },
      filter: {
        title: 'Filtrar Protocolos/Estación',
        name: 'Nombre',
        namePlaceholder: 'Filtrar por nombre',
        responsible: 'Responsable',
        breedingSeason: 'Estación de Monta',
        startDate: 'Fecha Inicial',
        endDate: 'Fecha Final',
      },
      deleteDialog: {
        title: '¿Eliminar protocolo/estación?',
        description: 'será eliminado permanentemente.',
        warning: 'Esta acción no se puede deshacer.',
      },
      deleteBusinessErrorToast: {
        title: 'No es posible eliminar',
        description: 'Existen apareamientos vinculados a este protocolo.',
      },
    },
    detail: {
      title: 'Protocolo/Estación',
      backButton: 'Volver',
      editButton: 'Editar',
      sections: {
        generalData: 'Datos Generales',
        timeline: 'Línea de Tiempo',
      },
      fields: {
        code: 'Código',
        date: 'Fecha',
        responsible: 'Responsable',
        breedingSeason: 'Estación de Monta',
        name: 'Nombre',
        description: 'Descripción',
      },
      notFound: {
        title: 'Protocolo/Estación no encontrado.',
        description: 'El registro pudo haber sido eliminado o el enlace es incorrecto.',
      },
      invalidParamsToast: {
        title: 'Protocolo/Estación',
        description: 'Parámetros inválidos para mostrar el detalle.',
      },
    },
    form: {
      title: {
        create: 'Nuevo Protocolo/Estación',
        edit: 'Editar Protocolo/Estación',
      },
      fields: {
        code: 'Código',
        date: 'Fecha',
        responsible: 'Responsable',
        breedingSeason: 'Estación de Monta',
        name: 'Nombre',
        description: 'Descripción',
      },
      validation: {
        dateRequired: 'Informe la fecha',
        breedingSeasonRequired: 'Informe la estación de monta',
        nameRequired: 'Informe el nombre',
        itemDateRequired: 'Informe la fecha del ítem',
        itemTimeRequired: 'Informe el horario del ítem',
        productOrServiceRequired: 'Seleccione un producto O un servicio',
        measurementRequired: 'Informe la unidad de medida',
        quantityRequired: 'Informe una cantidad válida',
        quantityExceedsStock: 'Cantidad mayor que el saldo disponible en existencia',
        itemsMinOne: 'Agregue al menos un ítem',
        itemDateBeforeDzero: 'La fecha no puede ser anterior a la primera aplicación (DZERO)',
      },
      items: {
        sectionTitle: 'Ítems del Protocolo',
        fields: {
          identification: 'Identificación',
          date: 'Fecha',
          time: 'Horario',
          warehouse: 'Almacén',
          product: 'Producto',
          service: 'Servicio',
          measurement: 'Unidad de Medida',
          stock: 'Existencia',
          quantity: 'Cantidad',
        },
        addButton: 'Agregar ítem',
        removeButton: 'Eliminar',
        removeDialog: {
          title: '¿Eliminar ítem?',
          description: 'Este ítem será eliminado del protocolo.',
          confirmButton: 'Eliminar',
        },
      },
      timelinePreview: {
        title: 'Vista Previa de la Línea de Tiempo',
        empty: 'Agregue ítems para ver la línea de tiempo.',
      },
      unsavedChangesDialog: {
        title: '¿Salir sin guardar?',
        description: 'Existen cambios no guardados en este formulario que se perderán',
        confirmButton: 'Salir sin guardar',
      },
    },
    timeline: {
      weekdays: ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'],
      emptyState: {
        title: 'Sin ítems en la línea de tiempo',
        description: 'Este protocolo aún no tiene ítems registrados.',
      },
      andSeparator: ' + ',
    },
    services: {
      insemination: 'Inseminación',
      ultrasound: 'Ultrasonido',
      pregnancyDiagnosis: 'Diagnóstico de Gestación',
      implantRemoval: 'Retiro de Implante',
    },
  },
};
