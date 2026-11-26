// src/constants/languages/languageEsEs/languageRequestReceipts.ts
// Traducción es-ES del módulo "Recepciones" (RequestReceipt — Administrativo /
// Suministros, esteira 97-Esteiras/040, TASK-RCB-FE-00). Ver
// `@/@types/language/module-request-receipts` para el contrato completo.

import { ModuleRequestReceipts } from '@/@types/language/module-request-receipts';

export const languageRequestReceipts: ModuleRequestReceipts = {
  requestReceipt: {
    singularLabel: 'Recepción',
    pluralLabel: 'Recepciones',
    titleModule: 'Recepciones',
    pageTitle: 'Recepciones',
    pageSubtitle: 'Gestione la confirmación de recepción de las solicitudes de compra.',

    list: {
      table: {
        code: 'Código',
        type: 'Tipo',
        status: 'Estado',
        requestDate: 'Fecha del Pedido',
        description: 'Descripción/Ticket',
        nfe: 'Factura',
        duration: 'Duración',
        requester: 'Solicitante',
        responsible: 'Responsable Actual',
        farm: 'Finca',
        updatedOn: 'Actualizado el',
        launched: 'Registrado',
        actions: 'Acciones',
      },
      launchedYes: 'Registrado',
      launchedNo: 'Pendiente',
      emptyState: {
        titleEmpty: 'Ninguna recepción registrada',
        titleFiltered: 'Ninguna recepción encontrada',
        descriptionEmpty: 'Las recepciones aparecerán aquí cuando haya solicitudes por confirmar.',
        descriptionFiltered: 'Ajuste los filtros para encontrar lo que busca.',
      },
    },

    filter: {
      title: 'Filtrar Recepciones',
      search: 'Buscar',
      searchPlaceholder: 'Buscar por descripción/ticket',
      status: 'Estado',
      dateFrom: 'Fecha inicial',
      dateTo: 'Fecha final',
      user: 'Solicitante',
      farm: 'Finca',
      type: 'Tipo',
      responsible: 'Responsable',
    },

    actions: {
      receive: 'Recibir Solicitud',
      receiveToast: 'Solicitud recibida con éxito.',
      view: 'Visualizar',
      sla: 'Informe SLA',
      transfer: 'Transferir Responsable',
      confirmReceipt: 'Confirmar Recepción',
      financial: 'Generar Financiero',
      informPayment: 'Finalizar Pedido',
      changeStatus: 'Retroceder Etapa',
    },

    confirm: {
      pageTitle: 'Confirmar Recepción',
      pageSubtitle: 'Confirme la recepción de los ítems de la solicitud de compra.',
      fields: {
        code: 'Código',
        responsible: 'Responsable',
        receiptDate: 'Fecha de Recepción',
        nfe: 'Factura',
        purchaseStatus: 'Situación de la Recepción',
        receiptNote: 'Observaciones',
      },
      purchaseStatusOptions: {
        total: 'Compra Recibida',
        parcial: 'Recibida Parcial',
      },
      items: {
        title: 'Ítems',
        empty: 'Ningún ítem para confirmar',
        columns: {
          description: 'Descripción',
          quantity: 'Cantidad',
          status: 'Estado',
          deliveryDate: 'Fecha de Entrega',
        },
      },
      attachments: {
        title: 'Adjuntos',
        addButton: '+ Agregar Adjunto',
        removeButton: 'Eliminar',
        emptyLabel: 'Ningún adjunto agregado',
        fields: {
          name: 'Descripción del Adjunto',
          file: 'Archivo',
        },
        removeLastRowError: 'Mantenga al menos una línea de adjunto.',
        fillBeforeAddError: 'Complete la línea actual antes de agregar otra.',
      },
      validation: {
        nfeRequired: 'La Factura es obligatoria',
        nfeMaxLength: 'La Factura debe tener como máximo 9 caracteres',
        purchaseStatusRequired: 'La Situación de la Recepción es obligatoria',
        receiptDateRequired: 'La Fecha de Recepción es obligatoria',
        receiptNoteMaxLength: 'La observación debe tener como máximo 600 caracteres',
        attachmentFileRequiredWhenTotal: 'El archivo es obligatorio cuando la recepción es Total',
        attachmentNameRequiredWithFile:
          'La Descripción del Adjunto es obligatoria cuando hay un archivo',
      },
      submitToast: 'Recepción confirmada con éxito.',
    },

    financial: {
      pageTitle: 'Generar Financiero',
      pageSubtitle: 'Genere el título financiero referente a la recepción confirmada.',
      fields: {
        vlTotal: 'Valor Total',
        financialNumber: 'Número',
        financialTypeId: 'Tipo de Título',
        financialProprietaryId: 'Propietario',
        financialProviderId: 'Proveedor',
        financialNote: 'Observación',
        hasInput: '¿Tiene Entrada?',
        inputValue: 'Valor de la Entrada',
        inputDate: 'Fecha de la Entrada',
        qtdInstallments: 'Cantidad de Cuotas',
        firstInstallment: 'Fecha de la 1ª Cuota',
        intInstallments: 'Intervalo entre Cuotas (días)',
        fiscalDocument: '¿Documento Fiscal?',
        receiptDate: 'Fecha de Recepción',
        receiptNote: 'Observaciones',
      },
      placeholders: {
        financialTypeId: 'Busque un tipo de título',
        financialProprietaryId: 'Busque un propietario',
        financialProviderId: 'Busque un proveedor',
      },
      hasInputOptions: {
        yes: 'Sí',
        no: 'No',
      },
      fiscalDocumentOptions: {
        yes: 'Sí',
        no: 'No',
      },
      newProviderButton: '+ Nuevo Proveedor',
      installments: {
        title: 'Cuotas',
        sumLabel: 'Suma de las cuotas',
        emptyLabel: 'Ninguna cuota generada',
        columns: {
          dueDate: 'Vencimiento',
          value: 'Valor',
        },
      },
      ratio: {
        title: 'Prorrateo',
        categoryLabel: 'Categoría Financiera',
        centerLabel: 'Centro de Costo',
        planAccountLabel: 'Cuenta Contable',
        percentLabel: 'Porcentaje',
        valueLabel: 'Valor',
        addRowButton: '+ Agregar Prorrateo',
        removeRowButton: 'Eliminar',
        emptyLabel: 'Ningún prorrateo agregado',
        sumLabel: 'Suma del prorrateo',
        sumWarning: 'La suma del prorrateo debe totalizar el 100% del valor.',
      },
      validation: {
        financialNumberMaxLength: 'El número debe tener como máximo 15 caracteres',
        financialTypeIdRequired: 'El Tipo de Título es obligatorio',
        financialNoteRequired: 'La observación es obligatoria',
        financialNoteMaxLength: 'La observación debe tener como máximo 1000 caracteres',
        hasInputRequired: 'Seleccione si tiene entrada',
        inputValueRequired: 'El Valor de la Entrada es obligatorio',
        inputDateRequired: 'La Fecha de la Entrada es obligatoria',
        qtdInstallmentsRequired: 'La Cantidad de Cuotas es obligatoria',
        qtdInstallmentsMin: 'La Cantidad de Cuotas debe ser al menos 1',
        firstInstallmentRequired: 'La Fecha de la 1ª Cuota es obligatoria',
        vlTotalRequired: 'El Valor Total es obligatorio',
        vlTotalPositive: 'El valor del título debe ser mayor que cero',
        financialNumberRequired: 'El Nº de Título es obligatorio',
        providerRequired: 'El Proveedor es obligatorio',
        installmentsAndRatioRequired: 'Ingrese las cuotas a pagar y el prorrateo.',
        ratioTotalDiffers: 'El total del prorrateo difiere del valor total.',
        ratioCategoryRequired: 'La Categoría Financiera es obligatoria',
        ratioCenterRequired: 'El Centro de Costo es obligatorio',
      },
      freezeErrorFallback: 'No fue posible generar el financiero — período financiero congelado.',
      submitToast: 'Financiero generado con éxito.',
    },

    informPayment: {
      pageTitle: 'Finalizar Pedido',
      pageSubtitle: 'Informe los datos de pago para finalizar el pedido.',
      fields: {
        finalDate: 'Fecha de Finalización',
        status: 'Estado',
        nfe: 'Factura',
        finalizationNote: 'Observación de Finalización',
      },
      statusOptions: {
        pedidoFinalizado: 'Pedido Finalizado',
      },
      validation: {
        finalDateRequired: 'La Fecha de Finalización es obligatoria',
        nfeRequired: 'La Factura es obligatoria',
        nfeMaxLength: 'La Factura debe tener como máximo 9 caracteres',
      },
      submitToast: 'Pedido finalizado con éxito.',
    },
  },
};
