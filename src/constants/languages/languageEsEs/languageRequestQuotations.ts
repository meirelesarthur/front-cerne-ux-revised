// src/constants/languages/languageEsEs/languageRequestQuotations.ts
// Traducción es-ES del módulo "Cotações" (RequestQuotation — Administrativo /
// Suprimentos, esteira 97-Esteiras/035, TASK-CQ-FE-01). Ver
// `@/@types/language/module-request-quotations` para el contrato completo.

import { ModuleRequestQuotations } from '@/@types/language/module-request-quotations';

export const languageRequestQuotations: ModuleRequestQuotations = {
  requestQuotation: {
    singularLabel: 'Cotización',
    pluralLabel: 'Cotizaciones',

    form: {
      fields: {
        provider: 'Proveedor',
        branch: 'Sucursal',
        requiresFile: 'Exigir información técnica del producto',
        note: 'Observación',
      },
      placeholders: {
        provider: 'Busque un proveedor',
        branch: 'Seleccione la sucursal',
        branchNoProvider: 'Seleccione un proveedor primero',
        note: 'Observaciones adicionales',
      },
      requiresFileOptions: {
        yes: 'Sí',
        no: 'No',
      },
      validation: {
        providerRequired: 'Proveedor es obligatorio',
        requiresFileRequired: 'Requiere Archivo es obligatorio',
      },

      createTitle: 'Agregar Proveedor',
      editTitle: 'Editar Cotización',
      createdToast: 'Cotización creada con éxito!',
      updatedToast: 'Cotización actualizada con éxito!',
      errorFallback: 'No fue posible guardar la cotización.',
    },

    statusOptions: {
      aguardando: 'Esperando',
      enviada: 'Enviada',
      recebida: 'Recibida',
    },

    paymentMethodOptions: {
      aVista: 'Al Contado',
      boleto: 'Boleto',
      cartao: 'Tarjeta',
      pix: 'Pix',
      cheque: 'Cheque',
    },

    tab: {
      title: 'Cotizaciones',
      addProviderButton: 'Agregar Proveedor',
      sendEmailBatchButton: 'Enviar Correo en Lote',
      emptyState: {
        title: 'Aún no hay cotizaciones',
        description: 'Agregue un proveedor para empezar a cotizar esta solicitud.',
      },
      card: {
        selectAriaLabel: 'Seleccionar cotización',
        fields: {
          creator: 'Responsable',
          totalValue: 'Valor',
          netValue: 'Valor con Descuento',
          saving: 'Saving',
          savingResponsible: 'Responsable del Saving',
        },
        actions: {
          view: 'Ver',
          edit: 'Editar',
          editObservation: 'Editar Observación',
          applySaving: 'Aplicar Saving',
          sendForAuthorization: 'Enviar para Autorización',
          delete: 'Eliminar',
        },
      },
      deleteDialog: {
        title: 'Eliminar Cotización',
        description: '¿Está seguro de que desea eliminar la cotización de',
        warning: 'Esta acción no se puede deshacer.',
      },
      deletedToast: 'Cotización eliminada con éxito!',
      deleteErrorFallback: 'No fue posible eliminar la cotización.',
    },

    stage: {
      itemsBlock: {
        title: 'Ítems',
        blockedNotice: 'Informe todos los productos para continuar con la cotización',
        columns: { product: 'Producto', quantity: 'Cantidad', description: 'Descripción' },
        saveButton: 'Guardar',
        savedToast: 'Registro actualizado con éxito.',
        errorFallback: 'No fue posible actualizar los ítems.',
        quantityRequired: 'Este campo debe ser completado.',
        descriptionRequired: 'Este campo debe ser completado.',
        loadError: 'No fue posible cargar los ítems de la solicitud.',
        retry: 'Intentar de nuevo',
      },
      providerBoard: {
        title: 'Sobre el proveedor',
        corporateName: 'Razón Social',
        tradeName: 'Nombre Comercial',
        email: 'E-mail',
        phone: 'Teléfono',
        cellphone: 'Celular',
        city: 'Ciudad',
        loading: 'Cargando datos del proveedor...',
        loadError: 'No fue posible cargar los datos del proveedor.',
      },
      whatsAppModal: {
        title: 'Enviar mensajes',
        column: 'Proveedor/Vendedor',
        close: 'Cerrar',
        sendTo: 'Enviar mensaje a',
        supplierTag: 'Proveedor',
      },
      separate: {
        title: 'Crear Sub Solicitud',
        description:
          'Seleccione los productos/servicios que irán a la sub solicitud. Los demás permanecen en esta solicitud.',
        requestLabel: 'Solicitud',
        itemsLabel: 'Ítems',
        searchPlaceholder: 'Buscar ítem',
        selectAllLabel: 'Marcar todos',
        deselectAllLabel: 'Desmarcar todos',
        selectedCountLabel: 'Seleccionados',
        emptyLabel: 'Ningún ítem encontrado.',
        itemsRequired: 'Seleccione al menos un ítem',
        loadError: 'No fue posible cargar los ítems de la solicitud.',
        retry: 'Intentar de nuevo',
        submit: 'Guardar',
        successToast: 'Sub solicitud creada con éxito.',
        createdCode: 'Código de la nueva solicitud',
      },
      queue: {
        receivedToast: 'Solicitud recibida con éxito.',
        redoTooltip: 'Rehacer',
      },
    },

    detail: {
      title: 'Detalles de la Cotización',
      fields: {
        quotationDate: 'Fecha de la Cotización',
        expirationDate: 'Fecha de Expiración',
        providerResponsible: 'Responsable (Proveedor)',
        observation: 'Observación del Proveedor',
      },
      pendingReceiptNotice:
        'Los ítems y formas de pago quedan disponibles después de que el proveedor responda la cotización.',
      itemsSection: {
        title: 'Ítems',
        empty: 'Ningún ítem informado.',
        columns: {
          description: 'Descripción',
          brand: 'Marca',
          quantity: 'Cantidad',
          unitaryValue: 'Valor Unitario',
          total: 'Total',
          observation: 'Observación',
        },
      },
      paymentsSection: {
        title: 'Formas de Pago',
        empty: 'Ninguna forma de pago informada.',
        columns: {
          paymentMethod: 'Forma de Pago',
          installments: 'Cuotas',
          interval: 'Intervalo (días)',
          installmentValue: 'Valor de la Cuota',
          total: 'Total',
        },
      },
      errorState: {
        title: 'No fue posible cargar la cotización',
        description: 'Ocurrió un error al buscar los detalles de esta cotización.',
        retry: 'Intentar de nuevo',
      },
    },

    saving: {
      title: 'Aplicar Saving',
      fields: {
        responsible: 'Responsable',
        netValue: 'Valor con Descuento',
        netValueHelper:
          'Valor final de la cotización después del descuento negociado con el proveedor.',
        savingPreview: 'Saving (%)',
      },
      placeholders: {
        responsible: 'Busque un responsable',
      },
      validation: {
        responsibleRequired: 'Responsable es obligatorio',
        discountRequired: 'Valor con Descuento es obligatorio',
        discountMin: 'Valor con Descuento no puede ser negativo',
        discountMustBeLessThanTotal:
          'Valor con Descuento debe ser menor que el valor total de la cotización',
      },
      applyButton: 'Aplicar Saving',
      appliedToast: 'Saving aplicado con éxito!',
      errorFallback: 'No fue posible aplicar el saving.',
    },

    authorizer: {
      title: 'Enviar para Autorización',
      fields: {
        authorizer: 'Autorizador',
      },
      placeholders: {
        authorizer: 'Seleccione un autorizador',
      },
      validation: {
        authorizerRequired: 'Autorizador es obligatorio',
      },
      emptyEligibleState: {
        title: 'Ningún autorizador elegible',
        description: 'No hay autorizadores disponibles para esta solicitud en este momento.',
      },
      loadErrorState: {
        title: 'No fue posible cargar los autorizadores',
        description: 'Ocurrió un error al buscar los autorizadores elegibles.',
        retry: 'Intentar de nuevo',
      },
      sendButton: 'Enviar',
      sentToast: 'Solicitud enviada para autorización con éxito!',
      errorFallback: 'No fue posible enviar para autorización.',
    },

    emailBatch: {
      title: 'Enviar E-mail en Lote',
      description:
        'Seleccione los destinatarios de cada cotización seleccionada. Las cotizaciones sin ningún destinatario marcado no recibirán e-mail.',
      providerRecipient: {
        label: 'Incluir e-mail del proveedor',
        noEmailNotice: 'Proveedor sin e-mail registrado.',
      },
      sellers: {
        label: 'Vendedores',
        searchPlaceholder: 'Buscar vendedor',
        selectAllLabel: 'Marcar todos',
        deselectAllLabel: 'Desmarcar todos',
        selectedCountLabel: 'Seleccionados',
        emptyLabel: 'Ningún vendedor registrado para este proveedor.',
        loadErrorLabel: 'Error al cargar los vendedores del proveedor.',
        retryLabel: 'Intentar de nuevo',
      },
      noRecipientsSelected:
        'Ningún destinatario seleccionado — esta cotización no recibirá e-mail.',
      emptySelectionError: 'Seleccione un proveedor.',
      submitButton: 'Enviar E-mails',
      sentToast: 'E-mails enviados con éxito',
      errorFallback: 'No fue posible enviar los e-mails en lote.',
      invalidEmailsError: {
        line: 'Proveedor {value} sin e-mail registrado.',
        title: 'E-mails inválidos encontrados',
        description:
          'Uno o más destinatarios seleccionados no poseen e-mail válido registrado. Corrija el registro del proveedor/vendedor e intente de nuevo.',
      },
    },

    whatsApp: {
      buttonLabel: 'Enviar mensaje por WhatsApp',
      messageTitle: 'Solicitud de cotización',
      farmLabel: 'Finca',
      purchaseCodeLabel: 'Código de la solicitud:',
      descriptionLabel: 'Descripción/Llamado:',
      providerLabel: 'Proveedor:',
      invitationText:
        'Nos gustaría, a través de este contacto, solicitar la cotización de los ítems listados en el formulario disponible en el enlace al final de este mensaje.',
      emailAvailableText: 'El mismo ya está disponible en el e-mail',
      fillInstructions:
        'Complete la información con atención, el formulario solo podrá enviarse una vez.',
      regardsLabel: 'Atentamente:',
      formLinkLabel: 'Enlace del formulario:',
      providerMissingError: 'No se encontraron los datos del proveedor.',
    },

    publicForm: {
      pageTitle: 'Formulario de Cotización',
      requestHeader: 'Solicitud Nº {code} - {farm}',
      descriptionLabel: 'Descripción/Llamado:',
      providerLabel: 'Proveedor:',
      fields: {
        itemProduct: 'Producto',
        itemService: 'Servicios',
        totalValue: 'Vl.Total',
        quotationNote: 'Observación',
        quantity: 'Cantidad',
        brand: 'Marca',
        unitaryValue: 'Valor Unitario',
        amount: 'Valor Total',
        observation: 'Observación',
        reponsible: 'Responsable (Proveedor)',
        expirationDate: 'Fecha de Validez de la Cotización',
        file: 'Adjunto',
      },
      requiresFileAlert:
        'Esta cotización exige que se envíe el adjunto con la información técnica del producto',
      placeholders: {
        brand: 'Marca del producto',
        observation: 'Observaciones sobre este ítem',
        reponsible: 'Nombre de quien responde',
      },
      paymentsSection: {
        title: 'Condiciones de Pago',
        addButton: 'Agregar Condición',
        removeButton: 'Eliminar',
        emptyLabel: 'Ninguna condición de pago informada.',
        cannotRemoveLastRow: 'Debe tener al menos un elemento en la lista',
        incompleteRow: 'Complete todos los campos antes de agregar nuevos.',
        removeConfirm: {
          title: '¿Está seguro?',
          text: '¿Realmente desea eliminar este elemento?',
        },
        fields: {
          paymentMethod: 'Forma de Pago',
          installments: 'Cuotas',
          interval: 'Intervalo (días)',
          total: 'Valor Total',
          amount: 'Valor/Cuota',
        },
        placeholders: {
          paymentMethod: 'Seleccione la forma de pago',
        },
      },
      fileUpload: {
        dropzoneTitle: 'Arrastre un archivo o haga clic para seleccionar',
        dropzoneDraggingTitle: 'Suelte el archivo aquí',
        changeFileLabel: 'Cambiar archivo',
        removeFileLabel: 'Eliminar archivo',
        replaceFileLabel: 'Sustituir archivo',
        existingFileLabel: 'Archivo actual',
        errorTypeMessage: 'Tipo de archivo no aceptado. Envíe un PDF.',
        errorSizeMessage: 'El archivo supera el tamaño máximo permitido (20MB).',
      },
      validation: {
        reponsibleRequired: 'Responsable es obligatorio',
        reponsibleMax: 'Responsable debe tener como máximo 120 caracteres',
        expirationDateRequired: 'Fecha de Validez es obligatoria',
        expirationDateInvalid: 'Fecha de Validez inválida',
        expirationDateMin: 'Fecha de Validez no puede ser anterior a hoy',
        fileRequired: 'Adjunto es obligatorio',
        unitaryValueRequired: 'Valor Unitario es obligatorio',
        brandRequired: 'Marca es obligatoria',
        observationMax: 'Observación debe tener como máximo 60 caracteres',
        paymentsMinOne: 'Informe al menos una condición de pago',
        paymentMethodRequired: 'Forma de Pago es obligatoria',
        installmentsRequired: 'Cuotas es obligatorio',
        installmentsMin: 'Cuotas debe ser como mínimo 1',
        intervalRequired: 'Intervalo es obligatorio',
        intervalMin: 'Intervalo no puede ser negativo',
        totalValueMin: 'El valor debe ser mayor que cero',
      },
      submitButton: 'Enviar Cotización',
      submittedToast: 'Cotización enviada con éxito!',
      errorFallback: 'No fue posible enviar la cotización.',
      loadingState: 'Cargando formulario de cotización...',
      notFoundState: {
        title: 'Formulario no encontrado',
        description:
          'El enlace accedido es inválido. Verifique el enlace recibido e inténtelo de nuevo.',
      },
      loadErrorState: {
        title: 'No fue posible cargar el formulario',
        description: 'Ocurrió un error al buscar los datos de esta cotización.',
        retry: 'Intentar de nuevo',
      },
      alreadySubmittedState: {
        title: 'Cotización Finalizada.',
        description: '',
      },
      rateLimitedError:
        'Demasiados intentos en poco tiempo. Espere unos instantes e intente de nuevo.',
    },
  },
};
