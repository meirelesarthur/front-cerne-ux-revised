// src/constants/languages/languageEsEs/languageRequestAuthorizations.ts
// Traducción ES-ES del módulo "Autorización" (RequestAuthorization —
// Administrativo / Suprimentos, esteira 97-Esteiras/038, TASK-AUTH-FE-01).

import { ModuleRequestAuthorizations } from '@/@types/language/module-request-authorizations';

export const languageRequestAuthorizations: ModuleRequestAuthorizations = {
  requestAuthorization: {
    singularLabel: 'Autorización',
    pluralLabel: 'Autorizaciones',
    titleModule: 'Autorización',
    pageTitle: 'Autorización',
    pageSubtitle: 'Solicitudes de compra a la espera de aprobación o acuse.',

    list: {
      table: {
        code: 'Código',
        status: 'Estado',
        requestDate: 'Fecha de solicitud',
        description: 'Descripción/Ticket',
        duration: 'Duración',
        requester: 'Solicitante',
        responsible: 'Responsable actual',
        farm: 'Finca',
        actions: {
          view: 'Ver',
        },
      },
      emptyState: {
        titleEmpty: 'Ninguna pendiente de autorización',
        titleFiltered: 'Ninguna solicitud encontrada',
        descriptionEmpty: 'Las solicitudes a la espera de aprobación o acuse aparecerán aquí.',
        descriptionFiltered: 'Ajuste los filtros para encontrar lo que busca.',
      },
    },

    filter: {
      title: 'Filtrar Autorizaciones',
      search: 'Buscar',
      searchPlaceholder: 'Buscar por descripción/ticket/código',
      type: 'Tipo',
      status: 'Estado',
      dateFrom: 'Fecha inicial',
      dateTo: 'Fecha final',
    },

    validation: {
      finalJustificationRequired: 'La justificación es obligatoria',
      justifyRequired: 'La justificación es obligatoria',
      justifyTooLong: 'La justificación debe tener como máximo 400 caracteres',
      authorizerRequired: 'El autorizador es obligatorio',
      responsibleRequired: 'El responsable es obligatorio',
      statusRequired: 'El estado es obligatorio',
      quantityRequired: 'La cantidad es obligatoria',
      quantityMin: 'La cantidad debe ser mayor que cero',
      commentRequired: 'El comentario es obligatorio',
      categoryRequired: 'La categoría financiera es obligatoria',
      centerRequired: 'El centro de costo es obligatorio',
      percentRequired: 'El porcentaje es obligatorio',
      percentSumInvalid: 'La suma de los porcentajes del prorrateo debe ser 100%',
    },

    detail: {
      approvalTitle: 'Autorización de Compra',
      acknowledgeTitle: 'Acusar Conocimiento',
      errorState: {
        title: 'No se pudo cargar la solicitud',
        description: 'Verifique su conexión e inténtelo de nuevo.',
        retry: 'Intentar de nuevo',
      },

      info: {
        title: 'Información de la Solicitud',
        code: 'Código',
        requestDate: 'Fecha del Pedido',
        duration: 'Duración',
        type: 'Tipo',
        priority: 'Prioridad',
        nfe: 'NF-e',
        requester: 'Solicitante',
        responsible: 'Responsable Actual',
        justification: 'Justificación',
        description: 'Descripción/Ticket',
        observation: 'Observación',
        finalizationNote: 'Observación Final',
        quotationJustification: 'Justificación de la cotización',
      },

      attachments: {
        title: 'Adjuntos',
        empty: 'Sin adjuntos.',
      },

      movements: {
        title: 'Movimientos',
      },

      items: {
        title: 'Ítems para Aprobación',
        readOnlyTitle: 'Productos/Servicios',
        hint: 'Seleccione los ítems que desea autorizar para la compra y la cotización que desea aprobar',
        recordsCount: 'N. Registros:',
        table: {
          select: 'Seleccionar',
          product: 'Producto',
          service: 'Servicio',
          serviceDescription: 'Descripción del servicio',
          description: 'Descripción',
          name: 'Nombre',
          quantity: 'Cant.',
          value: 'Valor',
          dailyQuantity: 'Cantidad de jornales',
          observation: 'Observación',
          actions: 'Acciones',
        },
        editButton: 'Editar',
        empty: 'Ninguna información registrada.',
      },

      editItem: {
        title: 'Editar Ítem',
        quantityLabel: 'Cantidad',
        submit: 'Guardar',
        toast: 'Ítem actualizado con éxito.',
      },

      quotations: {
        title: 'Cotizaciones',
        hint: 'Seleccione las formas de pago que desea de las cotizaciones',
        recordsCount: 'N. Registros:',
        table: {
          select: 'Seleccionar',
          date: 'Fecha de Cotización',
          provider: 'Proveedor',
          payment: 'Forma de pago',
          total: 'Vl.Total',
          net: 'Valor con Descuento',
          responsible: 'Responsable',
          actions: 'Acciones',
        },
        choosePaymentButton: 'Elegir la forma de pago',
        viewButton: 'Visualizar',
        empty: 'Ninguna información registrada.',
        errorState: {
          title: 'No se pudieron cargar las cotizaciones',
          description: 'Verifique su conexión e inténtelo de nuevo.',
          retry: 'Intentar de nuevo',
        },
      },

      choosePayment: {
        title: 'Formas de pago',
        table: {
          method: 'Forma de pago',
          installments: 'Cuotas',
          interval: 'Intervalo (días)',
          installmentValue: 'Valor de la Cuota',
          total: 'Total',
          actions: 'Acciones',
        },
        selectButton: 'Seleccionar',
        empty: 'Ninguna forma de pago disponible para esta cotización.',
        selectedToast: 'Forma de pago seleccionada con éxito.',
      },

      ratio: {
        title: 'Prorrateo',
        classificationLabel: 'Clasificación',
        classificationHelp:
          'CAPEX: Inversiones a largo plazo, como la adquisición de bienes que se usarán por más de un año (equipos, edificios, etc.).\nOPEX: Gastos operativos recurrentes, como salarios, alquiler, servicios, mantenimiento y otros costos diarios.',
        classificationOptions: { N: 'No Clasificado', C: 'CAPEX', O: 'OPEX' },
        harvestLabel: 'Cosecha',
        harvestPlaceholder: 'Seleccione',
        categoryLabel: 'Categoría',
        categoryPlaceholder: 'Escriba al menos 3 letras',
        categoryMinChars: 'Escriba al menos 3 letras para buscar.',
        centerLabel: 'Centro de Costo',
        centerPlaceholder: 'Seleccione',
        percentLabel: 'Porcentaje (%)',
        addRowButton: 'Agregar Ítem',
        removeRowButton: 'Quitar',
        totalLabel: 'Total',
      },

      clientValidation: {
        warningTitle: 'Atención',
        commentRequired: 'Informe un comentario',
        quotationRequired: 'Seleccione al menos una cotización',
        itemsRequired: 'Debe seleccionar los ítems para autorizar.',
        singleItemQuotations: 'Solo se puede seleccionar una cotización para autorizar un único ítem por solicitud.',
        ratioSumInvalid: 'La suma de los porcentajes del Prorrateo debe ser igual a 100.',
        categoryRequired: 'Seleccione una categoría',
        centerRequired: 'Seleccione un centro de costo',
        ratioOverflow: 'La suma de los valores de porcentaje supera el 100%.',
      },

      justify: {
        label: 'Agregar Comentario/Justificación',
        addComment: 'Agregar Comentario',
        commentToast: 'Comentario agregado con éxito.',
      },

      actions: {
        updateToast: 'Registro actualizado con éxito.',
        transfer: 'Transf. Responsable',
        transferToast: 'Solicitud modificada con éxito.',
        back: 'Volver Etapa',
        next: 'Próxima Etapa',
        reject: 'Reprobar',
        autoPromoteError: 'No se pudo actualizar la solicitud automáticamente. Recargue la página.',
      },
    },

    sendForAuthorization: {
      title: 'Enviar para Autorización',
      authorizerLabel: 'Autorizador',
      authorizerPlaceholder: 'Seleccione',
      justifyLabel: 'Comentario/Justificación',
      emptyEligibleState: {
        description: 'Ningún autorizador elegible por el momento para esta solicitud.',
      },
      sendButton: 'Enviar',
    },
  },
};
