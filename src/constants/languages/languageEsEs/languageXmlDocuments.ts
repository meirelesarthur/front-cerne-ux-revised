// src/constants/languages/languageEsEs/languageXmlDocuments.ts
// Traducción es-ES del módulo "Arquivos XML" (F-133, Gestão Fiscal, esteira
// 97-Esteiras/008, Tarefa 36). Obrigatório — sem este arquivo o `tsc` quebra
// (`ModuleXmlDocuments` exigido em `languageEsEs/index.ts`).

import { ModuleXmlDocuments } from '@/@types/language/module-xml-documents';

export const languageXmlDocuments: ModuleXmlDocuments = {
  singularLabel: 'Archivo XML',
  pluralLabel: 'Archivos XML',
  issuersLabel: 'Emisores de Archivos XML',

  pageTitle: 'Archivos XML',
  pageSubtitle:
    'Consulte los documentos fiscales electrónicos (NFe, MDFe, DFe, NFSe) de un emisor y período.',

  filter: {
    issuer: 'Emisor',
    issuerPlaceholder: 'Seleccione el emisor',
    startDate: 'Emitido desde',
    endDate: 'Emitido hasta',
    document: 'Tipo de Documento',
    status: 'Estado',
    launched: 'Lanzada',
    launchedPlaceholder: 'Todas',
    submitButton: 'Consultar',
    clearButton: 'Limpiar',
    incompleteWarning: 'Indique emisor, período, tipo y estado para consultar.',
  },

  documentTypeOptions: {
    todos: 'Todos',
    nfe: 'NFe',
    mdfe: 'MDFe',
    dfe: 'DFe',
    nfse: 'NFSe',
  },

  statusOptions: {
    aprovado: 'Aprobado',
    cancelado: 'Cancelado',
  },

  launchedOptions: {
    yes: 'Sí',
    no: 'No',
  },

  list: {
    table: {
      counterpartyName: 'Nombre / Razón Social',
      chave: 'Clave',
      amount: 'Valor',
      state: 'Estado',
      emittedAt: 'Fecha de Emisión',
    },
    groupFooterCount: '{{count}} docs',
  },

  totalsLabel: 'Total general',
  awaitingFiltersTitle: 'Esperando filtros',
  awaitingFiltersDescription:
    'Indique emisor, período, tipo y estado y haga clic en Consultar para listar los archivos XML.',
  emptyTitle: 'No se encontraron documentos.',
  emptyDescription: 'No hay documentos en el período para los filtros informados.',
  errorMessage: 'No fue posible consultar los archivos XML.',

  copiedKeyLabel: '¡Clave copiada!',
  copyKeyError: 'No fue posible copiar la clave.',

  actions: {
    downloadZip: 'Descargar ZIP',
    sendEmail: 'Enviar por correo',
    noun: 'seleccionados',
    clearSelection: 'Limpiar selección',
    selectAllInGroup: 'Seleccionar todos de este grupo',
    downloadSuccess: 'ZIP descargado con éxito.',
    downloadError: 'No fue posible descargar el ZIP de los archivos XML.',
    sendEmailSuccess:
      'El envío de los archivos XML por correo fue encolado con éxito. Los contadores vinculados al emisor recibirán el ZIP por correo en instantes.',
    sendEmailError: 'No fue posible encolar el envío de los archivos XML por correo.',
    notExportableReason:
      'El XML de este tipo de documento aún no está disponible para exportación.',
  },
};
