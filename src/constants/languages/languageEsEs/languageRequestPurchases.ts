// src/constants/languages/languageEsEs/languageRequestPurchases.ts
// Traducción es-ES del módulo "Solicitud de Compra" (RequestPurchase —
// Administrativo / Suministros, esteira 97-Esteiras/022, TASK-RP-FE-03). Ver
// `@/@types/language/module-request-purchases` para el contrato completo.

import { ModuleRequestPurchases } from '@/@types/language/module-request-purchases';

export const languageRequestPurchases: ModuleRequestPurchases = {
  requestPurchase: {
    singularLabel: 'Solicitud de Compra',
    pluralLabel: 'Solicitudes de Compra',
    titleModule: 'Solicitudes de Compra',

    // ADITIVO (TASK-CQ-FE-15) — ver nota en
    // `ModuleRequestPurchases.requestPurchase.legend`.
    legend: {
      label: 'Leyenda',
    },

    list: {
      pageTitle: 'Solicitudes de Compra',
      pageSubtitle: 'Gestione las solicitudes de compra de la finca.',
      table: {
        code: 'Código',
        type: 'Tipo',
        requestDate: 'Fecha de Pedido',
        justification: 'Descripción/Ticket',
        duration: 'Duración',
        requester: 'Solicitante',
        responsible: 'Responsable Actual',
        farm: 'Hacienda',
        status: 'Estado',
        priority: 'Prioridad',
        quotations: 'Cotizaciones',
        actions: {
          view: 'Visualizar',
          edit: 'Editar',
          delete: 'Eliminar',
        },
      },
      emptyState: {
        titleEmpty: 'Ninguna solicitud registrada',
        titleFiltered: 'Ninguna solicitud encontrada',
        descriptionEmpty: 'Registre la primera Solicitud de Compra.',
        descriptionFiltered: 'Ajuste los filtros para encontrar lo que busca.',
        cta: 'Nueva Solicitud',
      },
      deletedToast: 'Registro eliminado con éxito.',
      deleteConfirm: {
        title: '¿Está seguro?',
        description: '¡Una vez eliminado, no podrá recuperar este ítem!',
        confirm: 'Eliminar',
        cancel: 'Cancelar',
      },
    },

    filter: {
      title: 'Filtrar Solicitudes',
      search: 'Buscar',
      searchPlaceholder: 'Buscar por justificación',
      type: 'Tipo',
      status: 'Estado',
      dateFrom: 'Fecha inicial',
      dateTo: 'Fecha final',
      farm: 'Hacienda',
      requester: 'Solicitante',
      priority: 'Prioridad',
      responsible: 'Responsable',
    },

    form: {
      title: {
        create: 'Nueva Solicitud de Compra',
        edit: 'Editar Solicitud de Compra',
        view: 'Visualizar Solicitud de Compra',
      },
      subtitle: {
        create: 'Registre una nueva solicitud de compra.',
        edit: 'Actualice los datos de la solicitud de compra.',
        view: 'Visualice los datos de la solicitud de compra.',
      },
      tabs: {
        general: 'Datos Generales',
        items: 'Ítems',
        attachments: 'Adjuntos',
        history: 'Historial',
        quotations: 'Cotizaciones',
      },
      fields: {
        type: 'Tipo',
        requestDate: 'Fecha del Pedido',
        justification: 'Justificación',
        description: 'Descripción/Ticket',
        priority: 'Prioridad',
        authorizer: 'Encargado',
        harvest: 'Cosecha',
        nfe: 'Factura',
        observation: 'Observación',
        code: 'Código',
        requester: 'Solicitante',
      },
      placeholders: {
        type: 'Seleccione el tipo',
        justification: 'Describa el motivo de la solicitud',
        description: 'Describa los detalles de la solicitud',
        authorizer: 'Seleccione el encargado',
        harvest: 'Busque una cosecha',
        nfe: 'Número de la factura',
        observation: 'Notas adicionales',
      },
      itemsSection: {
        addButton: '+ Agregar Ítem',
        removeButton: 'Eliminar',
        emptyLabel: 'Ningún ítem agregado',
        fields: {
          product: 'Producto',
          quantity: 'Cantidad',
          amount: 'Valor',
          name: 'Nombre',
          nif: 'CPF',
          phone: 'Teléfono',
          description: 'Descripción',
          observation: 'Observación',
          serviceDescription: 'Descripción del Servicio',
          contractServiceDescription: 'Descripción de servicios',
          dailyQuantity: 'Cantidad de Jornadas',
          deliveryDate: 'Fecha de Entrega',
        },
      },
      attachmentsSection: {
        addButton: '+ Agregar Adjunto',
        removeButton: 'Eliminar',
        emptyLabel: 'Ningún adjunto agregado',
        fields: {
          name: 'Descripción del Adjunto',
          file: 'Archivo',
        },
        // ADITIVO (TASK-RP-FE-07) — ver nota en
        // `@/@types/language/module-request-purchases`.
        fileUpload: {
          dropzoneTitle: 'Arrastre un archivo o haga clic para seleccionar',
          dropzoneDraggingTitle: 'Suelte el archivo aquí',
          changeFileLabel: 'Cambiar archivo',
          removeFileLabel: 'Eliminar archivo',
          replaceFileLabel: 'Sustituir archivo',
          existingFileLabel: 'Archivo actual',
          errorTypeMessage: 'Tipo de archivo no aceptado.',
          errorSizeMessage: 'El archivo excede el tamaño máximo.',
        },
      },
      historySection: {
        emptyLabel: 'Ningún trámite registrado',
        columns: {
          status: 'Estado',
          justify: 'Descripción/Justificación',
          user: 'Responsable',
          date: 'Fecha',
          elapsed: 'Tiempo Empleado',
        },
      },
      guards: {
        addBlockedTitle: 'Atención',
        addBlockedDescription: 'Complete todos los campos antes de agregar nuevos.',
        removeConfirmTitle: '¿Está seguro?',
        removeConfirmDescription: '¿Realmente desea eliminar este ítem?',
        removeConfirm: 'Eliminar',
        removeCancel: 'Cancelar',
        lastItemTitle: 'Atención',
        lastItemDescription: 'Debe tener al menos un ítem en la lista',
        productAdd: 'Registrar producto',
        productEdit: 'Editar producto',
      },
      viewSections: {
        classification: 'Clasificación',
        classificationOptions: { N: 'No Clasificado', C: 'CAPEX', O: 'OPEX' },
        financialDueDate: 'Venc. Financiero',
        finalizationNote: 'Observación Final',
        responsible: 'Responsable Actual',
        duration: 'Duración',
        priority: 'Prioridad',
        type: 'Tipo',
        authorizationTitle: 'Autorización',
        authorizationDate: 'Fecha de Autorización',
        finalJustification: 'Comentario de Aprobación',
        authorizer: 'Autorizador',
        receiptTitle: 'Recepción',
        receiptDate: 'Fecha de Recepción',
        receiptNote: 'Observación de Recepción',
        childrenTitle: 'Sub Solicitudes',
        ratioTitle: 'Prorrateo',
        ratioCategory: 'Categoría',
        ratioCenter: 'Centro de Costo',
        ratioPercent: 'Porcentaje',
        approvedQuotationTitle: 'Cotización Aprobada',
        notInformed: 'No informado',
      },
      // ADITIVO (TASK-RP-FE-09) — ver nota en
      // `@/@types/language/module-request-purchases`.
      hints: {
        typeLockedOnEdit:
          'El tipo no se puede cambiar después de crear la solicitud (regla de negocio, no un problema de permisos).',
        authorizerLoadError: 'No se pudo cargar los encargados.',
        codePreview: 'Código previsto; el definitivo se asigna al guardar.',
        codePreviewUnavailable: 'No se pudo calcular el código previsto.',
      },
      validation: {
        typeRequired: 'El tipo es obligatorio',
        requestDateRequired: 'La Fecha de Solicitud es obligatoria',
        justificationRequired: 'La Justificación es obligatoria',
        justificationMaxLength: 'La Justificación debe tener como máximo 800 caracteres',
        descriptionRequired: 'La Descripción es obligatoria',
        descriptionMaxLength: 'La Descripción debe tener como máximo 800 caracteres',
        itemsMinOne: 'Agregue al menos un ítem',
        productRequiredForType: 'El Producto es obligatorio para este tipo de solicitud',
        quantityRequiredForType: 'La Cantidad es obligatoria para este tipo de solicitud',
        amountRequiredForType: 'El Valor es obligatorio para este tipo de solicitud',
        nameRequiredForType: 'El Nombre es obligatorio para este tipo de solicitud',
        nifRequiredForType: 'El NIF es obligatorio para este tipo de solicitud',
        phoneRequiredForType: 'El Teléfono es obligatorio para este tipo de solicitud',
        descriptionRequiredForType: 'Descripción es obligatoria para este tipo de solicitud',
        serviceDescriptionRequiredForType:
          'La Descripción del Servicio es obligatoria para este tipo de solicitud',
        dailyQuantityRequiredForType:
          'La Cantidad de Jornadas es obligatoria para este tipo de solicitud',
        attachmentFileRequiredForType: 'El Archivo es obligatorio para este tipo de solicitud',
        attachmentNameRequiredWithFile:
          'La Descripción del Adjunto es obligatoria cuando hay un archivo',
        nifMaxLength: 'El NIF debe tener como máximo 20 caracteres',
        phoneMaxLength: 'El Teléfono debe tener como máximo 15 caracteres',
        fileMaxLength: 'El Archivo debe tener como máximo 10240 KB',
        observationMaxLength: 'La Observación debe tener como máximo 800 caracteres',
        itemDescriptionMaxLength: 'La descripción del ítem debe tener como máximo 60 caracteres',
        itemServiceDescriptionMaxLength: 'La descripción del servicio debe tener como máximo 200 caracteres',
        itemObservationMaxLength: 'La observación del ítem debe tener como máximo 90 caracteres',
        authorizerRequired: 'Seleccione el Encargado',
        attachmentsMinOne: 'Agregue al menos un adjunto',
        attachmentNameRequiredForType: 'La Descripción del Adjunto es obligatoria para este tipo de solicitud',
        attachmentNameMaxLength: 'La Descripción del Adjunto debe tener como máximo 120 caracteres',
      },
    },

    actions: {
      receiveToast: 'Solicitud recibida con éxito.',
      transferToast: 'Solicitud transferida con éxito.',
      changeStatusToast: 'Estado modificado con éxito.',
      finishToast: 'Solicitud finalizada con éxito.',
      createdWithCodeToast: 'Solicitud {code} creada con éxito.',
      quotationJustificationToast: 'Justificación de cotización agregada con éxito.',
      transferJustifyRequired: 'La justificación es obligatoria para transferir',
      changeStatusRequired: 'Seleccione el nuevo estado',
      // ADITIVO (TASK-RP-FE-09) — ver nota en
      // `@/@types/language/module-request-purchases`.
      receiveButton: 'Recibir',
      transferButton: 'Transferir',
      changeStatusButton: 'Volver Etapa',
      finishButton: 'Finalizar',
      quotationJustificationButton: 'Justificación de Cotización',
      transferDialogTitle: 'Transferir Solicitud',
      transferJustifyLabel: 'Justificación de la Transferencia',
      changeStatusDialogTitle: 'Cambiar Estado de la Solicitud',
      changeStatusNewStatusLabel: 'Nuevo Estado',
      changeStatusJustifyLabel: 'Justificación',
      quotationJustificationDialogTitle: 'Agregar Justificación de Cotización',
      quotationJustificationLabel: 'Justificación de Cotización',
    },

    typeOptions: {
      produto: 'Producto',
      servico: 'Servicio',
      adiantamento: 'Anticipo',
      reembolso: 'Reembolso',
      diaria: 'Jornada',
      empreitada: 'Contrata',
      compraEfetuada: 'Compra Efectuada',
      frete: 'Flete',
      manutencao: 'Mantenimiento',
      emergencial: 'Emergencia',
      despesaFixa: 'Gasto Fijo',
    },

    statusOptions: {
      solicitacao: 'Solicitud',
      cotacaoEmAndamento: 'Cotización en Curso',
      aguardandoAprovacao: 'Esperando Aprobación',
      aguardandoCiencia: 'Esperando Conocimiento',
      pedidoNaoAprovado: 'Pedido No Aprobado',
      aguardandoCompra: 'Esperando Compra',
      compraEfetuada: 'Compra Efectuada',
      compraRecebida: 'Compra Recibida',
      pedidoFinalizado: 'Pedido Finalizado',
      pedidoCancelado: 'Pedido Cancelado',
      analisarProcesso: 'Analizar Proceso',
    },

    priorityOptions: {
      alta: 'Alta',
      media: 'Media',
      baixa: 'Baja',
    },

    // ADITIVO (TASK-RP-FE-02) — labels del enum `RequestItemStatus`, ver nota
    // en `ModuleRequestPurchases.requestPurchase.itemStatusOptions`.
    itemStatusOptions: {
      pendente: 'Pendiente',
      entregue: 'Entregado',
      cancelado: 'Cancelado',
    },

    // ADITIVO (TASK-RP-FE-13, GRUPO B) — ver nota en
    // `ModuleRequestPurchases.requestPurchase.myProcesses`.
    myProcesses: {
      titleModule: 'Mis Procesos',
      pageTitle: 'Mis Procesos',
      pageSubtitle: 'Solicitudes de compra bajo su responsabilidad.',
      emptyState: {
        titleEmpty: 'Ningún proceso bajo su responsabilidad',
        descriptionEmpty: 'Las solicitudes asignadas a usted aparecerán aquí.',
      },
      table: {
        quotationsReceived: 'Cot. Recibidas',
      },
      actions: {
        view: 'Ver',
        changeStatus: 'Volver Etapa',
        slaReport: 'Informe SLA',
        // ADENDO (`TASK-MP-FE-03`) — 2 claves NUEVAS; las demás 5 acciones
        // del dropdown completo reusan claves ya existentes (ver nota en el tipo).
        quote: 'Cotizar Pedido',
        sendForApproval: 'Enviar para Aprobación',
        // ADENDO (`TASK-MP-FE-04`) — 2 claves NUEVAS; "Editar" reusa
        // `list.table.actions.edit`, ya existente (cero duplicación).
        authorize: 'Autorizar',
        acknowledge: 'Acusar Recibo',
      },
    },

    // ADITIVO (TASK-RP-FE-13, GRUPO B) — ver nota en
    // `ModuleRequestPurchases.requestPurchase.rejected`.
    rejected: {
      titleModule: 'Rechazados y Cancelados',
      pageTitle: 'Rechazados / Cancelados',
      pageSubtitle: 'Solicitudes de compra rechazadas o canceladas.',
      emptyState: {
        titleEmpty: 'Ninguna solicitud rechazada o cancelada',
        descriptionEmpty: 'Las solicitudes rechazadas o canceladas aparecerán aquí.',
      },
      actions: {
        slaReport: 'Informe SLA',
      },
    },

    // ADITIVO (TASK-CQ-FE-13) — ver nota en
    // `ModuleRequestPurchases.requestPurchase.inQuotation`.
    inQuotation: {
      titleModule: 'Cotizaciones',
      pageTitle: 'Cotizaciones',
      pageSubtitle: 'Solicitudes de compra en cotización en toda la finca.',
      emptyState: {
        titleEmpty: 'Ninguna solicitud en cotización',
        descriptionEmpty: 'Las solicitudes en cotización aparecerán aquí.',
      },
    },

    // ADITIVO (TASK-CPS-FE-01, esteira 036) — ver nota en
    // `ModuleRequestPurchases.requestPurchase.inPurchase`.
    inPurchase: {
      titleModule: 'Compras',
      pageTitle: 'Compras',
      pageSubtitle: 'Solicitudes de compra en compra en toda la finca.',
      emptyState: {
        titleEmpty: 'Ninguna solicitud en compra',
        descriptionEmpty: 'Las solicitudes en compra aparecerán aquí.',
      },
      table: {
        duration: 'Duración',
      },
      actions: {
        view: 'Ver Solicitud',
        whatsapp: 'Enviar por WhatsApp',
        email: 'Enviar por Correo',
        downloadPdf: 'Descargar PDF',
        sendOrder: 'Enviar pedido de compras.',
        informStatus: 'Informar Estado',
        createSubRequest: 'Crear Sub Solicitud',
        // ADITIVO (TASK-CPS-FE-06) — el diálogo reaprovecha `actions.changeStatus*`.
        changeStatus: 'Volver Etapa',
      },
      dialogs: {
        // ADITIVO (TASK-CPS-FE-06) — solo el estado vacío es propio de esta cola.
        changeStatus: {
          noTransitions: 'Ninguna transición de estado disponible para esta solicitud.',
        },
        informStatus: {
          title: 'Informar Estado de la Compra',
          fields: {
            status: 'Estado',
            financialDueDate: 'Venc. Financiero',
            justify: 'Observaciones',
            itemDeliveryDates: 'Fechas de Previsión de los Ítems',
            code: 'Código',
            responsible: 'Responsable',
            itemsTitle: 'Ítems de la Solicitud',
            itemColumns: {
              item: 'Ítem',
              quantity: 'Cantidad',
              description: 'Descripción',
              deliveryDate: 'Fecha de Entrega',
            },
          },
          statusOptions: {
            effected: 'Compra Efectuada',
            cancelled: 'Pedido Cancelado',
          },
          validation: {
            statusRequired: 'El estado es obligatorio',
            justifyRequired: 'La justificación es obligatoria',
            justifyMax: 'La justificación debe tener como máximo 400 caracteres',
          },
        },
        separate: {
          title: 'Crear Sub Solicitud',
          subtitle:
            'Seleccione la cotización y los productos/servicios que irán a la sub solicitud.',
          selectAll: 'Seleccionar todos',
          deselectAll: 'Deseleccionar todos',
          selectedCount: 'ítems seleccionados',
          itemsMinError: 'Seleccione al menos un ítem',
          confirmButton: 'Crear Sub Solicitud',
          headerTitle: 'Información del Pedido',
          observation: 'Observaciones',
          finalizationNote: 'Observación Final',
          movementsTitle: 'Movimientos',
          quotationsTitle: 'Cotizaciones',
        },
      },
      toasts: {
        informStatusSuccess: 'Registro actualizado con éxito.',
        separateSuccess: 'Sub solicitud creada con éxito.',
        whatsappGenerating: 'Generando enlace de WhatsApp...',
        emailQueued: 'Correo en cola para envío.',
        pdfReady: 'PDF listo para descargar.',
        actionError: 'No se pudo completar la acción. Inténtelo de nuevo.',
      },
    },

    // ADITIVO (execução 081, T-081-FE-01) — ver nota em
    // `ModuleRequestPurchases.requestPurchase.supply`.
    supply: {
      columns: {
        code: 'Código',
        type: 'Tipo',
        requestDate: 'Fecha del Pedido',
        description: 'Descripción/Ticket',
        duration: 'Duración',
        requester: 'Solicitante',
        responsible: 'Responsable Actual',
        responsibleShort: 'Resp. Actual',
        farm: 'Finca',
        action: 'Acción',
        receivedQuotations: 'Cot. Recibidas',
        nfe: 'N.º Factura',
        updatedAt: 'Fecha de Actualización',
        launched: 'Registrado',
      },
      filters: {
        searchPlaceholder: 'Buscar por descripción/ticket/código',
        status: 'Estado',
        type: 'Tipo',
        farm: 'Finca',
        requester: 'Solicitante',
        priority: 'Prioridad',
        dateStart: 'Pedido / Fecha Inicio',
        dateEnd: 'Pedido / Fecha Fin',
        responsible: 'Responsable Actual',
        apply: 'Filtrar',
        clear: 'Limpiar',
      },
      list: {
        empty: 'Ninguna información registrada.',
        recordsCount: 'N.º de Registros: {total}',
        legend: 'Leyenda',
        redoIndicator: 'Rehacer',
      },
      actions: {
        view: 'Ver',
        slaReport: 'Informe SLA',
        edit: 'Editar',
        delete: 'Eliminar',
        receive: 'Recibir Solicitud',
        transfer: 'Transferir Responsable',
        stepBack: 'Volver Etapa',
        quote: 'Cotizar Pedido',
        sendToAuthorization: 'Enviar a Autorización',
        authorize: 'Autorizar',
        acknowledge: 'Dar conocimiento',
        informStatus: 'Informar Estado',
        createSub: 'Crear Sub Solicitud',
        downloadFile: 'Descargar Archivo',
        confirmReceipt: 'Confirmar Recepción',
        generateFinancial: 'Generar Financiero',
        finalize: 'Finalizar Pedido',
        quotationsMap: 'Mapa de Cotizaciones',
      },
      transferDialog: {
        title: 'Transferir Responsable',
        newResponsible: 'Nuevo Responsable',
        newResponsiblePlaceholder: 'Seleccione',
        justify: 'Justificación',
        required: 'Este campo debe completarse.',
        noUsers: 'Ningún usuario disponible',
        loadError: 'No se pudieron cargar los usuarios.',
        retry: 'Intentar de nuevo',
        success: 'Solicitud modificada con éxito.',
      },
      stepBackDialog: {
        title: 'Volver Etapa de la Solicitud',
        code: 'Código',
        requestDate: 'Fecha del Pedido',
        duration: 'Duración',
        requester: 'Solicitante',
        farm: 'Finca',
        currentStatus: 'Estado Actual',
        newStatus: 'Cambiar a Estado',
        newStatusPlaceholder: 'Seleccione',
        justify: 'Justificación',
        justifyRequired: 'La justificación debe completarse.',
        noTransitions: 'No hay etapa anterior disponible para esta solicitud.',
        loadError: 'No se pudieron cargar los usuarios.',
        retry: 'Intentar de nuevo',
        success: '¡Estado actualizado con éxito!',
        error: '¡Ocurrió un error al actualizar el estado de la solicitud!',
        cancel: 'Cancelar',
        save: 'Guardar',
      },
      deniedModal: {
        title: 'Sus solicitud(es) fueron denegada(s):',
        link: 'Haga clic aquí para ver',
        close: 'Cerrar',
      },
      quotationsMap: {
        button: 'Mapa de Cotizaciones',
        downloading: 'Generando el Mapa de Cotizaciones...',
        success: 'Mapa de Cotizaciones generado con éxito.',
        filename: 'mapa-de-cotizaciones.xlsx',
      },
    },
  },
};
