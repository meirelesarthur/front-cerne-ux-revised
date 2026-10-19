// src/constants/languages/languageEsEs/languageDfes.ts
// Traducción ES del módulo "DFe Recebidas" (Dfe — dominio Fiscal, ejecución
// 044, TASK-DFE-FE-03). Espejo estructural de
// `languageBaseRegistrations.nfse` (mismo dominio Fiscal).

import { ModuleDfes } from '@/@types/language/module-dfes';

export const languageDfes: ModuleDfes = {
  dfe: {
    singularLabel: 'DFe Recibido',
    pluralLabel: 'DFe Recibidos',

    list: {
      pageTitle: 'DFe Recibidos',
      pageSubtitle: 'Administre los documentos fiscales electrónicos recibidos vía SEFAZ.',
      table: {
        integrationStatus: 'Estado',
        emissor: 'Emisor',
        // LST-04/LST-05 (contrato-dfe-norm.md) — agregadas en TASK-DFE-FE-05
        // (ausentes en la fundación de TASK-DFE-FE-03, gap cerrado aquí).
        ieFornecedor: 'IE Proveedor',
        ieDestinatario: 'IE Destinatario',
        cpfCnpj: 'CPF/CNPJ',
        numero: 'Número',
        valor: 'Valor',
        dtEmissao: 'Fecha Emisión',
        manifesto: 'Manifiesto',
        prazoManifesto: 'Plazo Manifiesto',
        lancada: 'Lanzada',
        chave: 'Clave de Acceso',
      },
      manifestoOptions: {
        naoManifestada: 'No manifestada',
        ciencia: 'Ciencia de la Operación',
        confirmacao: 'Confirmación de la Operación',
        desconhecimento: 'Desconocimiento de la Operación',
        naoRealizada: 'Operación no Realizada',
      },
      prazoManifesto: {
        manifestado: 'Manifestado',
        restamDias: 'quedan {{days}} día(s)',
        encerrado: 'Plazo cerrado',
      },
      launchedOptions: {
        produto: 'Producto',
        animal: 'Animal',
        despesa: 'Gasto',
        abate: 'Faena',
        naoLancada: 'No lanzada',
      },
      actions: {
        manifestar: 'Manifestar',
        alternarPessoal: 'Alternar personal',
        alternarRemessa: 'Alternar remesa',
        lancarProduto: 'Lanzar Producto',
        lancarAnimal: 'Lanzar Animal',
        lancarDespesa: 'Lanzar Gasto',
        lancarRetorno: 'Lanzar Retorno',
        gerarDanfe: 'Generar DANFE',
        baixarXml: 'Descargar XML',
      },
      bulkSelection: {
        limitExceeded: 'Seleccione como máximo 20 documentos a la vez.',
        selectAllDisabledHint:
          '"Seleccionar todos" solo está disponible con hasta 20 ítems en la página.',
      },
      emptyState: {
        titleNoIssuer: 'Seleccione el Emisor',
        descriptionNoIssuer: 'Seleccione el Emisor para filtrar y listar los DFe recibidos.',
        titleEmpty: 'Ningún DFe sincronizado todavía.',
        descriptionEmpty: 'Use "Buscar DFe" para sincronizar los documentos de este Emisor.',
        titleFiltered: 'Ningún DFe encontrado.',
        descriptionFiltered: 'Intente ajustar los filtros o el período informado.',
      },
      error: {
        message: 'No fue posible cargar los DFe recibidos.',
        retry: 'Intentar de nuevo',
      },
      downloadXmlError: 'No fue posible descargar el XML de este DFe.',
      downloadXmlSuccess: 'XML descargado con éxito',
      generateDanfeError: 'No fue posible generar el DANFE de este DFe.',
      toggleSuccess: 'Actualizado con éxito',
      toggleError: 'No fue posible actualizar este DFe.',
      launchXmlDownloadError: 'No fue posible descargar el XML para lanzar.',
      launchGenericError: 'No fue posible iniciar el lanzamiento de este DFe.',
    },

    filter: {
      title: 'Filtrar DFe Recibidos',
      issuer: 'Seleccione el Emisor',
      issuerPlaceholder: 'Buscar emisor fiscal...',
      issuerRequired: 'Obligatorio para listar mejor',
      search: 'Buscar',
      searchPlaceholder: 'Buscar por clave, número o CPF/CNPJ',
      dateFrom: 'Emitida desde',
      dateTo: 'Emitida hasta',
      dateRangeInvalid: 'La fecha final es anterior a la fecha inicial.',
      launched: 'Lanzada',
      launchedAll: 'Todas',
      launchedOptions: {
        yes: 'Sí',
        no: 'No',
      },
      status: 'Manifiesto',
      statusAll: 'Todos',
      isPersonal: 'Personal',
      isPersonalAll: 'Todos',
      isShipment: 'Remesa',
      isShipmentAll: 'Todos',
    },

    syncScreen: {
      pageTitle: 'Buscar DFe',
      pageSubtitle: 'Consulte los documentos fiscales electrónicos recibidos por este Emisor.',
      issuer: 'Seleccione el Emisor',
      issuerPlaceholder: 'Buscar emisor fiscal...',
      issuerRequired: 'Seleccione un Emisor Fiscal',
      submitButton: 'Consultar DF-e',
      loadingMessage:
        'Consultando el webservice nacional... esto puede tardar algunos segundos o minutos.',
      successToast: 'Sincronización con SEFAZ completada.',
      errorToast: 'No fue posible consultar los DF-e de este Emisor.',
      certificateMissingError:
        'Este Emisor no tiene certificado digital A1 registrado. Registre el certificado para consultar DF-e.',
      certificateMissingLink: 'Ir al certificado del Emisor',
      syncInProgress: 'La sincronización de este emisor ya está en curso.',
      environmentMissingError:
        'Este Emisor no tiene el ambiente SEFAZ (producción/homologación) configurado. Configure el ambiente en el registro del Emisor.',
      environmentMissingLink: 'Ir al registro del Emisor',
      emptyIssuerState: 'Seleccione un Emisor para consultar los DF-e.',
    },

    manifest: {
      modalTitle: 'Manifestar DFe',
      modalTitleBatch: 'Manifestar {{count}} DFe seleccionados',
      description: 'Seleccione el evento de manifestación a transmitir a SEFAZ.',
      fields: {
        evento: 'Evento',
        eventoPlaceholder: 'Seleccione el evento',
        justificativa: 'Justificación',
        justificativaPlaceholder: 'Describa el motivo (mínimo 15 caracteres)',
      },
      confirmButton: 'Confirmar Manifestación',
      cancelButton: 'Cancelar',
      successMessage: 'Manifestación enviada con éxito',
      errorMessage: 'No fue posible enviar la manifestación a SEFAZ.',
      validation: {
        eventoRequired: 'Seleccione el evento de manifestación',
        justificativaRequired: 'La justificación es obligatoria para este evento',
        justificativaMin: 'La justificación debe tener al menos 15 caracteres',
      },
      eventOptions: {
        ciencia: 'Ciencia de la Operación',
        confirmacao: 'Confirmación de la Operación',
        desconhecimento: 'Desconocimiento de la Operación',
        naoRealizada: 'Operación no Realizada',
      },
      deadlineDisabledHint: 'Opción no disponible — plazo de manifestación cerrado.',
    },

    report: {
      pageTitle: 'DFe/Lanzadas',
      pageSubtitle:
        'Genere el informe de documentos fiscales electrónicos y su estado de lanzamiento.',
      fields: {
        issuer: 'Seleccione el Emisor',
        issuerPlaceholder: 'Buscar emisor fiscal...',
        issuerRequired: 'El Emisor es obligatorio para generar el informe',
        dateEmissionFrom: 'Emitida desde',
        dateEmissionTo: 'Emitida hasta',
        dateLaunchFrom: 'Lanzada desde',
        dateLaunchTo: 'Lanzada hasta',
        launched: 'Lanzada',
        launchedAll: 'Todas',
        reportType: 'Tipo de Informe',
      },
      reportTypeOptions: {
        pdf: 'PDF',
        excel: 'Excel',
      },
      submitButton: 'Generar informe',
      loadingMessage: 'Generando el informe... esto puede tardar algunos segundos.',
      successToast: 'Informe generado con éxito',
      errorToast: 'No fue posible generar el informe de DFe.',
      issuerRequiredError: 'Seleccione el Emisor antes de generar el informe.',
    },

    return: {
      pageTitle: 'Vincular Retorno',
      pageSubtitle: 'Seleccione la venta pendiente a vincular con esta NFe de retorno.',
      filter: {
        type: 'Tipo de Vínculo',
        typeAll: 'Todos',
        typeOptions: {
          sale: 'Venta Animal',
          slaughterMap: 'Romaneo',
        },
        date: 'Fecha',
        search: 'Buscar',
        searchPlaceholder: 'Buscar por código o cliente',
      },
      table: {
        code: 'Código',
        client: 'Cliente',
        date: 'Fecha',
        amount: 'Valor',
      },
      emptyState: {
        title: 'Ninguna venta pendiente para este Emisor.',
        description: 'No hay ventas pendientes de finalización para el CPF/CNPJ de esta NFe.',
      },
      acceptSuggestionButton: 'Aceptar sugerencia',
      suggestionsTitle: 'Sugerencias',
      notReturnError: 'Este DF-e no es de retorno.',
      alreadyLaunchedError: 'Este DF-e ya fue registrado.',
      loadError: 'No se pudieron cargar los candidatos del retorno.',
      linkAndFinishButton: 'Vincular y finalizar',
      backButton: 'Volver',
    },
  },
};
