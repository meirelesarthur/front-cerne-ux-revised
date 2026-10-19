// src/constants/languages/languageEsEs/languageCteManifestacoes.ts
// Traducción ES-ES del módulo de Manifestación de CT-e (CteManifestacao —
// dominio Fiscal, ejecución 045, Onda 2, TASK-CTE-FE-12/13).

import { ModuleCteManifestacoes } from '@/@types/language/module-cte-manifestacoes';

export const languageCteManifestacoes: ModuleCteManifestacoes = {
  cteManifestacao: {
    singularLabel: 'Manifestación de CT-e',
    pluralLabel: 'Manifestaciones de CT-e',

    list: {
      pageTitle: 'Manifestación de CT-e',
      pageSubtitle: 'Consulte y manifieste desacuerdo sobre CT-es recibidos de terceros.',
      helpLink: 'Ayuda',
      consultarButton: 'Consultar nuevos documentos',
      table: {
        nome: 'Proveedor',
        documento: 'CPF/CNPJ',
        valor: 'Valor',
        dataEmissao: 'Fecha de emisión',
        tipo: 'Manifiesto',
        prazo: 'Plazo de manifiesto',
      },
      prazo: {
        manifestado: 'Manifestado',
        diasRestantes: 'Quedan {{days}} días',
        encerrado: 'Cerrado',
      },
      actionsMenu: {
        manifestarDesacordo: 'Manifestar desacuerdo',
        gerarDanfe: 'Generar DANFE',
        baixarXml: 'Descargar XML',
      },
      emptyState: {
        title: 'Ninguna manifestación encontrada.',
        description: 'Use "Consultar nuevos documentos" para buscar CT-es recibidos en la SEFAZ.',
      },
      error: {
        message: 'No se pudieron cargar las manifestaciones de CT-e.',
        retry: 'Intentar de nuevo',
      },
      danfeError: 'No se pudo generar el DANFE de esta manifestación.',
      xmlError: 'No se pudo descargar el XML de esta manifestación.',
    },

    filter: {
      title: 'Filtrar manifestaciones',
      issuer: 'Emisor',
      issuerPlaceholder: 'Seleccione el emisor',
      search: 'Buscar',
      searchPlaceholder: 'Nombre del proveedor',
      startDate: 'Emitido desde',
      endDate: 'Emitido hasta',
      dateRangeInvalid: 'La fecha final es anterior a la fecha inicial.',
      dateFilterNotSupportedNotice:
        'Filtro de fecha no soportado por la SEFAZ para este informe — los campos abajo no alteran el resultado.',
    },

    tipoOptions: {
      pendente: 'Pendiente',
      desacordo: 'Manifestado (Desacuerdo)',
    },

    consultarDialog: {
      title: 'Consultar nuevos documentos',
      description:
        'Busca en la SEFAZ nuevos CT-es recibidos para el emisor seleccionado. Los documentos ya importados no se duplican.',
      issuer: 'Emisor',
      issuerPlaceholder: 'Seleccione el emisor',
      issuerRequired: 'Seleccione un emisor para consultar.',
      submitButton: 'Consultar',
      cancelButton: 'Cancelar',
      errorMessage: 'No se pudieron consultar nuevos documentos.',
    },

    manifestarDialog: {
      title: 'Manifestar desacuerdo',
      description:
        'Registra la manifestación de "Prestación del Servicio en Desacuerdo" ante la SEFAZ para este CT-e.',
      justificativa: 'Justificación',
      justificativaPlaceholder: 'Describa el motivo del desacuerdo (mínimo 15 caracteres)',
      submitButton: 'Manifestar',
      cancelButton: 'Cancelar',
      successMessage: 'Desacuerdo manifestado con éxito.',
      errorMessage: 'No se pudo manifestar el desacuerdo.',
      validation: {
        justificativaRequired: 'Informe la justificación.',
        justificativaMin: 'La justificación debe tener como mínimo 15 caracteres.',
      },
    },
  },
};

export default languageCteManifestacoes;
