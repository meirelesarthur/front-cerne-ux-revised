// src/constants/languages/languageEsEs/languageMdfes.ts
// Traducción ES del módulo "MDFe" (Mdfe — dominio Fiscal-Transporte,
// ejecución 045, Onda 1, TASK-MDFE-FE-01).

import { ModuleMdfes } from '@/@types/language/module-mdfes';

export const languageMdfes: ModuleMdfes = {
  mdfe: {
    titleModule: 'MDFe',
    singularLabel: 'MDFe',
    pluralLabel: 'MDFes',

    list: {
      pageTitle: 'MDFe',
      pageSubtitle: 'Administre los Manifiestos Electrónicos de Documentos Fiscales.',
      deletedToast: 'MDFe eliminado con éxito',
      table: {
        integrationStatus: '',
        numero: '#',
        emissor: 'Emisor',
        dataInicioViagem: 'Fecha inicio de viaje',
        cnpjContratante: 'CNPJ Contratante',
        estado: 'Estado',
        quantidadeCarga: 'Cant. carga',
        valorCarga: 'Valor carga',
        mdfeNumero: 'Número MDFe',
      },
      actions: {
        edit: 'Editar',
        delete: 'Eliminar',
        view: 'Ver',
        print: 'Imprimir',
      },
      emptyState: {
        titleEmpty: 'Ningún MDFe registrado.',
        descriptionEmpty: 'Comience agregando el primer MDFe.',
        titleFiltered: 'Ningún MDFe encontrado.',
        descriptionFiltered: 'Intente ajustar los filtros o limpiar la búsqueda.',
        cta: 'Nuevo MDFe',
      },
      naoEncerradosButton: 'No cerrados',
      helpButton: 'Ayuda',
      quotaBlockedMessage:
        'Se alcanzó la cuota mensual de emisión de MDFe de su plan. Contacte al soporte para aumentar el límite.',
      printError: 'No fue posible generar el informe del MDFe.',
    },

    filter: {
      title: 'Filtrar MDFe',
      estado: 'Estado',
      estadoAll: 'Todos',
      dataInicioViagemDe: 'Inicio de viaje desde',
      dataInicioViagemAte: 'Inicio de viaje hasta',
      emissor: 'Emisor',
      veiculo: 'Vehículo',
    },

    estadoOptions: {
      novo: 'Nuevo',
      aprovado: 'Aprobado',
      rejeitado: 'Rechazado',
      cancelado: 'Cancelado',
    },

    cargaPosteriorOptions: {
      yes: 'Sí',
      no: 'No',
    },

    typeEmissionOptions: {
      normal: 'Normal',
      contingencia: 'Contingencia',
    },

    tabs: {
      geral: 'General',
      transporte: 'Transporte',
      descarga: 'Descarga',
    },

    form: {
      title: { create: 'Nuevo MDFe', edit: 'Editar MDFe' },
      editBlockedToast: {
        title: 'Edición bloqueada',
        description: 'Este MDFe ya no se puede editar en su estado actual.',
      },
      subtitle: {
        create: 'Registre un nuevo Manifiesto Electrónico de Documentos Fiscales.',
        edit: 'Actualice los datos del MDFe.',
      },
      fields: {
        ufInicio: 'Estado inicio',
        ufFim: 'Estado fin',
        dataInicioViagem: 'Fecha inicio de viaje',
        cargaPosterior: 'Carga posterior',
        typeEmission: 'Tipo de emisión',
        cnpjContratante: 'CNPJ Contratante',
        quantidadeCarga: 'Cantidad de carga',
        valorCarga: 'Valor de la carga',
        produtoPredNome: 'Producto predominante',
        produtoPredNcm: 'NCM',
        produtoPredCodBarras: 'Código de barras',
        cepCarrega: 'CP de carga',
        cepDescarrega: 'CP de descarga',
        latitudeCarregamento: 'Latitud de carga',
        longitudeCarregamento: 'Longitud de carga',
        latitudeDescarregamento: 'Latitud de descarga',
        longitudeDescarregamento: 'Longitud de descarga',
        tpCarga: 'Tipo de carga',
        seguradoraNome: 'Aseguradora',
        seguradoraCnpj: 'CNPJ de la aseguradora',
        numeroApolice: 'Número de póliza',
        numeroAverbacao: 'Número de anotación',
        infoComplementar: 'Información complementaria',
        infoAdicionalFisco: 'Información adicional para el fisco',
        veiculoTracao: 'Vehículo de tracción',
        veiculoReboque: 'Remolque 1',
        veiculoReboque2: 'Remolque 2',
        veiculoReboque3: 'Remolque 3',
        tpEmit: 'Tipo de emisor',
        tpTransp: 'Tipo de transportista',
        lacRodo: 'Precinto vial',
        condutorNome: 'Nombre del conductor',
        condutorCpf: 'CPF del conductor',
      },
      cancelButton: 'Cancelar',
      saveDisabledTooltip: {
        prefix: 'Para guardar, complete: ',
        municipioCarregamento: 'Municipio de Carga',
        infoDescarga: 'Información de Descarga',
        condutorNome: 'Nombre del conductor',
        condutorCpf: 'CPF del conductor',
      },
      saveButton: 'Guardar',
    },

    municipiosCarregamento: {
      sectionTitle: 'Municipios de carga',
      cidade: 'Ciudad',
      addButton: 'Agregar',
      removeButton: 'Quitar',
      emptyText: 'Ningún municipio agregado.',
      columnCidade: 'Ciudad',
    },

    percurso: {
      sectionTitle: 'Recorrido (estados)',
      uf: 'Estado',
      addButton: 'Agregar',
      removeButton: 'Quitar',
      emptyText: 'Ningún estado de recorrido agregado.',
      columnUf: 'Estado',
    },

    ciot: {
      sectionTitle: 'CIOTs',
      codigo: 'Código',
      cpfCnpj: 'CPF/CNPJ',
      addButton: 'Agregar',
      removeButton: 'Quitar',
      emptyText: 'Ningún CIOT agregado.',
      stagingMessage: 'Informe código y documento',
      columnCodigo: 'Código',
      columnCpfCnpj: 'CPF/CNPJ',
      codeLengthError: 'El CIOT debe tener exactamente 12 dígitos numéricos.',
      requiredForTpEmit:
        'Informe al menos un CIOT: obligatorio para MDF-e de prestador de servicio de transporte (tipo de emisor 1 o 3).',
    },

    valePedagio: {
      sectionTitle: 'Vale peaje',
      cnpjFornecedor: 'CNPJ del proveedor',
      cnpjFornecedorPagador: 'CNPJ del proveedor pagador',
      numeroCompra: 'Número de compra',
      valor: 'Valor',
      addButton: 'Agregar',
      removeButton: 'Quitar',
      emptyText: 'Ningún vale peaje agregado.',
      stagingMessage: 'Informe todos los campos del vale peaje',
    },

    payment: {
      sectionTitle: 'Pagos',
      responsibleName: 'Nombre del responsable',
      responsibleCpfCnpj: 'CPF/CNPJ del responsable',
      paymentType: 'Tipo de pago',
      componentType: 'Tipo de componente',
      amount: 'Valor',
      bankCode: 'Banco',
      agencyCode: 'Agencia',
      cnpjIpef: 'CNPJ IPEF',
      pixKey: 'Clave PIX',
      additionalInfo: 'Información adicional',
      addButton: 'Agregar',
      removeButton: 'Quitar',
      emptyText: 'Ningún pago agregado.',
      stagingMessage: 'Informe nombre, documento y valor',
    },

    infoDescarga: {
      sectionTitle: 'Información de descarga',
      tpUnidTransp: 'Tipo de unidad de transporte',
      idUnidTransp: 'Identificación (placa)',
      quantidadeRateio: 'Cantidad de prorrateo',
      cidade: 'Ciudad de descarga',
      chaveNfe: 'Clave NFe',
      segCodNfe: 'Código de seguridad NFe',
      chaveCte: 'Clave CTe',
      segCodCte: 'Código de seguridad CTe',
      addButton: 'Agregar',
      removeButton: 'Quitar',
      emptyText: 'Ninguna descarga agregada.',
      stagingMessage: 'Informe tipo de unidad, identificación, cantidad de prorrateo y ciudad',
      incompletePairMessage:
        'Informe la clave y el código de seguridad juntos, o deje ambos en blanco',
      unidadeCarga: {
        sectionTitle: 'Unidad de carga',
        idUnidadeCarga: 'Identificación',
        quantidadeRateio: 'Cantidad de prorrateo',
        addButton: 'Agregar',
        removeButton: 'Quitar',
      },
      lacreUnidadeCarga: {
        sectionTitle: 'Precinto de unidad de carga',
        numero: 'Número',
        addButton: 'Agregar',
        removeButton: 'Quitar',
      },
      lacreTransporte: {
        sectionTitle: 'Precinto de transporte',
        numero: 'Número',
        addButton: 'Agregar',
        removeButton: 'Quitar',
      },
    },

    tpEmit: {
      prestadorServico: 'Prestador de servicio',
      transportadorProprio: 'Transportista propio',
    },

    tpTransp: {
      etc: 'ETC',
      tac: 'TAC',
      ctc: 'CTC',
    },

    tipoCarga: {
      tc01: 'Granel sólido',
      tc02: 'Granel líquido',
      tc03: 'Frigorificada',
      tc04: 'Contenedorizada',
      tc05: 'Carga general',
      tc06: 'Neogranel',
      tc07: 'Peligrosa (granel sólido)',
      tc08: 'Peligrosa (granel líquido)',
      tc09: 'Peligrosa (frigorificada)',
      tc10: 'Peligrosa (contenedorizada)',
      tc11: 'Peligrosa (carga general)',
    },

    paymentType: {
      pago: 'Pagado',
      aPagar: 'Por pagar',
    },

    componentType: {
      valePedagio: 'Vale peaje',
      impostosTaxas: 'Impuestos/Tasas',
      despesas: 'Gastos',
      outros: 'Otros',
    },

    unidadeTransporte: {
      u1: 'Tracción vial',
      u2: 'Remolque vial',
      u3: 'Buque',
      u4: 'Barcaza',
      u5: 'Aeronave',
      u6: 'Vagón',
      u7: 'Otros',
    },

    naoEncerrados: {
      pageTitle: 'MDFes no cerrados',
      pageSubtitle: 'Consulte los MDFes aún no cerrados por emisor.',
      emissorRequired: 'Seleccione un emisor para consultar.',
      submitButton: 'Consultar',
      table: {
        chave: 'Clave',
        protocolo: 'Protocolo',
        mdfeNumero: 'Número MDFe',
        createdAt: 'Creado en',
      },
      encerrarButton: 'Cerrar',
      encerrarTooltip: 'Disponible después de la emisión SEFAZ (Onda 2)',
      emptyState: {
        title: 'Ningún MDFe no cerrado encontrado.',
        description: 'Seleccione un emisor y consulte nuevamente.',
      },
    },

    detail: {
      sections: { header: 'Datos del MDFe' },
      fields: { dataEmissao: 'Fecha de Emisión' },
      notFound: {
        title: 'MDFe no encontrado.',
        description: 'El MDFe no existe o fue eliminado.',
        back: 'Volver',
      },
      actions: { edit: 'Editar' },
    },

    emission: {
      panelTitle: 'Emisión SEFAZ',
      emitButton: 'Emitir',
      emitSuccessToast: 'MDFe emitido con éxito.',
      emitGenericError: 'No fue posible emitir el MDFe junto a la SEFAZ.',
      emitModal: {
        title: 'Emitir MDFe',
        description:
          '¿Confirma la emisión de este MDFe junto a la SEFAZ? Esta acción transmite el documento y no puede deshacerse.',
        confirmButton: 'Confirmar Emisión',
        issuerLabel: 'Emisor',
        issuerPlaceholder: 'Seleccione el emisor',
        issuerRequired: 'Seleccione el emisor del MDFe',
        noIssuersAvailable: 'No se encontró ningún emisor elegible para la emisión.',
        loadIssuersError: 'No fue posible cargar los emisores.',
      },
      cancelButton: 'Cancelar MDFe',
      cancelSuccessToast: 'MDFe cancelado con éxito.',
      cancelGenericError: 'No fue posible cancelar el MDFe junto a la SEFAZ.',
      closeButton: 'Cerrar',
      closeSuccessToast: 'MDFe cerrado con éxito.',
      closeGenericError: 'No fue posible cerrar el MDFe junto a la SEFAZ.',
      closeModal: {
        title: 'Cerrar MDFe',
        description:
          '¿Confirma el cierre de este MDFe junto a la SEFAZ? Esta acción no puede deshacerse.',
        confirmButton: 'Confirmar Cierre',
      },
      downloadXmlButton: 'Descargar XML',
      downloadXmlError: 'No fue posible descargar el XML de este MDFe.',
      motivoLabel: 'Motivo',
      motivoRequired: 'Informe el motivo de la cancelación.',
      motivoMinLength: 'El motivo debe tener al menos 15 caracteres.',
      fields: {
        mdfeNumero: 'Número MDFe',
        chave: 'Clave de Acceso',
        protocolo: 'Protocolo',
        dateSendSefaz: 'Fecha de Envío SEFAZ',
      },
      cancelModal: {
        title: 'Cancelar MDFe',
        description:
          'Informe el motivo de la cancelación. Esta acción transmite un evento a la SEFAZ y no puede deshacerse.',
        motivoPlaceholder: 'Describa el motivo de la cancelación (mínimo 15 caracteres)',
        confirmButton: 'Confirmar Cancelación',
      },
    },
  },
};
